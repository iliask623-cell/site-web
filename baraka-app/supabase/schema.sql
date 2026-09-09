-- Baraka — schema Supabase (PostgreSQL)
-- À exécuter dans l'éditeur SQL de ton projet Supabase (https://app.supabase.com)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profils utilisateurs (1 profil par compte auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  role text not null check (role in ('client', 'merchant', 'admin')) default 'client',
  wilaya text not null default '16',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper used by policies below. security definer + a fixed search_path so
-- it can read public.profiles regardless of the caller's own RLS grants.
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer set search_path = public;

create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- IMPORTANT: the admin role must never be self-assignable through the app.
-- Signup always inserts as 'client' or 'merchant'; promote an account to
-- 'admin' by hand from the Supabase dashboard (Table editor > profiles),
-- or with: update public.profiles set role = 'admin' where id = '<uuid>';
create policy "users can insert their own non-admin profile"
  on public.profiles for insert
  with check (auth.uid() = id and role <> 'admin');

create policy "users can update their own non-admin profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (role <> 'admin' or public.is_admin());

-- ---------------------------------------------------------------------------
-- Commerces
-- ---------------------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  category text not null check (category in ('bakery', 'restaurant', 'grocery', 'hotel', 'other')),
  wilaya text not null,
  commune text not null default '',
  address text not null default '',
  whatsapp text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "businesses are viewable by everyone"
  on public.businesses for select
  using (true);

create policy "owners manage their own business"
  on public.businesses for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and blocked = false);

create policy "admins manage any business"
  on public.businesses for update
  using (public.is_admin())
  with check (public.is_admin());

-- Belt-and-suspenders: even if a future policy change lets an owner reach
-- an UPDATE, this trigger silently keeps `blocked` unless the caller is an
-- admin, so a blocked merchant can never unblock themselves through the app.
create or replace function public.protect_business_blocked_field()
returns trigger as $$
begin
  if new.blocked <> old.blocked and not public.is_admin() then
    new.blocked = old.blocked;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_business_update_guard_blocked on public.businesses;
create trigger on_business_update_guard_blocked
  before update on public.businesses
  for each row execute function public.protect_business_blocked_field();

-- ---------------------------------------------------------------------------
-- Paniers surprise
-- ---------------------------------------------------------------------------
create table if not exists public.baskets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null,
  description text not null default '',
  price_original numeric(10, 2) not null check (price_original >= 0),
  price_discounted numeric(10, 2) not null check (price_discounted >= 0),
  quantity_total int not null check (quantity_total >= 0),
  quantity_available int not null check (quantity_available >= 0),
  pickup_start timestamptz not null,
  pickup_end timestamptz not null,
  status text not null check (status in ('active', 'paused', 'sold_out', 'expired', 'cancelled')) default 'active',
  is_iftar boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.baskets enable row level security;

create policy "baskets are viewable by everyone"
  on public.baskets for select
  using (true);

create policy "owners manage baskets of their own business"
  on public.baskets for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Réservations
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  basket_id uuid not null references public.baskets (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  quantity int not null check (quantity > 0),
  status text not null check (status in ('pending', 'picked_up', 'cancelled', 'no_show')) default 'pending',
  pickup_code text not null,
  created_at timestamptz not null default now()
);

alter table public.reservations enable row level security;

create policy "clients view their own reservations"
  on public.reservations for select
  using (
    auth.uid() = client_id
    or exists (
      select 1 from public.baskets bk
      join public.businesses b on b.id = bk.business_id
      where bk.id = basket_id and b.owner_id = auth.uid()
    )
  );

create policy "clients create their own reservations"
  on public.reservations for insert
  with check (auth.uid() = client_id);

create policy "clients cancel their own reservations"
  on public.reservations for update
  using (
    auth.uid() = client_id
    or exists (
      select 1 from public.baskets bk
      join public.businesses b on b.id = bk.business_id
      where bk.id = basket_id and b.owner_id = auth.uid()
    )
  );

create policy "admins view all reservations"
  on public.reservations for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Décrémente la quantité disponible à la réservation, la restaure à l'annulation
-- ---------------------------------------------------------------------------
create or replace function public.handle_reservation_insert()
returns trigger as $$
begin
  update public.baskets
  set
    quantity_available = quantity_available - new.quantity,
    status = case when quantity_available - new.quantity <= 0 then 'sold_out' else status end
  where id = new.basket_id and quantity_available >= new.quantity;

  if not found then
    raise exception 'Quantité insuffisante pour ce panier';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_reservation_insert on public.reservations;
create trigger on_reservation_insert
  after insert on public.reservations
  for each row execute function public.handle_reservation_insert();

create or replace function public.handle_reservation_cancel()
returns trigger as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.baskets
    set
      quantity_available = quantity_available + old.quantity,
      status = case when status = 'sold_out' then 'active' else status end
    where id = old.basket_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_reservation_cancel on public.reservations;
create trigger on_reservation_cancel
  after update on public.reservations
  for each row execute function public.handle_reservation_cancel();

-- ---------------------------------------------------------------------------
-- Index utiles
-- ---------------------------------------------------------------------------
create index if not exists idx_businesses_wilaya on public.businesses (wilaya);
create index if not exists idx_baskets_business on public.baskets (business_id);
create index if not exists idx_baskets_status on public.baskets (status);
create index if not exists idx_reservations_client on public.reservations (client_id);
create index if not exists idx_reservations_basket on public.reservations (basket_id);

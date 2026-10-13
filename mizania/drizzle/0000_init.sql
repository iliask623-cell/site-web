CREATE TYPE "public"."activity_type" AS ENUM('services', 'commerce', 'production', 'freelance', 'other');--> statement-breakpoint
CREATE TYPE "public"."legal_form" AS ENUM('personne_physique', 'auto_entrepreneur', 'eurl', 'sarl', 'snc', 'spa', 'other');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('fr', 'ar');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'member', 'accountant');--> statement-breakpoint
CREATE TYPE "public"."contact_kind" AS ENUM('client', 'supplier');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('individual', 'company');--> statement-breakpoint
CREATE TYPE "public"."direction" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer', 'cheque', 'card', 'ccp', 'baridimob', 'other');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('settled', 'pending', 'cancelled');--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_form" "legal_form",
	"activity_type" "activity_type",
	"sector" text,
	"wilaya" text,
	"address" text,
	"phone" text,
	"email" text,
	"nif" text,
	"nis" text,
	"rc" text,
	"article_imposition" text,
	"fiscal_year_start_month" smallint DEFAULT 1 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_fy_month" CHECK ("organizations"."fiscal_year_start_month" between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"active_organization_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"locale" "locale" DEFAULT 'fr' NOT NULL,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_normalized" CHECK ("users"."email" = lower(btrim("users"."email")))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"direction" "direction" NOT NULL,
	"name" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_org_id_key" UNIQUE("organization_id","id"),
	CONSTRAINT "categories_name_not_blank" CHECK (btrim("categories"."name") <> '')
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"kind" "contact_kind" NOT NULL,
	"contact_type" "contact_type" DEFAULT 'company' NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"wilaya" text,
	"nif" text,
	"nis" text,
	"rc" text,
	"article_imposition" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_org_id_key" UNIQUE("organization_id","id"),
	CONSTRAINT "contacts_name_not_blank" CHECK (btrim("contacts"."name") <> '')
);
--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"direction" "direction" NOT NULL,
	"amount_cents" bigint NOT NULL,
	"occurred_on" date NOT NULL,
	"contact_id" uuid,
	"category_id" uuid,
	"payment_method" "payment_method",
	"status" "transaction_status" DEFAULT 'settled' NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_amount_positive" CHECK ("transactions"."amount_cents" > 0),
	CONSTRAINT "transactions_label_not_blank" CHECK (btrim("transactions"."label") <> '')
);
--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_organization_id_organizations_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contact_fk" FOREIGN KEY ("organization_id","contact_id") REFERENCES "public"."contacts"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_fk" FOREIGN KEY ("organization_id","category_id") REFERENCES "public"."categories"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_user_key" ON "memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_hash_key" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_org_direction_name_key" ON "categories" USING btree ("organization_id","direction",lower("name"));--> statement-breakpoint
CREATE INDEX "contacts_org_kind_name_idx" ON "contacts" USING btree ("organization_id","kind","name");--> statement-breakpoint
CREATE INDEX "transactions_org_date_idx" ON "transactions" USING btree ("organization_id","occurred_on");--> statement-breakpoint
CREATE INDEX "transactions_org_direction_date_idx" ON "transactions" USING btree ("organization_id","direction","occurred_on");--> statement-breakpoint
CREATE INDEX "transactions_contact_idx" ON "transactions" USING btree ("organization_id","contact_id");--> statement-breakpoint
CREATE POLICY "categories_org_isolation" ON "categories" AS PERMISSIVE FOR ALL TO public USING (organization_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (organization_id = nullif(current_setting('app.org_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "contacts_org_isolation" ON "contacts" AS PERMISSIVE FOR ALL TO public USING (organization_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (organization_id = nullif(current_setting('app.org_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "transactions_org_isolation" ON "transactions" AS PERMISSIVE FOR ALL TO public USING (organization_id = nullif(current_setting('app.org_id', true), '')::uuid) WITH CHECK (organization_id = nullif(current_setting('app.org_id', true), '')::uuid);
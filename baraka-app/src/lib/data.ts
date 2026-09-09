import { isSupabaseConfigured, supabase } from './supabase'
import { genId, genPickupCode, mockDb, subscribeMockDb } from './mockStore'
import type {
  Basket,
  BasketStatus,
  BasketWithBusiness,
  Business,
  BusinessCategory,
  Profile,
  Reservation,
  ReservationStatus,
  ReservationWithBasket,
  UserRole,
} from './types'

export { subscribeMockDb }

export interface SignUpInput {
  email: string
  password: string
  fullName: string
  phone: string
  role: UserRole
  wilaya: string
}

// ---------------------------------------------------------------------------
// Mapping Supabase (snake_case) -> types applicatifs (camelCase)
// ---------------------------------------------------------------------------
function mapProfile(row: any): Profile {
  return { id: row.id, fullName: row.full_name, phone: row.phone, role: row.role, wilaya: row.wilaya }
}

function mapBusiness(row: any): Business {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    category: row.category,
    wilaya: row.wilaya,
    commune: row.commune,
    address: row.address,
    whatsapp: row.whatsapp,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    blocked: Boolean(row.blocked),
  }
}

function mapBasket(row: any): Basket {
  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    description: row.description,
    priceOriginal: Number(row.price_original),
    priceDiscounted: Number(row.price_discounted),
    quantityTotal: row.quantity_total,
    quantityAvailable: row.quantity_available,
    pickupStart: row.pickup_start,
    pickupEnd: row.pickup_end,
    status: row.status,
    isIftar: row.is_iftar,
    createdAt: row.created_at,
  }
}

function mapReservation(row: any): Reservation {
  return {
    id: row.id,
    basketId: row.basket_id,
    clientId: row.client_id,
    quantity: row.quantity,
    status: row.status,
    pickupCode: row.pickup_code,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function signUp(input: SignUpInput): Promise<Profile> {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({ email: input.email, password: input.password })
    if (error) throw error
    const userId = data.user?.id
    if (!userId) throw new Error('Inscription incomplète — vérifie ta boîte mail pour confirmer ton compte.')
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: input.fullName,
        phone: input.phone,
        role: input.role,
        wilaya: input.wilaya,
      })
      .select()
      .single()
    if (profileError) throw profileError
    return mapProfile(profileRow)
  }

  const state = mockDb.state
  if (state.credentials[input.email]) {
    throw new Error('Un compte existe déjà avec cet e-mail.')
  }
  const id = genId('user')
  const profile: Profile = { id, fullName: input.fullName, phone: input.phone, role: input.role, wilaya: input.wilaya }
  mockDb.set({
    ...state,
    profiles: [...state.profiles, profile],
    credentials: { ...state.credentials, [input.email]: { password: input.password, profileId: id } },
    currentUserId: id,
  })
  return profile
}

export async function signIn(email: string, password: string): Promise<Profile> {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const userId = data.user?.id
    if (!userId) throw new Error('Connexion impossible.')
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select()
      .eq('id', userId)
      .single()
    if (profileError) throw profileError
    return mapProfile(profileRow)
  }

  const state = mockDb.state
  const cred = state.credentials[email]
  if (!cred || cred.password !== password) {
    throw new Error('E-mail ou mot de passe incorrect.')
  }
  const profile = state.profiles.find((p) => p.id === cred.profileId)
  if (!profile) throw new Error('Profil introuvable.')
  mockDb.set({ ...state, currentUserId: profile.id })
  return profile
}

export async function signOut(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut()
    return
  }
  mockDb.set({ ...mockDb.state, currentUserId: null })
}

export async function getSession(): Promise<Profile | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user.id
    if (!userId) return null
    const { data: profileRow } = await supabase.from('profiles').select().eq('id', userId).single()
    return profileRow ? mapProfile(profileRow) : null
  }
  const state = mockDb.state
  if (!state.currentUserId) return null
  return state.profiles.find((p) => p.id === state.currentUserId) ?? null
}

export function onAuthStateChange(callback: (profile: Profile | null) => void): () => void {
  if (supabase) {
    const client = supabase
    const { data } = client.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user.id
      if (!userId) {
        callback(null)
        return
      }
      const { data: profileRow } = await client.from('profiles').select().eq('id', userId).single()
      callback(profileRow ? mapProfile(profileRow) : null)
    })
    return () => data.subscription.unsubscribe()
  }
  return subscribeMockDb(() => {
    getSession().then(callback)
  })
}

// ---------------------------------------------------------------------------
// Commerces
// ---------------------------------------------------------------------------
export interface CreateBusinessInput {
  ownerId: string
  name: string
  category: BusinessCategory
  wilaya: string
  commune: string
  address: string
  whatsapp: string
  latitude: number
  longitude: number
}

export async function getMyBusiness(ownerId: string): Promise<Business | null> {
  if (supabase) {
    const { data, error } = await supabase.from('businesses').select().eq('owner_id', ownerId).maybeSingle()
    if (error) throw error
    return data ? mapBusiness(data) : null
  }
  return mockDb.state.businesses.find((b) => b.ownerId === ownerId) ?? null
}

export async function createBusiness(input: CreateBusinessInput): Promise<Business> {
  if (supabase) {
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: input.ownerId,
        name: input.name,
        category: input.category,
        wilaya: input.wilaya,
        commune: input.commune,
        address: input.address,
        whatsapp: input.whatsapp,
        latitude: input.latitude,
        longitude: input.longitude,
      })
      .select()
      .single()
    if (error) throw error
    return mapBusiness(data)
  }
  const business: Business = { id: genId('biz'), blocked: false, ...input }
  mockDb.set({ ...mockDb.state, businesses: [...mockDb.state.businesses, business] })
  return business
}

// ---------------------------------------------------------------------------
// Paniers
// ---------------------------------------------------------------------------
export interface ExploreFilter {
  wilaya?: string
  search?: string
}

async function attachBusinesses(baskets: Basket[], businesses: Business[]): Promise<BasketWithBusiness[]> {
  const byId = new Map(businesses.map((b) => [b.id, b]))
  return baskets
    .map((basket) => {
      const business = byId.get(basket.businessId)
      return business ? { ...basket, business } : null
    })
    .filter((b): b is BasketWithBusiness => b !== null)
}

export async function listActiveBaskets(filter: ExploreFilter = {}): Promise<BasketWithBusiness[]> {
  if (supabase) {
    let query = supabase.from('baskets').select('*, business:businesses(*)').eq('status', 'active')
    if (filter.wilaya) query = query.eq('business.wilaya', filter.wilaya)
    const { data, error } = await query.order('pickup_start', { ascending: true })
    if (error) throw error
    let results = (data ?? [])
      .map((row: any) => ({ ...mapBasket(row), business: mapBusiness(row.business) }))
      .filter((b) => !b.business.blocked)
    if (filter.search) {
      const term = filter.search.toLowerCase()
      results = results.filter(
        (b) => b.title.toLowerCase().includes(term) || b.business.name.toLowerCase().includes(term),
      )
    }
    return results
  }

  const state = mockDb.state
  let baskets = state.baskets.filter((b) => b.status === 'active' && b.quantityAvailable > 0)
  let businesses = state.businesses.filter((b) => !b.blocked)
  if (filter.wilaya) {
    businesses = businesses.filter((b) => b.wilaya === filter.wilaya)
    const allowedIds = new Set(businesses.map((b) => b.id))
    baskets = baskets.filter((b) => allowedIds.has(b.businessId))
  }
  let withBusiness = await attachBusinesses(baskets, businesses)
  if (filter.search) {
    const term = filter.search.toLowerCase()
    withBusiness = withBusiness.filter(
      (b) => b.title.toLowerCase().includes(term) || b.business.name.toLowerCase().includes(term),
    )
  }
  return withBusiness.sort((a, b) => a.pickupStart.localeCompare(b.pickupStart))
}

export async function getBasketWithBusiness(id: string): Promise<BasketWithBusiness | null> {
  if (supabase) {
    const { data, error } = await supabase.from('baskets').select('*, business:businesses(*)').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? { ...mapBasket(data), business: mapBusiness(data.business) } : null
  }
  const state = mockDb.state
  const basket = state.baskets.find((b) => b.id === id)
  if (!basket) return null
  const business = state.businesses.find((b) => b.id === basket.businessId)
  if (!business) return null
  return { ...basket, business }
}

export async function listBusinessBaskets(businessId: string): Promise<Basket[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('baskets')
      .select()
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(mapBasket)
  }
  return mockDb.state.baskets
    .filter((b) => b.businessId === businessId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export interface CreateBasketInput {
  businessId: string
  title: string
  description: string
  priceOriginal: number
  priceDiscounted: number
  quantityTotal: number
  pickupStart: string
  pickupEnd: string
  isIftar: boolean
}

export async function createBasket(input: CreateBasketInput): Promise<Basket> {
  if (supabase) {
    const { data, error } = await supabase
      .from('baskets')
      .insert({
        business_id: input.businessId,
        title: input.title,
        description: input.description,
        price_original: input.priceOriginal,
        price_discounted: input.priceDiscounted,
        quantity_total: input.quantityTotal,
        quantity_available: input.quantityTotal,
        pickup_start: input.pickupStart,
        pickup_end: input.pickupEnd,
        is_iftar: input.isIftar,
      })
      .select()
      .single()
    if (error) throw error
    return mapBasket(data)
  }
  const basket: Basket = {
    id: genId('bsk'),
    businessId: input.businessId,
    title: input.title,
    description: input.description,
    priceOriginal: input.priceOriginal,
    priceDiscounted: input.priceDiscounted,
    quantityTotal: input.quantityTotal,
    quantityAvailable: input.quantityTotal,
    pickupStart: input.pickupStart,
    pickupEnd: input.pickupEnd,
    status: 'active',
    isIftar: input.isIftar,
    createdAt: new Date().toISOString(),
  }
  mockDb.set({ ...mockDb.state, baskets: [...mockDb.state.baskets, basket] })
  return basket
}

export async function deleteBasket(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('baskets').delete().eq('id', id)
    if (error) throw error
    return
  }
  mockDb.set({ ...mockDb.state, baskets: mockDb.state.baskets.filter((b) => b.id !== id) })
}

export async function setBasketStatus(id: string, status: BasketStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('baskets').update({ status }).eq('id', id)
    if (error) throw error
    return
  }
  const state = mockDb.state
  mockDb.set({ ...state, baskets: state.baskets.map((b) => (b.id === id ? { ...b, status } : b)) })
}

// ---------------------------------------------------------------------------
// Réservations
// ---------------------------------------------------------------------------
export async function createReservation(basketId: string, clientId: string, quantity: number): Promise<Reservation> {
  const pickupCode = genPickupCode()
  if (supabase) {
    const { data, error } = await supabase
      .from('reservations')
      .insert({ basket_id: basketId, client_id: clientId, quantity, pickup_code: pickupCode })
      .select()
      .single()
    if (error) throw error
    return mapReservation(data)
  }

  const state = mockDb.state
  const basket = state.baskets.find((b) => b.id === basketId)
  if (!basket || basket.quantityAvailable < quantity) {
    throw new Error('Quantité insuffisante pour ce panier.')
  }
  const reservation: Reservation = {
    id: genId('res'),
    basketId,
    clientId,
    quantity,
    status: 'pending',
    pickupCode,
    createdAt: new Date().toISOString(),
  }
  const remaining = basket.quantityAvailable - quantity
  mockDb.set({
    ...state,
    reservations: [...state.reservations, reservation],
    baskets: state.baskets.map((b) =>
      b.id === basketId
        ? { ...b, quantityAvailable: remaining, status: remaining <= 0 ? 'sold_out' : b.status }
        : b,
    ),
  })
  return reservation
}

export async function listMyReservations(clientId: string): Promise<ReservationWithBasket[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, basket:baskets(*, business:businesses(*))')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row: any) => ({
      ...mapReservation(row),
      basket: { ...mapBasket(row.basket), business: mapBusiness(row.basket.business) },
    }))
  }
  const state = mockDb.state
  const mine = state.reservations.filter((r) => r.clientId === clientId)
  const results: ReservationWithBasket[] = []
  for (const r of mine) {
    const basket = state.baskets.find((b) => b.id === r.basketId)
    const business = basket ? state.businesses.find((b) => b.id === basket.businessId) : undefined
    if (basket && business) results.push({ ...r, basket: { ...basket, business } })
  }
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function cancelReservation(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id)
    if (error) throw error
    return
  }
  const state = mockDb.state
  const reservation = state.reservations.find((r) => r.id === id)
  if (!reservation || reservation.status === 'cancelled') return
  mockDb.set({
    ...state,
    reservations: state.reservations.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)),
    baskets: state.baskets.map((b) =>
      b.id === reservation.basketId
        ? { ...b, quantityAvailable: b.quantityAvailable + reservation.quantity, status: 'active' }
        : b,
    ),
  })
}

export interface ReservationWithClient extends Reservation {
  client: Profile
  basket: Basket
}

export async function listBusinessReservations(businessId: string): Promise<ReservationWithClient[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, basket:baskets!inner(*), client:profiles(*)')
      .eq('basket.business_id', businessId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row: any) => ({
      ...mapReservation(row),
      basket: mapBasket(row.basket),
      client: mapProfile(row.client),
    }))
  }
  const state = mockDb.state
  const basketIds = new Set(state.baskets.filter((b) => b.businessId === businessId).map((b) => b.id))
  const results: ReservationWithClient[] = []
  for (const r of state.reservations) {
    if (!basketIds.has(r.basketId)) continue
    const basket = state.baskets.find((b) => b.id === r.basketId)
    const client = state.profiles.find((p) => p.id === r.clientId)
    if (basket && client) results.push({ ...r, basket, client })
  }
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function setReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (error) throw error
    return
  }
  const state = mockDb.state
  mockDb.set({ ...state, reservations: state.reservations.map((r) => (r.id === id ? { ...r, status } : r)) })
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------
export async function listAllBusinesses(): Promise<Business[]> {
  if (supabase) {
    const { data, error } = await supabase.from('businesses').select().order('name', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapBusiness)
  }
  return [...mockDb.state.businesses].sort((a, b) => a.name.localeCompare(b.name))
}

export async function setBusinessBlocked(id: string, blocked: boolean): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('businesses').update({ blocked }).eq('id', id)
    if (error) throw error
    return
  }
  const state = mockDb.state
  mockDb.set({ ...state, businesses: state.businesses.map((b) => (b.id === id ? { ...b, blocked } : b)) })
}

export interface ReservationWithBasketAndBusiness extends Reservation {
  basket: BasketWithBusiness
  client: Profile
}

export async function listAllReservations(): Promise<ReservationWithBasketAndBusiness[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, basket:baskets(*, business:businesses(*)), client:profiles(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((row: any) => ({
      ...mapReservation(row),
      basket: { ...mapBasket(row.basket), business: mapBusiness(row.basket.business) },
      client: mapProfile(row.client),
    }))
  }
  const state = mockDb.state
  const results: ReservationWithBasketAndBusiness[] = []
  for (const r of state.reservations) {
    const basket = state.baskets.find((b) => b.id === r.basketId)
    const business = basket ? state.businesses.find((b) => b.id === basket.businessId) : undefined
    const client = state.profiles.find((p) => p.id === r.clientId)
    if (basket && business && client) results.push({ ...r, basket: { ...basket, business }, client })
  }
  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export { isSupabaseConfigured }

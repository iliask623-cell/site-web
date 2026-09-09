import type { Basket, Business, Profile, Reservation } from './types'
import { seedBaskets, seedBusinesses, seedCredentials, seedProfiles, seedReservations } from './mockData'

interface MockDb {
  profiles: Profile[]
  businesses: Business[]
  baskets: Basket[]
  reservations: Reservation[]
  currentUserId: string | null
  credentials: Record<string, { password: string; profileId: string }>
}

// Bump this suffix whenever the shape of seeded/stored data changes, so
// visitors with an older localStorage snapshot get a clean reseed instead
// of a stale/incompatible shape.
const STORAGE_KEY = 'baraka_mock_db_v2'

function seedDb(): MockDb {
  return {
    profiles: [...seedProfiles],
    businesses: [...seedBusinesses],
    baskets: [...seedBaskets],
    reservations: [...seedReservations],
    currentUserId: null,
    credentials: { ...seedCredentials },
  }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedDb()
    return JSON.parse(raw) as MockDb
  } catch {
    return seedDb()
  }
}

let db = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // storage unavailable (private mode, quota) — keep in-memory only
  }
  listeners.forEach((l) => l())
}

export function subscribeMockDb(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function genPickupCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export const mockDb = {
  get state() {
    return db
  },
  set(next: MockDb) {
    db = next
    persist()
  },
  reset() {
    db = seedDb()
    persist()
  },
}

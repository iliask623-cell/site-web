export type UserRole = 'client' | 'merchant'

export interface Profile {
  id: string
  fullName: string
  phone: string
  role: UserRole
  wilaya: string
}

export type BusinessCategory = 'bakery' | 'restaurant' | 'grocery' | 'hotel' | 'other'

export interface Business {
  id: string
  ownerId: string
  name: string
  category: BusinessCategory
  wilaya: string
  commune: string
  address: string
  whatsapp: string
}

export type BasketStatus = 'active' | 'sold_out' | 'expired' | 'cancelled'

export interface Basket {
  id: string
  businessId: string
  title: string
  description: string
  priceOriginal: number
  priceDiscounted: number
  quantityTotal: number
  quantityAvailable: number
  pickupStart: string
  pickupEnd: string
  status: BasketStatus
  isIftar: boolean
  createdAt: string
}

export type ReservationStatus = 'pending' | 'picked_up' | 'cancelled' | 'no_show'

export interface Reservation {
  id: string
  basketId: string
  clientId: string
  quantity: number
  status: ReservationStatus
  pickupCode: string
  createdAt: string
}

export interface BasketWithBusiness extends Basket {
  business: Business
}

export interface ReservationWithBasket extends Reservation {
  basket: BasketWithBusiness
}

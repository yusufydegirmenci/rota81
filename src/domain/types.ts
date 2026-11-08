// Alan modeli. Tüm para tutarları kuruş cinsinden tam sayıdır (kayan nokta yok).
// PROTOTİP: gerçek bir veritabanı yoktur; bu tipler ileride PostgreSQL şemasına karşılık gelir.

export type Role = 'citizen' | 'cityAdmin' | 'nationalAdmin'
export type Permission =
  | 'wallet:own'
  | 'card:own'
  | 'city:read:own'
  | 'city:write:own'
  | 'tariff:draft:own'
  | 'tariff:approve'
  | 'city:read:all'
  | 'users:manage'
  | 'audit:read:all'
  | 'audit:read:own'
  | 'config:manage'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  cityId?: string // yalnızca cityAdmin için: yönetebildiği tek il
  status: 'active' | 'suspended'
  createdAt: string
}

export interface City {
  id: string // plaka kodu: "06"
  name: string
  region: string
  status: 'active' | 'pilot' | 'planned'
  population?: number
  adminUserId?: string
  hasDemoData: boolean
}

export type ModeId = 'bus' | 'metro' | 'tram' | 'ferry' | 'rail'

export interface Operator {
  id: string
  cityId: string
  name: string
  modes: ModeId[]
  status: 'active' | 'suspended'
}

export interface Stop {
  id: string
  cityId: string
  name: string
  lat: number
  lon: number
  accessible: boolean
}

export interface Route {
  id: string
  cityId: string
  operatorId: string
  code: string
  name: string
  mode: ModeId
  stopIds: string[] // sıralı
  minutesBetween: number[] // ardışık duraklar arası dakika (stopIds.length - 1)
  headwayMin: number
  status: 'active' | 'maintenance' | 'closed'
}

export interface FareProduct {
  id: string
  cityId: string
  mode: ModeId
  name: string // "Tam", "Öğrenci"...
}

export type FareStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'superseded'
export interface FareVersion {
  id: string
  productId: string
  cityId: string
  version: number
  amount: number // kuruş
  validFrom: string | null // onaylandığında dolar
  validTo: string | null // yeni sürüm onaylanınca dolar
  status: FareStatus
  createdBy: string
  createdAt: string
  note?: string
}

export interface Card {
  id: string
  userId: string
  number: string // simüle
  status: 'active' | 'frozen'
  createdAt: string
}

export interface Wallet {
  id: string
  userId: string
  balance: number // kuruş, önbellek; gerçek kaynak: işlemlerin toplamı
}

export type TxType = 'topup' | 'spend' | 'refund'
export type TxStatus = 'completed' | 'refunded' | 'failed'
export interface WalletTransaction {
  id: string
  walletId: string
  type: TxType
  amount: number // her zaman pozitif; yön type ile belirlenir
  status: TxStatus
  description: string
  idempotencyKey: string
  relatedTxId?: string
  fareVersionId?: string
  cityId?: string
  createdAt: string
  simulated: true
}

export interface JourneyLeg {
  kind: 'ride' | 'walk' | 'transfer'
  routeId?: string
  mode?: ModeId
  fromStopId: string
  toStopId: string
  minutes: number
  fare: number
  fareVersionId?: string
}
export interface Journey {
  cityId: string
  legs: JourneyLeg[]
  totalMinutes: number
  totalFare: number
  transfers: number
}

export interface ServiceAlert {
  id: string
  cityId: string
  title: string
  body: string
  severity: 'info' | 'warning' | 'critical'
  createdAt: string
  createdBy: string
}

export interface AuditLog {
  id: string
  at: string
  actorId: string
  actorName: string
  action: string
  cityId?: string
  target?: string
  result: 'success' | 'denied'
  detail?: string
}

export interface Session {
  userId: string
}

export interface AppData {
  users: User[]
  cities: City[]
  operators: Operator[]
  stops: Stop[]
  routes: Route[]
  fareProducts: FareProduct[]
  fareVersions: FareVersion[]
  cards: Card[]
  wallets: Wallet[]
  transactions: WalletTransaction[]
  alerts: ServiceAlert[]
  audit: AuditLog[]
  notifications: { id: string; userId: string; text: string; at: string; read: boolean }[]
  favorites: { userId: string; cityId: string; fromStopId: string; toStopId: string }[]
  policies: { id: string; title: string; body: string; updatedAt: string }[]
  integrations: { id: string; name: string; status: 'planned' | 'simulated' | 'unavailable'; note: string }[]
  journeys: { id: string; userId: string; at: string; cityId: string; totalFare: number; fareVersionIds: string[]; legs: number }[]
}

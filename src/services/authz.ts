import type { Permission, Role, Session, User } from '../domain/types'
import type { Store } from './store'

export class AuthError extends Error {
  constructor(message: string, public code: 'unauthenticated' | 'forbidden' | 'validation' | 'conflict' | 'not_found') {
    super(message)
  }
}

const PERMISSIONS: Record<Role, Permission[]> = {
  citizen: ['wallet:own', 'card:own'],
  cityAdmin: ['city:read:own', 'city:write:own', 'tariff:draft:own', 'audit:read:own'],
  nationalAdmin: ['city:read:all', 'tariff:approve', 'users:manage', 'audit:read:all', 'config:manage'],
}
export const permissionsFor = (role: Role): Permission[] => PERMISSIONS[role]

/** Oturumdaki kullanıcıyı depodan çözer. Rol/il bilgisi istemciden değil, kayıttan gelir. */
export function actorOf(store: Store, session: Session | null): User {
  if (!session) throw new AuthError('Oturum açmanız gerekiyor.', 'unauthenticated')
  const u = store.data.users.find((x) => x.id === session.userId)
  if (!u || u.status !== 'active') throw new AuthError('Oturum geçersiz veya hesap askıda.', 'unauthenticated')
  return u
}

export function audit(store: Store, actor: User, action: string, result: 'success' | 'denied', extra: { cityId?: string; target?: string; detail?: string } = {}): void {
  store.data.audit.unshift({ id: store.id('aud'), at: store.nowIso(), actorId: actor.id, actorName: actor.name, action, result, ...extra })
  if (store.data.audit.length > 500) store.data.audit.length = 500
}

export function requirePermission(store: Store, actor: User, perm: Permission, action: string): void {
  if (!PERMISSIONS[actor.role].includes(perm)) {
    audit(store, actor, action, 'denied', { detail: `Eksik yetki: ${perm}` })
    store.commit()
    throw new AuthError('Bu işlem için yetkiniz yok.', 'forbidden')
  }
}

/** İl düzeyinde veri izolasyonu: il yöneticisi yalnızca kendi iline erişir; ulusal yönetici okuma yapar. */
export function requireCityAccess(store: Store, actor: User, cityId: string, mode: 'read' | 'write', action: string): void {
  const ok =
    (actor.role === 'nationalAdmin' && mode === 'read') ||
    (actor.role === 'cityAdmin' && actor.cityId === cityId)
  if (!ok) {
    audit(store, actor, action, 'denied', { cityId, detail: `${mode} erişimi reddedildi` })
    store.commit()
    throw new AuthError('Bu ilin yönetim kayıtlarına erişim yetkiniz yok.', 'forbidden')
  }
}

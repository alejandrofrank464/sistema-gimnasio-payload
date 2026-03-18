import type { User } from '@/payload-types'

type UserRole = User['role']

export const isAdminOrStaffRole = (role: unknown): role is UserRole => {
  return role === 'admin' || role === 'staff'
}

export const isAdminOrStaffUser = (user: unknown): user is Pick<User, 'id' | 'role' | 'email'> => {
  if (!user || typeof user !== 'object') {
    return false
  }

  const candidate = user as { role?: unknown }
  return isAdminOrStaffRole(candidate.role)
}

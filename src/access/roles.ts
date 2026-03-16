import type { Access } from 'payload'

const getRole = (req: { user?: { role?: string | null } | null }): string | null => {
  return req.user?.role ?? null
}

export const isAdmin: Access = ({ req }) => getRole(req) === 'admin'

export const isAdminOrStaff: Access = ({ req }) => {
  const role = getRole(req)
  return role === 'admin' || role === 'staff'
}

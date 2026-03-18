import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_LOGIN_PATH = '/'
const DEFAULT_AUTH_REDIRECT_PATH = '/home'
const TOKEN_COOKIE_NAME = 'payload-token'
const ALLOWED_ROLES = new Set(['admin', 'staff'])
const ROLE_PROTECTED_PAGE_PREFIXES = [
  '/home',
  '/clientes',
  '/pagos',
  '/horario',
  '/ajustes',
  '/logs',
]
const ROLE_PROTECTED_API_PREFIXES = [
  '/api/clientes',
  '/api/pagos',
  '/api/logs',
  '/api/configuraciones',
]

const PUBLIC_API_PATHS = new Set([
  '/api/users/login',
  '/api/users/first-register',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/configuraciones/logo',
])

const isPublicPath = (pathname: string): boolean => {
  return pathname === ROOT_LOGIN_PATH
}

const isPayloadAdminPath = (pathname: string): boolean => {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

const isPublicApiPath = (pathname: string): boolean => {
  return PUBLIC_API_PATHS.has(pathname)
}

const isRoleProtectedPagePath = (pathname: string): boolean => {
  return ROLE_PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

const isRoleProtectedApiPath = (pathname: string): boolean => {
  return ROLE_PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const segments = token.split('.')
  if (segments.length < 2) return null

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = atob(normalized)
    return JSON.parse(payload) as Record<string, unknown>
  } catch {
    return null
  }
}

const getRoleFromToken = (token: string): string | null => {
  const payload = decodeJwtPayload(token)
  const role = payload?.role

  return typeof role === 'string' ? role : null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  const isAuthenticated = Boolean(token)
  const isApiPath = pathname.startsWith('/api')
  const role = token ? getRoleFromToken(token) : null
  const hasAllowedRole = role ? ALLOWED_ROLES.has(role) : false

  if (pathname === ROOT_LOGIN_PATH && isAuthenticated) {
    const nextUrl = request.nextUrl.clone()
    nextUrl.pathname = DEFAULT_AUTH_REDIRECT_PATH
    return NextResponse.redirect(nextUrl)
  }

  if (!isAuthenticated && !isApiPath && !isPublicPath(pathname)) {
    if (isPayloadAdminPath(pathname)) {
      return NextResponse.next()
    }

    const nextUrl = request.nextUrl.clone()
    nextUrl.pathname = ROOT_LOGIN_PATH
    return NextResponse.redirect(nextUrl)
  }

  if (!isAuthenticated && isApiPath && !isPublicApiPath(pathname)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (isAuthenticated && !hasAllowedRole && !isApiPath && isRoleProtectedPagePath(pathname)) {
    const nextUrl = request.nextUrl.clone()
    nextUrl.pathname = ROOT_LOGIN_PATH
    return NextResponse.redirect(nextUrl)
  }

  if (isAuthenticated && !hasAllowedRole && isApiPath && isRoleProtectedApiPath(pathname)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)'],
}

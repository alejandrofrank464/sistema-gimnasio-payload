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
const ROLE_PROTECTED_API_PATHS = ['/api/users/change-password']
const PUBLIC_SETTINGS_LOGO_API_PATH = '/api/configuraciones/logo'

const isPayloadAdminPath = (pathname: string): boolean => {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

const isPublicApiPath = (pathname: string): boolean => pathname === PUBLIC_SETTINGS_LOGO_API_PATH

const isRoleProtectedPagePath = (pathname: string): boolean => {
  return ROLE_PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

const isRoleProtectedApiPath = (pathname: string): boolean => {
  return (
    ROLE_PROTECTED_API_PATHS.includes(pathname) ||
    ROLE_PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
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

  // El panel de Payload y sus subrutas se gestionan con el auth nativo de Payload.
  if (isPayloadAdminPath(pathname)) {
    return NextResponse.next()
  }

  if (pathname === ROOT_LOGIN_PATH && isAuthenticated) {
    const nextUrl = request.nextUrl.clone()
    nextUrl.pathname = DEFAULT_AUTH_REDIRECT_PATH
    return NextResponse.redirect(nextUrl)
  }

  if (!isAuthenticated && !isApiPath && isRoleProtectedPagePath(pathname)) {
    const nextUrl = request.nextUrl.clone()
    nextUrl.pathname = ROOT_LOGIN_PATH
    return NextResponse.redirect(nextUrl)
  }

  // Solo proteger APIs custom del frontend; las rutas API de Payload se dejan pasar.
  if (
    !isAuthenticated &&
    isApiPath &&
    isRoleProtectedApiPath(pathname) &&
    !isPublicApiPath(pathname)
  ) {
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

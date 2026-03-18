import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { isAdminOrStaffUser } from '@/lib/auth-guards'

type ChangePasswordBody = {
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

const MIN_PASSWORD_LENGTH = 8
const AUTH_COOKIE_NAMES = ['payload-token', 'payload-token.sig'] as const

export const POST = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  if (!isAdminOrStaffUser(auth.user)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as ChangePasswordBody | null

  const currentPassword = body?.currentPassword ?? ''
  const newPassword = body?.newPassword ?? ''
  const confirmNewPassword = body?.confirmNewPassword ?? ''

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return Response.json(
      { error: 'Todos los campos de contraseña son obligatorios.' },
      { status: 400 },
    )
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
      { status: 400 },
    )
  }

  if (newPassword !== confirmNewPassword) {
    return Response.json({ error: 'La confirmación no coincide.' }, { status: 400 })
  }

  if (currentPassword === newPassword) {
    return Response.json(
      { error: 'La nueva contraseña debe ser distinta de la actual.' },
      { status: 400 },
    )
  }

  const email = typeof auth.user?.email === 'string' ? auth.user.email : null

  if (!email) {
    return Response.json({ error: 'No se pudo resolver el usuario autenticado.' }, { status: 400 })
  }

  const loginVerificationResponse = await fetch(new URL('/api/users/login', request.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: request.headers.get('cookie') ?? '',
    },
    body: JSON.stringify({ email, password: currentPassword }),
    redirect: 'manual',
  }).catch(() => null)

  if (!loginVerificationResponse?.ok) {
    return Response.json({ error: 'La contraseña actual es incorrecta.' }, { status: 400 })
  }

  try {
    // Este endpoint siempre opera sobre el usuario autenticado actual.
    // No acepta ni usa IDs externos para evitar cambios de contraseña de terceros.
    await payload.update({
      collection: 'users',
      id: auth.user.id,
      user: auth.user,
      overrideAccess: false,
      data: {
        password: newPassword,
        sessions: [],
      },
    })

    const response = NextResponse.json({
      message: 'Contraseña actualizada correctamente.',
      forceRelogin: true,
    })

    for (const cookieName of AUTH_COOKIE_NAMES) {
      response.cookies.set({
        name: cookieName,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }

    return response
  } catch (_error) {
    return Response.json(
      { error: 'No se pudo actualizar la contraseña. Intenta nuevamente.' },
      { status: 500 },
    )
  }
}

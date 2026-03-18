import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isAdminOrStaffUser } from '@/lib/auth-guards'
import { getDefaultPrecios } from '@/lib/pricing'

const NOMBRE_GYM_KEY = 'nombre_gimnasio'
const LOGO_KEY = 'logo'

const parseMediaId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === 'object') {
    const maybeId = (value as { id?: unknown }).id
    if (typeof maybeId === 'number' && Number.isFinite(maybeId)) {
      return maybeId
    }
  }

  return null
}

export const GET = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  if (!isAdminOrStaffUser(auth.user)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const defaultPrecios = getDefaultPrecios()
  const data = {
    nombreGimnasio: 'Gym',
    precios: { ...defaultPrecios },
    logoUrl: '',
  }

  try {
    const result = await payload.find({
      collection: 'configuraciones',
      user: auth.user,
      overrideAccess: false,
      where: {
        clave: {
          in: [NOMBRE_GYM_KEY, LOGO_KEY, ...Object.keys(defaultPrecios)],
        },
      },
      depth: 0,
      pagination: false,
      limit: 100,
    })

    let logoMediaId: number | null = null

    for (const doc of result.docs) {
      if (doc.clave === NOMBRE_GYM_KEY) {
        const value = (doc.valor || '').trim()
        data.nombreGimnasio = value || data.nombreGimnasio
        continue
      }

      if (doc.clave === LOGO_KEY) {
        logoMediaId = parseMediaId(doc.logo) ?? parseMediaId(doc.valor)
        continue
      }

      if (doc.clave in defaultPrecios) {
        const parsed = Number(doc.valor)
        if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
          const key = doc.clave as keyof typeof defaultPrecios
          data.precios[key] = parsed
        }
      }
    }

    if (logoMediaId) {
      const media = await payload
        .findByID({
          collection: 'media',
          id: logoMediaId,
          depth: 0,
          user: auth.user,
          overrideAccess: false,
        })
        .catch(() => null)

      const mediaUrl = media?.url || media?.thumbnailURL || ''
      data.logoUrl = mediaUrl
    }

    return Response.json({ data })
  } catch (_error) {
    return Response.json({ data })
  }
}

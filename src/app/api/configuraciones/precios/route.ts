import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isAdminOrStaffUser } from '@/lib/auth-guards'
import { getDefaultPrecios } from '@/lib/pricing'

export const GET = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })
  const defaults = getDefaultPrecios()

  if (!isAdminOrStaffUser(auth.user)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await payload.find({
      collection: 'configuraciones',
      user: auth.user,
      overrideAccess: false,
      where: {
        clave: {
          in: Object.keys(defaults),
        },
      },
      depth: 0,
      pagination: false,
      limit: 100,
    })

    const precios = { ...defaults }

    for (const doc of result.docs) {
      const key = doc.clave as keyof typeof defaults
      if (!(key in precios)) {
        continue
      }

      const parsed = Number(doc.valor)
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        precios[key] = parsed
      }
    }

    return Response.json({ data: precios })
  } catch (_error) {
    return Response.json({ data: defaults })
  }
}

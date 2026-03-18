import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isAdminOrStaffUser } from '@/lib/auth-guards'

const DEFAULT_GYM_NAME = 'Gym'
const NOMBRE_GYM_KEY = 'nombre_gimnasio'

export const GET = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

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
          equals: NOMBRE_GYM_KEY,
        },
      },
      depth: 0,
      limit: 1,
    })

    if (!result.totalDocs) {
      return Response.json({ data: { nombreGimnasio: DEFAULT_GYM_NAME } })
    }

    const value = (result.docs[0].valor || '').trim()
    return Response.json({ data: { nombreGimnasio: value || DEFAULT_GYM_NAME } })
  } catch (_error) {
    return Response.json({ data: { nombreGimnasio: DEFAULT_GYM_NAME } })
  }
}

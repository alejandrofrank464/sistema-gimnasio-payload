import configPromise from '@payload-config'
import { getPayload } from 'payload'

const DEFAULT_GYM_NAME = 'Gym'
const NOMBRE_GYM_KEY = 'nombre_gimnasio'

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'configuraciones',
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

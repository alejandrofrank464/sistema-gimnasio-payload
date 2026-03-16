import configPromise from '@payload-config'
import { getPayload } from 'payload'

type UpsertBody = {
  clave?: string
  valor?: string | number | boolean | null
}

export const POST = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })
  const body = (await request.json()) as UpsertBody

  if (!body?.clave || body.valor === undefined) {
    return Response.json({ error: 'Se requieren los campos clave y valor.' }, { status: 400 })
  }

  const clave = body.clave.trim()

  if (!clave) {
    return Response.json({ error: 'Clave invalida.' }, { status: 400 })
  }

  const valor = String(body.valor)

  const existing = await payload.find({
    collection: 'configuraciones',
    where: {
      clave: {
        equals: clave,
      },
    },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs > 0) {
    const updated = await payload.update({
      collection: 'configuraciones',
      id: existing.docs[0].id,
      data: {
        valor,
      },
    })

    return Response.json({ data: updated })
  }

  const created = await payload.create({
    collection: 'configuraciones',
    data: {
      clave,
      valor,
    },
  })

  return Response.json({ data: created })
}

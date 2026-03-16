import configPromise from '@payload-config'
import { getPayload } from 'payload'

const LOGO_KEY = 'logo'

const upsertLogoConfig = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  mediaId: number,
) => {
  const existing = await payload.find({
    collection: 'configuraciones',
    where: {
      clave: {
        equals: LOGO_KEY,
      },
    },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs > 0) {
    return payload.update({
      collection: 'configuraciones',
      id: existing.docs[0].id,
      data: {
        valor: String(mediaId),
        logo: mediaId,
      },
    })
  }

  return payload.create({
    collection: 'configuraciones',
    data: {
      clave: LOGO_KEY,
      valor: String(mediaId),
      logo: mediaId,
    },
  })
}

export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })

  const config = await payload.find({
    collection: 'configuraciones',
    where: {
      clave: {
        equals: LOGO_KEY,
      },
    },
    limit: 1,
    depth: 1,
  })

  if (!config.totalDocs) {
    return Response.json({ data: null })
  }

  const logo = config.docs[0].logo

  if (!logo || typeof logo === 'string' || typeof logo === 'number') {
    return Response.json({ data: null })
  }

  return Response.json({
    data: {
      id: logo.id,
      url: logo.url,
      filename: logo.filename,
    },
  })
}

export const POST = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })
  const form = await request.formData()
  const logoFile = form.get('logo')

  if (!(logoFile instanceof File)) {
    return Response.json({ error: 'No se proporciono archivo.' }, { status: 400 })
  }

  const bytes = Buffer.from(await logoFile.arrayBuffer())

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: 'Logo del gimnasio',
    },
    file: {
      name: logoFile.name,
      data: bytes,
      mimetype: logoFile.type,
      size: logoFile.size,
    },
  })

  await upsertLogoConfig(payload, media.id)

  return Response.json({
    data: {
      id: media.id,
      url: media.url,
      filename: media.filename,
    },
  })
}

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import sharp from 'sharp'

import type { User } from '@/payload-types'
import { isAdminOrStaffUser } from '@/lib/auth-guards'

const LOGO_KEY = 'logo'
const MAX_LOGO_SIZE_BYTES = 400 * 1024
const ALLOWED_LOGO_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

const isNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false

  const maybeStatus = (error as { status?: unknown }).status
  return maybeStatus === 404
}

const parseMediaId = (value: unknown): number | null => {
  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return parseMediaId(id)
  }

  return null
}

const findExistingLogoMediaId = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: Pick<User, 'id' | 'role' | 'email'>,
) => {
  const existing = await payload.find({
    collection: 'configuraciones',
    user,
    overrideAccess: false,
    where: {
      clave: {
        equals: LOGO_KEY,
      },
    },
    limit: 1,
    depth: 0,
  })

  if (!existing.totalDocs) return null

  const doc = existing.docs[0]
  return parseMediaId(doc.logo) ?? parseMediaId(doc.valor)
}

const optimizeIfPossible = async (logoFile: File) => {
  const inputBuffer = Buffer.from(await logoFile.arrayBuffer())
  const isRasterMime = ['image/jpeg', 'image/png', 'image/webp'].includes(logoFile.type)

  if (!isRasterMime) {
    return {
      data: inputBuffer,
      mimetype: logoFile.type,
      name: logoFile.name,
      size: inputBuffer.byteLength,
    }
  }

  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()

  const baseName = logoFile.name.replace(/\.[^/.]+$/, '') || 'logo'
  return {
    data: outputBuffer,
    mimetype: 'image/webp',
    name: `${baseName}.webp`,
    size: outputBuffer.byteLength,
  }
}

const upsertLogoConfig = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: Pick<User, 'id' | 'role' | 'email'>,
  mediaId: number,
) => {
  const existing = await payload.find({
    collection: 'configuraciones',
    user,
    overrideAccess: false,
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
      user,
      overrideAccess: false,
      data: {
        valor: String(mediaId),
        logo: mediaId,
      },
    })
  }

  return payload.create({
    collection: 'configuraciones',
    user,
    overrideAccess: false,
    data: {
      clave: LOGO_KEY,
      valor: String(mediaId),
      logo: mediaId,
    },
  })
}

export const GET = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })
  const requestUser = isAdminOrStaffUser(auth.user) ? auth.user : undefined

  const config = await payload.find({
    collection: 'configuraciones',
    ...(requestUser ? { user: requestUser } : {}),
    overrideAccess: false,
    where: {
      clave: {
        equals: LOGO_KEY,
      },
    },
    limit: 1,
    depth: 0,
  })

  if (!config.totalDocs) {
    return Response.json({ data: null })
  }

  const mediaId = parseMediaId(config.docs[0].logo) ?? parseMediaId(config.docs[0].valor)
  if (!mediaId) {
    return Response.json({ data: null })
  }

  let media: {
    id: number
    url?: string | null
    thumbnailURL?: string | null
    filename?: string | null
  } | null = null

  try {
    media = await payload.findByID({
      collection: 'media',
      id: mediaId,
      depth: 0,
      ...(requestUser ? { user: requestUser } : {}),
      overrideAccess: false,
    })
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error
    }

    // The media file was removed manually from Payload. Clean stale logo reference.
    if (requestUser) {
      await payload
        .update({
          collection: 'configuraciones',
          id: config.docs[0].id,
          user: requestUser,
          overrideAccess: false,
          data: {
            valor: '',
            logo: null,
          },
        })
        .catch(() => null)
    }

    return Response.json({ data: null })
  }

  if (!media) {
    return Response.json({ data: null })
  }

  const url = media.url || media.thumbnailURL || null
  if (!url) return Response.json({ data: null })

  return Response.json({
    data: {
      id: media.id,
      url,
      filename: media.filename,
    },
  })
}

export const POST = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })
  const form = await request.formData()
  const logoFile = form.get('logo')

  if (!isAdminOrStaffUser(auth.user)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!(logoFile instanceof File)) {
    return Response.json({ error: 'No se proporciono archivo.' }, { status: 400 })
  }

  if (!ALLOWED_LOGO_MIMES.includes(logoFile.type)) {
    return Response.json(
      { error: 'Formato no permitido. Usa JPG, PNG, WEBP o SVG.' },
      { status: 400 },
    )
  }

  const previousMediaId = await findExistingLogoMediaId(payload, auth.user)

  const optimized = await optimizeIfPossible(logoFile)
  if (optimized.size > MAX_LOGO_SIZE_BYTES) {
    return Response.json(
      { error: 'Imagen demasiado pesada. El logo debe pesar maximo 400KB.' },
      { status: 400 },
    )
  }

  const media = await payload.create({
    collection: 'media',
    user: auth.user,
    overrideAccess: false,
    data: {
      alt: 'Logo del gimnasio',
    },
    file: {
      name: optimized.name,
      data: optimized.data,
      mimetype: optimized.mimetype,
      size: optimized.size,
    },
  })

  await upsertLogoConfig(payload, auth.user, media.id)

  if (previousMediaId && previousMediaId !== media.id) {
    await payload
      .delete({
        collection: 'media',
        id: previousMediaId,
        user: auth.user,
        overrideAccess: false,
      })
      .catch(() => null)
  }

  const mediaUrl = media.url || media.thumbnailURL || null

  return Response.json({
    data: {
      id: media.id,
      url: mediaUrl,
      filename: media.filename,
    },
  })
}

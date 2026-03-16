import type { PayloadRequest } from 'payload'

import type { TipoServicio } from '@/constants/domain'

const DEFAULT_PRECIOS = {
  precio_normal: 30,
  precio_vip: 50,
  precio_zumba_o_box: 40,
  precio_zumba_y_box: 60,
  precio_vip_zumba_y_box: 80,
}

type PrecioKey = keyof typeof DEFAULT_PRECIOS

const PRECIO_KEYS: PrecioKey[] = [
  'precio_normal',
  'precio_vip',
  'precio_zumba_o_box',
  'precio_zumba_y_box',
  'precio_vip_zumba_y_box',
]

type ClienteFlags = {
  vip?: boolean | null
  zumba?: boolean | null
  box?: boolean | null
}

export const getPrecios = async (req: PayloadRequest): Promise<Record<PrecioKey, number>> => {
  try {
    const result = await req.payload.find({
      collection: 'configuraciones',
      where: {
        clave: {
          in: PRECIO_KEYS,
        },
      },
      pagination: false,
      depth: 0,
      limit: 100,
      req,
    })

    const precios = { ...DEFAULT_PRECIOS }

    for (const doc of result.docs) {
      const key = doc.clave as PrecioKey
      if (!PRECIO_KEYS.includes(key)) {
        continue
      }

      const parsed = Number(doc.valor)
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        precios[key] = parsed
      }
    }

    return precios
  } catch (_error) {
    return { ...DEFAULT_PRECIOS }
  }
}

export const getServiceFromFlags = (
  flags: ClienteFlags,
  precios: Record<PrecioKey, number>,
): { tipoServicio: TipoServicio; monto: number } => {
  const vip = Boolean(flags.vip)
  const zumba = Boolean(flags.zumba)
  const box = Boolean(flags.box)

  if (vip && zumba && box) {
    return {
      tipoServicio: 'VIP + Zumba y Box',
      monto: precios.precio_vip_zumba_y_box,
    }
  }

  if (vip) {
    return {
      tipoServicio: 'VIP',
      monto: precios.precio_vip,
    }
  }

  if (zumba && box) {
    return {
      tipoServicio: 'Zumba y Box',
      monto: precios.precio_zumba_y_box,
    }
  }

  if (zumba || box) {
    return {
      tipoServicio: zumba ? 'Zumba' : 'Box',
      monto: precios.precio_zumba_o_box,
    }
  }

  return {
    tipoServicio: 'Normal',
    monto: precios.precio_normal,
  }
}

export const getDefaultPrecios = (): Record<PrecioKey, number> => {
  return { ...DEFAULT_PRECIOS }
}

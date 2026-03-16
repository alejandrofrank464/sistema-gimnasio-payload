import type { PayloadRequest } from 'payload'

import type { JsonObject } from 'payload'

import { LOG_ACCION_OPTIONS } from '@/constants/domain'

type LogAccion = (typeof LOG_ACCION_OPTIONS)[number]

type LogDetalle = JsonObject | unknown[] | string | number | boolean | null

type CreateLogData = {
  accion: LogAccion
  entidad: string
  entidadId?: string
  usuario?: string
  nombreCompleto?: string
  detalles?: LogDetalle
}

export const createLogSafe = async (req: PayloadRequest, data: CreateLogData): Promise<void> => {
  try {
    await req.payload.create({
      collection: 'logs',
      data: {
        accion: data.accion,
        entidad: data.entidad,
        entidadId: data.entidadId,
        usuario: data.usuario ?? (req.user as { email?: string | null } | null)?.email ?? 'Sistema',
        nombreCompleto: data.nombreCompleto,
        detalles: data.detalles ?? null,
      },
      req,
    })
  } catch (_error) {
    // Los logs no deben romper la operacion principal.
  }
}

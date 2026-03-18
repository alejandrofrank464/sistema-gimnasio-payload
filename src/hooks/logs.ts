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

type PruneLogsOptions = {
  maxLogs: number
}

const DEFAULT_MAX_LOGS = 1000

const toPositiveInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed)
    }
  }

  return null
}

const getMaxLogsLimit = (maxLogs?: number): number => {
  const explicit = toPositiveInteger(maxLogs)
  if (explicit) return explicit

  const fromEnv = toPositiveInteger(process.env.LOGS_MAX_COUNT)
  if (fromEnv) return fromEnv

  return DEFAULT_MAX_LOGS
}

export const pruneOldLogs = async (
  req: PayloadRequest,
  options: PruneLogsOptions,
): Promise<number> => {
  const maxLogs = getMaxLogsLimit(options.maxLogs)

  const summary = await req.payload.find({
    collection: 'logs',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
  })

  const logsToDelete = summary.totalDocs - maxLogs
  if (logsToDelete <= 0) {
    return 0
  }

  const oldestLogs = await req.payload.find({
    collection: 'logs',
    depth: 0,
    limit: logsToDelete,
    sort: 'createdAt',
    overrideAccess: true,
    req,
  })

  const ids = oldestLogs.docs.map((doc) => doc.id)

  if (ids.length === 0) {
    return 0
  }

  await req.payload.delete({
    collection: 'logs',
    where: {
      id: {
        in: ids,
      },
    },
    overrideAccess: true,
    req,
  })

  return ids.length
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

    await pruneOldLogs(req, {
      maxLogs: getMaxLogsLimit(),
    })
  } catch (_error) {
    // Los logs no deben romper la operacion principal.
  }
}

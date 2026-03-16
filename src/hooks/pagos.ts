import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  Where,
} from 'payload'

import { createLogSafe } from '@/hooks/logs'

type RelationshipValue = number | string | { id?: number | string | null } | null | undefined

const getRelationshipId = (value: RelationshipValue): number | string | null => {
  if (value == null) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  return value.id ?? null
}

const shouldSkipLog = (context: unknown): boolean => {
  if (!context || typeof context !== 'object') {
    return false
  }

  return Boolean((context as Record<string, unknown>).skipLog)
}

export const ensureUniquePagoByPeriod: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const clienteId = getRelationshipId(
    (data as { cliente?: RelationshipValue } | undefined)?.cliente,
  )
  const mesPago = (data as { mesPago?: number } | undefined)?.mesPago
  const anioPago = (data as { anioPago?: number } | undefined)?.anioPago

  if (!clienteId || mesPago === undefined || anioPago === undefined) {
    return data
  }

  const andWhere: Where[] = [
    {
      cliente: {
        equals: clienteId,
      },
    },
    {
      mesPago: {
        equals: mesPago,
      },
    },
    {
      anioPago: {
        equals: anioPago,
      },
    },
  ]

  if (operation === 'update' && originalDoc?.id) {
    andWhere.push({
      id: {
        not_equals: originalDoc.id,
      },
    })
  }

  const existing = await req.payload.find({
    collection: 'pagos',
    where: {
      and: andWhere,
    },
    limit: 1,
    depth: 0,
    req,
  })

  if (existing.totalDocs > 0) {
    throw new Error('Ya existe un pago para este cliente en el mes y anio seleccionados.')
  }

  return data
}

export const logPagoAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  context,
}) => {
  if (shouldSkipLog(context)) {
    return doc
  }

  const accion = operation === 'create' ? 'crear_pago' : 'editar_pago'

  await createLogSafe(req, {
    accion,
    entidad: 'Pago',
    entidadId: String(doc.id),
    nombreCompleto: undefined,
    detalles: {
      monto: doc.monto,
      metodoPago: doc.metodoPago,
      tipoServicio: doc.tipoServicio,
      turno: doc.turno,
      mesPago: doc.mesPago,
      anioPago: doc.anioPago,
      fechaPago: doc.fechaPago,
      cliente: getRelationshipId(doc.cliente as RelationshipValue),
    },
  })

  return doc
}

export const logPagoAfterDelete: CollectionAfterDeleteHook = async ({ doc, req, context }) => {
  if (shouldSkipLog(context)) {
    return doc
  }

  await createLogSafe(req, {
    accion: 'eliminar_pago',
    entidad: 'Pago',
    entidadId: String(doc.id),
    detalles: {
      monto: doc.monto,
      metodoPago: doc.metodoPago,
      tipoServicio: doc.tipoServicio,
      mesPago: doc.mesPago,
      anioPago: doc.anioPago,
    },
  })

  return doc
}

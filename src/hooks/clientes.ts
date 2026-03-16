import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { TURNO_OPTIONS } from '@/constants/domain'
import type { Turno } from '@/constants/domain'
import { createLogSafe } from '@/hooks/logs'
import { getPrecios, getServiceFromFlags } from '@/lib/pricing'

const sanitizeTurno = (value: unknown): Turno | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'null') {
    return null
  }

  return TURNO_OPTIONS.includes(trimmed as Turno) ? (trimmed as Turno) : null
}

export const handleClienteAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation === 'create') {
    await createLogSafe(req, {
      accion: 'crear_cliente',
      entidad: 'Cliente',
      entidadId: String(doc.id),
      nombreCompleto: `${doc.name} ${doc.lastName}`,
      detalles: {
        name: doc.name,
        lastName: doc.lastName,
        phone: doc.phone,
        email: doc.email,
        vip: doc.vip,
        zumba: doc.zumba,
        box: doc.box,
        turno: doc.turno,
        metodoPago: doc.metodoPago,
      },
    })

    try {
      const precios = await getPrecios(req)
      const { monto, tipoServicio } = getServiceFromFlags(
        {
          vip: doc.vip,
          zumba: doc.zumba,
          box: doc.box,
        },
        precios,
      )

      const now = new Date()
      const fechaPago = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const turno = doc.vip ? null : sanitizeTurno(doc.turno)

      await req.payload.create({
        collection: 'pagos',
        data: {
          monto,
          metodoPago: doc.metodoPago || 'Efectivo',
          tipoServicio,
          fechaPago,
          mesPago: now.getMonth(),
          anioPago: now.getFullYear(),
          turno,
          cliente: doc.id,
        },
        req,
      })
    } catch (_error) {
      // La creacion de cliente no debe fallar si falla el pago automatico.
    }

    return doc
  }

  await createLogSafe(req, {
    accion: 'editar_cliente',
    entidad: 'Cliente',
    entidadId: String(doc.id),
    nombreCompleto: `${doc.name} ${doc.lastName}`,
    detalles: {
      name: doc.name,
      lastName: doc.lastName,
      phone: doc.phone,
      email: doc.email,
      vip: doc.vip,
      zumba: doc.zumba,
      box: doc.box,
      turno: doc.turno,
      metodoPago: doc.metodoPago,
    },
  })

  return doc
}

export const handleClienteAfterDelete: CollectionAfterDeleteHook = async ({ id, doc, req }) => {
  await req.payload.update({
    collection: 'pagos',
    where: {
      cliente: {
        equals: id,
      },
    },
    data: {
      cliente: null,
    },
    context: {
      skipLog: true,
    },
    req,
  })

  await createLogSafe(req, {
    accion: 'eliminar_cliente',
    entidad: 'Cliente',
    entidadId: String(id),
    nombreCompleto: `${doc.name} ${doc.lastName}`,
    detalles: {
      name: doc.name,
      lastName: doc.lastName,
      phone: doc.phone,
      email: doc.email,
    },
  })

  return doc
}

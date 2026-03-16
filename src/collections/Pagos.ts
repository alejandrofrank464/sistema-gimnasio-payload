import type { CollectionConfig } from 'payload'

import { isAdminOrStaff } from '@/access/roles'
import { METODO_PAGO_OPTIONS, TIPO_SERVICIO_OPTIONS, TURNO_OPTIONS } from '@/constants/domain'
import { ensureUniquePagoByPeriod, logPagoAfterChange, logPagoAfterDelete } from '@/hooks/pagos'

export const Pagos: CollectionConfig = {
  slug: 'pagos',
  access: {
    create: isAdminOrStaff,
    delete: isAdminOrStaff,
    read: isAdminOrStaff,
    update: isAdminOrStaff,
  },
  admin: {
    useAsTitle: 'tipoServicio',
    defaultColumns: [
      'cliente',
      'monto',
      'metodoPago',
      'tipoServicio',
      'fechaPago',
      'mesPago',
      'anioPago',
    ],
  },
  hooks: {
    beforeValidate: [ensureUniquePagoByPeriod],
    afterChange: [logPagoAfterChange],
    afterDelete: [logPagoAfterDelete],
  },
  fields: [
    {
      name: 'monto',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'metodoPago',
      type: 'select',
      options: METODO_PAGO_OPTIONS.map((metodo) => ({
        label: metodo,
        value: metodo,
      })),
      defaultValue: 'Efectivo',
    },
    {
      name: 'tipoServicio',
      type: 'select',
      required: true,
      options: TIPO_SERVICIO_OPTIONS.map((tipo) => ({
        label: tipo,
        value: tipo,
      })),
      defaultValue: 'Normal',
    },
    {
      name: 'fechaPago',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'mesPago',
      type: 'number',
      required: true,
      min: 0,
      max: 11,
    },
    {
      name: 'anioPago',
      type: 'number',
      required: true,
    },
    {
      name: 'turno',
      type: 'select',
      options: TURNO_OPTIONS.map((turno) => ({
        label: turno,
        value: turno,
      })),
    },
    {
      name: 'cliente',
      type: 'relationship',
      relationTo: 'clientes',
      required: false,
      index: true,
    },
  ],
}

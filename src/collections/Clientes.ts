import type { CollectionConfig } from 'payload'

import { isAdminOrStaff } from '@/access/roles'
import { METODO_PAGO_OPTIONS, TURNO_OPTIONS } from '@/constants/domain'
import { handleClienteAfterChange, handleClienteAfterDelete } from '@/hooks/clientes'

export const Clientes: CollectionConfig = {
  slug: 'clientes',
  access: {
    create: isAdminOrStaff,
    delete: isAdminOrStaff,
    read: isAdminOrStaff,
    update: isAdminOrStaff,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'lastName', 'phone', 'vip', 'zumba', 'box', 'turno'],
  },
  hooks: {
    afterChange: [handleClienteAfterChange],
    afterDelete: [handleClienteAfterDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'email',
      type: 'email',
      unique: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'vip',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'zumba',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'box',
      type: 'checkbox',
      defaultValue: false,
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
      name: 'metodoPago',
      type: 'select',
      options: METODO_PAGO_OPTIONS.map((metodo) => ({
        label: metodo,
        value: metodo,
      })),
      defaultValue: 'Efectivo',
    },
  ],
}

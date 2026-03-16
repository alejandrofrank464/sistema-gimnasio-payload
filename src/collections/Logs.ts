import type { CollectionConfig } from 'payload'

import { isAdminOrStaff } from '@/access/roles'
import { LOG_ACCION_OPTIONS } from '@/constants/domain'

export const Logs: CollectionConfig = {
  slug: 'logs',
  access: {
    create: isAdminOrStaff,
    delete: isAdminOrStaff,
    read: isAdminOrStaff,
    update: isAdminOrStaff,
  },
  admin: {
    useAsTitle: 'entidad',
    defaultColumns: ['createdAt', 'accion', 'entidad', 'usuario'],
  },
  fields: [
    {
      name: 'accion',
      type: 'select',
      required: true,
      options: LOG_ACCION_OPTIONS.map((accion) => ({
        label: accion,
        value: accion,
      })),
    },
    {
      name: 'entidad',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'entidadId',
      type: 'text',
    },
    {
      name: 'detalles',
      type: 'json',
    },
    {
      name: 'usuario',
      type: 'text',
    },
    {
      name: 'nombreCompleto',
      type: 'text',
    },
  ],
}

import type { CollectionConfig } from 'payload'

import { isAdminOrStaff } from '@/access/roles'

export const Configuraciones: CollectionConfig = {
  slug: 'configuraciones',
  access: {
    create: isAdminOrStaff,
    delete: isAdminOrStaff,
    read: isAdminOrStaff,
    update: isAdminOrStaff,
  },
  admin: {
    useAsTitle: 'clave',
    defaultColumns: ['clave', 'valor', 'updatedAt'],
  },
  fields: [
    {
      name: 'clave',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'valor',
      type: 'textarea',
      required: true,
    },
    {
      name: 'logo',
      type: 'relationship',
      relationTo: 'media',
      hasMany: false,
    },
  ],
}

import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Staff',
          value: 'staff',
        },
      ],
      saveToJWT: true,
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}

import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

const isAdminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true

  return {
    id: {
      equals: req.user.id,
    },
  }
}

const canCreateUser: Access = async ({ req }) => {
  if (req.user?.role === 'admin') return true

  const existingUsers = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
  })

  return existingUsers.totalDocs === 0
}

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: canCreateUser,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    removeTokenFromResponses: true,
    tokenExpiration: 30 * 60,
    useSessions: true,
  },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const userToDelete = await req.payload.findByID({
          collection: 'users',
          id,
          depth: 0,
          overrideAccess: true,
          req,
        })

        if (userToDelete.role !== 'admin') return

        const remainingAdmins = await req.payload.find({
          collection: 'users',
          where: {
            and: [
              {
                role: {
                  equals: 'admin',
                },
              },
              {
                id: {
                  not_equals: id,
                },
              },
            ],
          },
          depth: 0,
          limit: 1,
          overrideAccess: true,
          req,
        })

        if (remainingAdmins.totalDocs === 0) {
          throw new Error('No se puede eliminar el ultimo usuario admin del sistema.')
        }
      },
    ],
  },
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

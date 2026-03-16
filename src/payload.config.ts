import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Clientes } from './collections/Clientes'
import { Configuraciones } from './collections/Configuraciones'
import { Logs } from './collections/Logs'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pagos } from './collections/Pagos'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const postgresURL = process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
const isPostgresURL =
  postgresURL.startsWith('postgres://') || postgresURL.startsWith('postgresql://')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Clientes, Pagos, Configuraciones, Logs],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: isPostgresURL
    ? postgresAdapter({
        pool: {
          connectionString: postgresURL,
        },
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URL || 'file:./sistema-gimnasio-payload.db',
        },
      }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      collections: {
        media: true,
      },
    }),
  ],
})

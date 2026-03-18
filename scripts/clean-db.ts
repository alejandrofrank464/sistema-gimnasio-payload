import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

type CleanResult = {
  collection: string
  deleted: number
}

const DEMO_DOMAIN = 'demo.gym.local'
const DEMO_CONFIG_KEYS = [
  'nombre_gimnasio',
  'precio_normal',
  'precio_vip',
  'precio_zumba_o_box',
  'precio_zumba_y_box',
  'precio_vip_zumba_y_box',
]

const CLEANABLE_COLLECTIONS = [
  'pagos',
  'logs',
  'clientes',
  'configuraciones',
  'media',
  'users',
] as const

type CleanableCollection = (typeof CLEANABLE_COLLECTIONS)[number]

const whereAll = { id: { exists: true } }

async function cleanCollection(payloadInstance: PayloadInstance, collection: CleanableCollection) {
  const existing = await payloadInstance.find({
    collection,
    where: whereAll,
    depth: 0,
    limit: 1,
  })

  if (existing.totalDocs === 0) {
    return {
      collection,
      deleted: 0,
    } satisfies CleanResult
  }

  await payloadInstance.delete({
    collection,
    where: whereAll,
    context: { skipLog: true },
  })

  return {
    collection,
    deleted: existing.totalDocs,
  } satisfies CleanResult
}

const closePayload = async (payloadInstance: PayloadInstance | null) => {
  const db = payloadInstance?.db
  if (!db) return

  const destroy = 'destroy' in db ? db.destroy : null
  if (typeof destroy === 'function') {
    await destroy.call(db)
  }
}

const cleanDemoOnly = async (payloadInstance: PayloadInstance): Promise<CleanResult[]> => {
  const results: CleanResult[] = []

  const demoClients = await payloadInstance.find({
    collection: 'clientes',
    where: {
      email: {
        like: `@${DEMO_DOMAIN}`,
      },
    },
    depth: 0,
    limit: 10000,
  })

  const demoClientIds = demoClients.docs.map((doc) => doc.id)

  if (demoClientIds.length > 0) {
    const pagos = await payloadInstance.find({
      collection: 'pagos',
      where: {
        cliente: {
          in: demoClientIds,
        },
      },
      depth: 0,
      limit: 1,
    })

    if (pagos.totalDocs > 0) {
      await payloadInstance.delete({
        collection: 'pagos',
        where: {
          cliente: {
            in: demoClientIds,
          },
        },
        context: { skipLog: true },
      })
    }

    results.push({ collection: 'pagos', deleted: pagos.totalDocs })
  } else {
    results.push({ collection: 'pagos', deleted: 0 })
  }

  if (demoClients.totalDocs > 0) {
    await payloadInstance.delete({
      collection: 'clientes',
      where: {
        email: {
          like: `@${DEMO_DOMAIN}`,
        },
      },
      context: { skipLog: true },
    })
  }
  results.push({ collection: 'clientes', deleted: demoClients.totalDocs })

  const demoUsers = await payloadInstance.find({
    collection: 'users',
    where: {
      email: {
        like: `@${DEMO_DOMAIN}`,
      },
    },
    depth: 0,
    limit: 1,
  })

  if (demoUsers.totalDocs > 0) {
    await payloadInstance.delete({
      collection: 'users',
      where: {
        email: {
          like: `@${DEMO_DOMAIN}`,
        },
      },
    })
  }
  results.push({ collection: 'users', deleted: demoUsers.totalDocs })

  const demoConfig = await payloadInstance.find({
    collection: 'configuraciones',
    where: {
      clave: {
        in: DEMO_CONFIG_KEYS,
      },
    },
    depth: 0,
    pagination: false,
    limit: 100,
  })

  if (demoConfig.totalDocs > 0) {
    await payloadInstance.delete({
      collection: 'configuraciones',
      where: {
        clave: {
          in: DEMO_CONFIG_KEYS,
        },
      },
      context: { skipLog: true },
    })
  }
  results.push({ collection: 'configuraciones', deleted: demoConfig.totalDocs })

  const demoLogs = await payloadInstance.find({
    collection: 'logs',
    where: {
      usuario: {
        contains: `@${DEMO_DOMAIN}`,
      },
    },
    depth: 0,
    limit: 1,
  })

  if (demoLogs.totalDocs > 0) {
    await payloadInstance.delete({
      collection: 'logs',
      where: {
        usuario: {
          contains: `@${DEMO_DOMAIN}`,
        },
      },
      context: { skipLog: true },
    })
  }
  results.push({ collection: 'logs', deleted: demoLogs.totalDocs })

  return results
}

async function main() {
  let payloadInstance: PayloadInstance | null = null

  try {
    const includeUsers = process.argv.includes('--include-users')
    const demoOnly = process.argv.includes('--demo-only')

    payloadInstance = await getPayload({ config })

    console.log('🧹 Limpiando base de datos...')

    if (demoOnly) {
      console.log('🎯 Modo demo-only activado')
      const results = await cleanDemoOnly(payloadInstance)
      for (const result of results) {
        console.log(`  ✓ ${result.collection}: ${result.deleted} eliminados`)
      }
      const total = results.reduce((sum, item) => sum + item.deleted, 0)
      console.log(`\n✅ Limpieza demo completada. Registros eliminados: ${total}`)
      return
    }

    const order: CleanableCollection[] = ['pagos', 'logs', 'clientes', 'configuraciones', 'media']
    if (includeUsers) order.push('users')

    if (includeUsers) {
      console.log('⚠️ Incluyendo usuarios (--include-users)')
    }

    const results: CleanResult[] = []
    for (const collection of order) {
      const result = await cleanCollection(payloadInstance, collection)
      results.push(result)
      console.log(`  ✓ ${collection}: ${result.deleted} eliminados`)
    }

    const total = results.reduce((sum, item) => sum + item.deleted, 0)
    console.log(`\n✅ Limpieza completada. Registros eliminados: ${total}`)
  } finally {
    await closePayload(payloadInstance)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error limpiando base de datos:', error)
    process.exit(1)
  })

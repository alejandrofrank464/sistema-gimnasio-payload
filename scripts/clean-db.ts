import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

type CleanResult = {
  collection: string
  deleted: number
}

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

async function cleanCollection(
  payloadInstance: Awaited<ReturnType<typeof getPayload>>,
  collection: CleanableCollection,
) {
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

async function main() {
  let payloadInstance: PayloadInstance | null = null

  try {
    const includeUsers = process.argv.includes('--include-users')
    payloadInstance = await getPayload({ config })

    const order: CleanableCollection[] = ['pagos', 'logs', 'clientes', 'configuraciones', 'media']
    if (includeUsers) order.push('users')

    console.log('🧹 Limpiando base de datos...')
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

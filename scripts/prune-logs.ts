import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

type LogPruneRequest = {
  maxLogs: number
}

const DEFAULT_MAX_LOGS = 1000

const parseNumberFlag = (flagName: string): number | null => {
  const flag = process.argv.find((arg) => arg.startsWith(`${flagName}=`))
  if (!flag) return null

  const value = flag.slice(flagName.length + 1).trim()
  if (!value) return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return Math.floor(parsed)
}

const parsePositiveInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed)
    }
  }

  return null
}

const resolveMaxLogs = (): number => {
  const fromFlag = parseNumberFlag('--max')
  if (fromFlag) return fromFlag

  const fromEnv = parsePositiveInteger(process.env.LOGS_MAX_COUNT)
  if (fromEnv) return fromEnv

  return DEFAULT_MAX_LOGS
}

const closePayload = async (payloadInstance: PayloadInstance | null) => {
  const db = payloadInstance?.db
  if (!db) return

  const destroy = 'destroy' in db ? db.destroy : null
  if (typeof destroy === 'function') {
    await destroy.call(db)
  }
}

async function pruneLogs(
  payloadInstance: PayloadInstance,
  request: LogPruneRequest,
): Promise<number> {
  const summary = await payloadInstance.find({
    collection: 'logs',
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  const logsToDelete = summary.totalDocs - request.maxLogs
  if (logsToDelete <= 0) {
    return 0
  }

  const oldestLogs = await payloadInstance.find({
    collection: 'logs',
    depth: 0,
    limit: logsToDelete,
    sort: 'createdAt',
    overrideAccess: true,
  })

  const ids = oldestLogs.docs.map((doc) => doc.id)

  if (ids.length === 0) {
    return 0
  }

  await payloadInstance.delete({
    collection: 'logs',
    where: {
      id: {
        in: ids,
      },
    },
    overrideAccess: true,
  })

  return ids.length
}

async function main() {
  let payloadInstance: PayloadInstance | null = null

  try {
    const maxLogs = resolveMaxLogs()
    payloadInstance = await getPayload({ config })

    const before = await payloadInstance.find({
      collection: 'logs',
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    console.log(`🧾 Logs actuales: ${before.totalDocs}`)
    console.log(`🎯 Umbral maximo: ${maxLogs}`)

    const deleted = await pruneLogs(payloadInstance, { maxLogs })

    const after = await payloadInstance.find({
      collection: 'logs',
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    console.log(`🗑️ Logs eliminados: ${deleted}`)
    console.log(`✅ Logs restantes: ${after.totalDocs}`)
  } finally {
    await closePayload(payloadInstance)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error podando logs:', error)
    process.exit(1)
  })

/**
 * Script para inyectar volumen alto de clientes demo en la BD.
 *
 * RELACIONES CLIENTE-PAGO:
 * - Cuando se crea un cliente via payload.create() (sea UI o script), el hook `handleClienteAfterChange`
 *   se ejecuta automáticamente y crea un pago inicial del mes actual.
 * - Esto ocurre EN CUALQUIER CONTEXTO porque es un hook Payload que se ejecuta post-creación.
 * - Luego el script adiciona pagos históricos de meses anteriores.
 *
 * Ejecución:
 * pnpm seed:demo:large                    # Genera 100 clientes + pagos
 * pnpm seed:demo:large --count 300        # Genera 300 clientes + pagos
 * pnpm seed:demo:large --reset --count 150  # Reset demo data + genera 150 clientes
 */

import 'dotenv/config'

import { getPayload } from 'payload'

import { METODO_PAGO_OPTIONS, TURNO_OPTIONS, type TipoServicio } from '../src/constants/domain'
import config from '../src/payload.config'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

type RelationshipValue = number | string | { id?: number | string | null } | null | undefined

const DEMO_DOMAIN = 'demo.gym.local'

// Nombres variados para generar clientes
const NOMBRES = [
  'Juan',
  'Maria',
  'Carlos',
  'Ana',
  'Luis',
  'Sofia',
  'Pedro',
  'Lucia',
  'Diego',
  'Valentina',
  'Andres',
  'Camila',
  'Roberto',
  'Gabriela',
  'Miguel',
  'Alejandra',
  'Fernando',
  'Natalia',
  'Jorge',
  'Isabel',
  'Raul',
  'Carmen',
  'Ricardo',
  'Marisol',
  'Angel',
  'Patricia',
  'Hector',
  'Susana',
  'Cesar',
  'Rosa',
  'Manuel',
  'Teresa',
  'Arturo',
  'Julia',
  'Ruben',
  'Victoria',
]

const APELLIDOS = [
  'Perez',
  'Lopez',
  'Gomez',
  'Diaz',
  'Martinez',
  'Ramirez',
  'Torres',
  'Vargas',
  'Morales',
  'Castro',
  'Rojas',
  'Suarez',
  'Garcia',
  'Martinez',
  'Sanchez',
  'Flores',
  'Cruz',
  'Santos',
  'Romero',
  'Herrera',
  'Reyes',
  'Ortiz',
  'Valdez',
  'Medina',
  'Solis',
  'Campos',
  'Molina',
  'Ramos',
  'Guerrero',
  'Mederos',
  'Acosta',
  'Quintero',
  'Rivero',
  'Blanco',
  'Ponce',
  'Ayala',
]

const TIPOS_SERVICIO: TipoServicio[] = [
  'Normal',
  'Normal',
  'Normal',
  'Normal', // Más weight
  'Zumba',
  'Box',
  'Zumba y Box',
  'VIP',
  'VIP + Zumba y Box', // Menos weight
]

const getFlagsFromService = (tipoServicio: TipoServicio) => {
  switch (tipoServicio) {
    case 'VIP + Zumba y Box':
      return { vip: true, zumba: true, box: true }
    case 'VIP':
      return { vip: true, zumba: false, box: false }
    case 'Zumba y Box':
      return { vip: false, zumba: true, box: true }
    case 'Zumba':
      return { vip: false, zumba: true, box: false }
    case 'Box':
      return { vip: false, zumba: false, box: true }
    default:
      return { vip: false, zumba: false, box: false }
  }
}

const getRelationshipId = (value: RelationshipValue): number | null => {
  if (value == null) return null

  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (typeof value.id === 'number') return value.id
  if (typeof value.id === 'string') {
    const parsed = Number(value.id)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const toDateOnly = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getMonthOffset = (base: Date, offset: number) => {
  const d = new Date(base.getFullYear(), base.getMonth() + offset, 5)
  return {
    month: d.getMonth(),
    year: d.getFullYear(),
    date: toDateOnly(d),
  }
}

const randomChoice = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

const generateUniquePhone = (count: number = 100000): Set<string> => {
  const phones = new Set<string>()
  while (phones.size < count) {
    const phone = `30${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`
    phones.add(phone)
  }
  return phones
}

interface GeneratedClient {
  name: string
  lastName: string
  phone: string
  email: string
  tipoServicio: TipoServicio
  turno: (typeof TURNO_OPTIONS)[number] | null
  metodoPago: (typeof METODO_PAGO_OPTIONS)[number]
}

async function generateClients(count: number): Promise<GeneratedClient[]> {
  const phones = generateUniquePhone(count)
  const clients: GeneratedClient[] = []

  for (const phone of phones) {
    const nombre = randomChoice(NOMBRES)
    const apellido = randomChoice(APELLIDOS)
    const tipoServicio = randomChoice(TIPOS_SERVICIO)
    const flags = getFlagsFromService(tipoServicio)

    // VIP clients don't have turno
    const turno = flags.vip ? null : randomChoice(TURNO_OPTIONS)

    clients.push({
      name: nombre,
      lastName: apellido,
      phone,
      email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}.${Math.random().toString(36).substring(7)}@${DEMO_DOMAIN}`,
      tipoServicio,
      turno,
      metodoPago: randomChoice(METODO_PAGO_OPTIONS),
    })
  }

  return clients
}

async function seedClients(
  payloadInstance: Awaited<ReturnType<typeof getPayload>>,
  clients: GeneratedClient[],
): Promise<Array<number | string>> {
  const upsertedClientIds: Array<number | string> = []
  const flags = getFlagsFromService('Normal')

  console.log(`📝 Creando ${clients.length} clientes...`)

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i]
    const clientFlags = getFlagsFromService(client.tipoServicio)

    try {
      const created = await payloadInstance.create({
        collection: 'clientes',
        data: {
          name: client.name,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          metodoPago: client.metodoPago,
          turno: client.turno,
          ...clientFlags,
        },
      })

      upsertedClientIds.push(created.id)

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ ${i + 1}/${clients.length} clientes creados`)
      }
    } catch (error) {
      console.error(`  ✗ Error creando cliente ${i + 1}: ${error}`)
    }
  }

  console.log(`✓ Clientes creados: ${upsertedClientIds.length}`)
  return upsertedClientIds
}

const closePayload = async (payloadInstance: PayloadInstance | null) => {
  const db = payloadInstance?.db
  if (!db) return

  const destroy = 'destroy' in db ? db.destroy : null
  if (typeof destroy === 'function') {
    await destroy.call(db)
  }
}

async function seedHistoricalPayments(
  payloadInstance: Awaited<ReturnType<typeof getPayload>>,
  clientIds: Array<number | string>,
) {
  const now = new Date()
  const previousMonth = getMonthOffset(now, -1)
  const twoMonthsAgo = getMonthOffset(now, -2)

  console.log(`📅 Agregando pagos históricos...`)

  const clients = await payloadInstance.find({
    collection: 'clientes',
    where: {
      id: {
        in: clientIds,
      },
    },
    depth: 0,
    limit: 500,
  })

  let createdCount = 0

  for (let i = 0; i < clients.docs.length; i++) {
    const client = clients.docs[i]
    const clientId = getRelationshipId(client.id)
    if (!clientId) continue

    const tipoServicio = client.vip
      ? client.zumba && client.box
        ? 'VIP + Zumba y Box'
        : 'VIP'
      : client.zumba && client.box
        ? 'Zumba y Box'
        : client.zumba
          ? 'Zumba'
          : client.box
            ? 'Box'
            : 'Normal'

    const turno = client.turno || null

    // Mes anterior
    const existingPrevious = await payloadInstance.find({
      collection: 'pagos',
      where: {
        and: [
          { cliente: { equals: clientId } },
          { mesPago: { equals: previousMonth.month } },
          { anioPago: { equals: previousMonth.year } },
        ],
      },
      depth: 0,
      limit: 1,
    })

    if (existingPrevious.totalDocs === 0) {
      await payloadInstance.create({
        collection: 'pagos',
        data: {
          cliente: clientId,
          monto: 40,
          metodoPago: randomChoice(METODO_PAGO_OPTIONS),
          tipoServicio,
          fechaPago: previousMonth.date,
          mesPago: previousMonth.month,
          anioPago: previousMonth.year,
          turno,
        },
      })
      createdCount++
    }

    // Dos meses atrás
    const existingTwoMonths = await payloadInstance.find({
      collection: 'pagos',
      where: {
        and: [
          { cliente: { equals: clientId } },
          { mesPago: { equals: twoMonthsAgo.month } },
          { anioPago: { equals: twoMonthsAgo.year } },
        ],
      },
      depth: 0,
      limit: 1,
    })

    if (existingTwoMonths.totalDocs === 0) {
      await payloadInstance.create({
        collection: 'pagos',
        data: {
          cliente: clientId,
          monto: 40,
          metodoPago: randomChoice(METODO_PAGO_OPTIONS),
          tipoServicio,
          fechaPago: twoMonthsAgo.date,
          mesPago: twoMonthsAgo.month,
          anioPago: twoMonthsAgo.year,
          turno,
        },
      })
      createdCount++
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  ✓ ${i + 1}/${clients.docs.length} clientes procesados`)
    }
  }

  console.log(`✓ Pagos históricos agregados: ${createdCount}`)
}

async function resetDemoData(payloadInstance: Awaited<ReturnType<typeof getPayload>>) {
  console.log(`🔄 Reseteando datos demo...`)

  const demoClients = await payloadInstance.find({
    collection: 'clientes',
    where: {
      email: {
        like: `@${DEMO_DOMAIN}`,
      },
    },
    depth: 0,
    limit: 1000,
  })

  const demoClientIds = demoClients.docs
    .map((client) => getRelationshipId(client.id))
    .filter((id): id is number => id !== null)

  if (demoClientIds.length > 0) {
    await payloadInstance.delete({
      collection: 'pagos',
      where: {
        cliente: {
          in: demoClientIds,
        },
      },
      context: { skipLog: true },
    })
    console.log(`  ✓ Pagos demo eliminados`)
  }

  await payloadInstance.delete({
    collection: 'clientes',
    where: {
      email: {
        like: `@${DEMO_DOMAIN}`,
      },
    },
    context: { skipLog: true },
  })
  console.log(`  ✓ Clientes demo eliminados`)

  await payloadInstance.delete({
    collection: 'users',
    where: {
      email: {
        like: `@${DEMO_DOMAIN}`,
      },
    },
  })
  console.log(`  ✓ Usuarios demo eliminados`)
}

async function main() {
  let payloadInstance: PayloadInstance | null = null

  try {
    payloadInstance = await getPayload({ config })
    const shouldReset = process.argv.includes('--reset')
    const countArg = process.argv.find((arg) => arg.startsWith('--count='))
    const clientCount = countArg ? parseInt(countArg.split('=')[1], 10) : 100

    if (isNaN(clientCount) || clientCount < 1) {
      throw new Error('--count debe ser un número válido >= 1')
    }

    if (shouldReset) {
      await resetDemoData(payloadInstance)
    }

    const clients = await generateClients(clientCount)
    const clientIds = await seedClients(payloadInstance, clients)
    await seedHistoricalPayments(payloadInstance, clientIds)

    const current = new Date()
    const pagosCurrentMonth = await payloadInstance.find({
      collection: 'pagos',
      where: {
        and: [
          { mesPago: { equals: current.getMonth() } },
          { anioPago: { equals: current.getFullYear() } },
        ],
      },
      depth: 0,
      limit: 2000,
    })

    const allDemoClients = await payloadInstance.find({
      collection: 'clientes',
      where: {
        email: {
          like: `@${DEMO_DOMAIN}`,
        },
      },
      depth: 0,
      limit: 1000,
    })

    console.log('\n✅ Seed demo completado')
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📊 Estadísticas:`)
    console.log(`  Total clientes demo en BD: ${allDemoClients.totalDocs}`)
    console.log(`  Pagos del mes actual: ${pagosCurrentMonth.totalDocs}`)
    console.log(`  Pagos históricos: ${clientIds.length * 2}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🔐 Login admin: admin@${DEMO_DOMAIN} / admin123`)
    console.log(`🔐 Login staff: staff@${DEMO_DOMAIN} / staff123`)
  } finally {
    await closePayload(payloadInstance)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando seed demo large:', error)
    process.exit(1)
  })

import 'dotenv/config'

import { getPayload } from 'payload'

import {
  METODO_PAGO_OPTIONS,
  TURNO_OPTIONS,
  type MetodoPago,
  type TipoServicio,
} from '../src/constants/domain'
import { getDefaultPrecios, getServiceFromFlags } from '../src/lib/pricing'
import config from '../src/payload.config'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>
type RelationshipId = number | string

type DemoUser = {
  email: string
  password: string
  role: 'admin' | 'staff'
  active: boolean
}

type GeneratedClient = {
  name: string
  lastName: string
  phone: string
  email: string
  tipoServicio: TipoServicio
  turno: (typeof TURNO_OPTIONS)[number] | null
  metodoPago: MetodoPago
}

type PrecioKey = keyof ReturnType<typeof getDefaultPrecios>
type PreciosMap = ReturnType<typeof getDefaultPrecios>

const DEMO_DOMAIN = 'demo.gym.local'
const DEFAULT_CLIENT_COUNT = 100
const DEMO_GYM_NAME = 'Gym-Demo'

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
] as const

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
  'Santos',
  'Romero',
  'Herrera',
] as const

const TIPO_SERVICIO_ORDER: TipoServicio[] = [
  'Normal',
  'Normal',
  'Normal',
  'Zumba',
  'Box',
  'Zumba y Box',
  'VIP',
  'VIP + Zumba y Box',
]

const DEMO_USERS: DemoUser[] = [
  {
    email: `admin@${DEMO_DOMAIN}`,
    password: 'admin123',
    role: 'admin',
    active: true,
  },
  {
    email: `staff@${DEMO_DOMAIN}`,
    password: 'staff123',
    role: 'staff',
    active: true,
  },
]

const DEMO_CONFIG: Record<string, string> = {
  nombre_gimnasio: DEMO_GYM_NAME,
  precio_normal: '30',
  precio_vip: '50',
  precio_zumba_o_box: '40',
  precio_zumba_y_box: '60',
  precio_vip_zumba_y_box: '80',
}

const DEMO_CONFIG_KEYS = Object.keys(DEMO_CONFIG)

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

const getCountArg = (): number => {
  const countArg = process.argv.find((arg) => arg.startsWith('--count='))
  if (!countArg) return DEFAULT_CLIENT_COUNT

  const parsed = Number.parseInt(countArg.split('=')[1] || '', 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error('--count debe ser un numero valido >= 1')
  }

  return parsed
}

const closePayload = async (payloadInstance: PayloadInstance | null) => {
  const db = payloadInstance?.db
  if (!db) return

  const destroy = 'destroy' in db ? db.destroy : null
  if (typeof destroy === 'function') {
    await destroy.call(db)
  }
}

const upsertConfiguracion = async (
  payloadInstance: PayloadInstance,
  clave: string,
  valor: string,
): Promise<void> => {
  const existing = await payloadInstance.find({
    collection: 'configuraciones',
    where: {
      clave: {
        equals: clave,
      },
    },
    depth: 0,
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    await payloadInstance.update({
      collection: 'configuraciones',
      id: existing.docs[0].id,
      data: { valor },
      context: { skipLog: true },
    })
    return
  }

  await payloadInstance.create({
    collection: 'configuraciones',
    data: { clave, valor },
    context: { skipLog: true },
  })
}

const seedInitialConfig = async (payloadInstance: PayloadInstance) => {
  for (const [clave, valor] of Object.entries(DEMO_CONFIG)) {
    await upsertConfiguracion(payloadInstance, clave, valor)
  }
}

const getConfiguredPrecios = async (payloadInstance: PayloadInstance): Promise<PreciosMap> => {
  const defaults = getDefaultPrecios()

  const docs = await payloadInstance.find({
    collection: 'configuraciones',
    where: {
      clave: {
        in: Object.keys(defaults),
      },
    },
    depth: 0,
    pagination: false,
    limit: 100,
  })

  const precios = { ...defaults }

  for (const doc of docs.docs) {
    const key = doc.clave as PrecioKey
    if (!(key in precios)) continue

    const parsed = Number(doc.valor)
    if (Number.isFinite(parsed)) {
      precios[key] = parsed
    }
  }

  return precios
}

const seedUsers = async (payloadInstance: PayloadInstance) => {
  for (const user of DEMO_USERS) {
    const existing = await payloadInstance.find({
      collection: 'users',
      where: {
        email: {
          equals: user.email,
        },
      },
      limit: 1,
      depth: 0,
    })

    if (existing.docs.length > 0) {
      await payloadInstance.update({
        collection: 'users',
        id: existing.docs[0].id,
        data: {
          role: user.role,
          active: user.active,
          password: user.password,
        },
      })
      continue
    }

    await payloadInstance.create({
      collection: 'users',
      data: user,
    })
  }
}

const generateClients = (count: number): GeneratedClient[] => {
  const clients: GeneratedClient[] = []

  for (let i = 0; i < count; i++) {
    const name = NOMBRES[i % NOMBRES.length]
    const lastName = APELLIDOS[Math.floor(i / NOMBRES.length) % APELLIDOS.length]
    const tipoServicio = TIPO_SERVICIO_ORDER[i % TIPO_SERVICIO_ORDER.length]
    const flags = getFlagsFromService(tipoServicio)
    const turno = flags.vip ? null : TURNO_OPTIONS[i % TURNO_OPTIONS.length]
    const metodoPago = METODO_PAGO_OPTIONS[i % METODO_PAGO_OPTIONS.length]

    const seq = String(i + 1).padStart(4, '0')
    clients.push({
      name,
      lastName,
      tipoServicio,
      turno,
      metodoPago,
      phone: `31${String(i + 1).padStart(8, '0')}`,
      email: `${name.toLowerCase()}.${lastName.toLowerCase()}.${seq}@${DEMO_DOMAIN}`,
    })
  }

  return clients
}

const upsertClients = async (
  payloadInstance: PayloadInstance,
  clients: GeneratedClient[],
): Promise<RelationshipId[]> => {
  const ids: RelationshipId[] = []

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i]
    const flags = getFlagsFromService(client.tipoServicio)

    const existing = await payloadInstance.find({
      collection: 'clientes',
      where: {
        phone: {
          equals: client.phone,
        },
      },
      limit: 1,
      depth: 0,
    })

    if (existing.totalDocs > 0) {
      const updated = await payloadInstance.update({
        collection: 'clientes',
        id: existing.docs[0].id,
        data: {
          name: client.name,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          metodoPago: client.metodoPago,
          turno: client.turno,
          ...flags,
        },
      })
      ids.push(updated.id)
    } else {
      const created = await payloadInstance.create({
        collection: 'clientes',
        data: {
          name: client.name,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          metodoPago: client.metodoPago,
          turno: client.turno,
          ...flags,
        },
      })
      ids.push(created.id)
    }

    if ((i + 1) % 20 === 0 || i + 1 === clients.length) {
      console.log(`  ✓ ${i + 1}/${clients.length} clientes procesados`)
    }
  }

  return ids
}

const ensurePaymentsForMonth = async (
  payloadInstance: PayloadInstance,
  clientIds: RelationshipId[],
  monthInfo: { month: number; year: number; date: string },
  precios: PreciosMap,
) => {
  const clients = await payloadInstance.find({
    collection: 'clientes',
    where: {
      id: {
        in: clientIds,
      },
    },
    depth: 0,
    limit: clientIds.length + 10,
  })

  let createdCount = 0

  for (const client of clients.docs) {
    const clientId = client.id

    const existing = await payloadInstance.find({
      collection: 'pagos',
      where: {
        and: [
          {
            cliente: {
              equals: clientId,
            },
          },
          {
            mesPago: {
              equals: monthInfo.month,
            },
          },
          {
            anioPago: {
              equals: monthInfo.year,
            },
          },
        ],
      },
      depth: 0,
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      continue
    }

    const { tipoServicio, monto } = getServiceFromFlags(
      {
        vip: client.vip,
        zumba: client.zumba,
        box: client.box,
      },
      precios,
    )

    await payloadInstance.create({
      collection: 'pagos',
      data: {
        cliente: clientId,
        monto,
        metodoPago: (client.metodoPago as MetodoPago | null) ?? 'Efectivo',
        tipoServicio,
        fechaPago: monthInfo.date,
        mesPago: monthInfo.month,
        anioPago: monthInfo.year,
        turno: client.turno ?? null,
      },
      context: { skipLog: true },
    })

    createdCount++
  }

  return createdCount
}

const resetDemoData = async (payloadInstance: PayloadInstance) => {
  const demoClients = await payloadInstance.find({
    collection: 'clientes',
    where: {
      email: {
        like: `@${DEMO_DOMAIN}`,
      },
    },
    depth: 0,
    limit: 5000,
  })

  const demoClientIds = demoClients.docs.map((client) => client.id)

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

  await payloadInstance.delete({
    collection: 'users',
    where: {
      email: {
        like: `@${DEMO_DOMAIN}`,
      },
    },
  })

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

async function main() {
  let payloadInstance: PayloadInstance | null = null

  try {
    payloadInstance = await getPayload({ config })

    const shouldReset = process.argv.includes('--reset')
    const count = getCountArg()

    if (shouldReset) {
      console.log('🔄 Reseteando dataset demo...')
      await resetDemoData(payloadInstance)
    }

    console.log('⚙️ Upsert de configuraciones iniciales...')
    await seedInitialConfig(payloadInstance)

    console.log('👤 Upsert de usuarios demo...')
    await seedUsers(payloadInstance)

    console.log(`🧾 Generando ${count} clientes demo...`)
    const clients = generateClients(count)
    const clientIds = await upsertClients(payloadInstance, clients)

    const precios = await getConfiguredPrecios(payloadInstance)
    const now = new Date()
    const previousMonth = getMonthOffset(now, -1)
    const nextMonth = getMonthOffset(now, 1)

    console.log('💳 Generando pagos historicos del mes anterior...')
    const previousCreated = await ensurePaymentsForMonth(
      payloadInstance,
      clientIds,
      previousMonth,
      precios,
    )

    console.log('💳 Generando pagos proyectados del mes siguiente...')
    const nextCreated = await ensurePaymentsForMonth(payloadInstance, clientIds, nextMonth, precios)

    const currentMonthSummary = await payloadInstance.find({
      collection: 'pagos',
      where: {
        and: [
          {
            cliente: {
              in: clientIds,
            },
          },
          {
            mesPago: {
              equals: now.getMonth(),
            },
          },
          {
            anioPago: {
              equals: now.getFullYear(),
            },
          },
        ],
      },
      depth: 0,
      limit: 5000,
    })

    console.log('\n✅ Seed demo completado')
    console.log(`  Clientes demo: ${count}`)
    console.log(`  Pagos mes anterior creados: ${previousCreated}`)
    console.log(`  Pagos mes siguiente creados: ${nextCreated}`)
    console.log(`  Pagos mes actual detectados (hook): ${currentMonthSummary.totalDocs}`)
    console.log(`  Config nombre_gimnasio: ${DEMO_GYM_NAME}`)
    console.log(`  Login admin: admin@${DEMO_DOMAIN} / admin123`)
    console.log(`  Login staff: staff@${DEMO_DOMAIN} / staff123`)
  } finally {
    await closePayload(payloadInstance)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando seed demo:', error)
    process.exit(1)
  })

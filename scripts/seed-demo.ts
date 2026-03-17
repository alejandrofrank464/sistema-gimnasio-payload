import 'dotenv/config'

import { getPayload } from 'payload'

import { METODO_PAGO_OPTIONS, TURNO_OPTIONS, type TipoServicio } from '../src/constants/domain'
import config from '../src/payload.config'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

type DemoClient = {
  name: string
  lastName: string
  phone: string
  email: string
  tipoServicio: TipoServicio
  turno: (typeof TURNO_OPTIONS)[number] | null
  metodoPago: (typeof METODO_PAGO_OPTIONS)[number]
}

type DemoUser = {
  email: string
  password: string
  role: 'admin' | 'staff'
  active: boolean
}

type RelationshipValue = number | string | { id?: number | string | null } | null | undefined

const DEMO_DOMAIN = 'demo.gym.local'

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

const DEMO_CLIENTS: DemoClient[] = [
  {
    name: 'Juan',
    lastName: 'Perez',
    phone: '300000001',
    email: `juan.perez@${DEMO_DOMAIN}`,
    tipoServicio: 'Normal',
    turno: 'de 7:00 am a 8:00 am',
    metodoPago: 'Efectivo',
  },
  {
    name: 'Maria',
    lastName: 'Lopez',
    phone: '300000002',
    email: `maria.lopez@${DEMO_DOMAIN}`,
    tipoServicio: 'Zumba',
    turno: 'de 8:00 am a 9:00 am',
    metodoPago: 'Tarjeta',
  },
  {
    name: 'Carlos',
    lastName: 'Gomez',
    phone: '300000003',
    email: `carlos.gomez@${DEMO_DOMAIN}`,
    tipoServicio: 'Box',
    turno: 'de 9:00 am a 10:00 am',
    metodoPago: 'Efectivo',
  },
  {
    name: 'Ana',
    lastName: 'Diaz',
    phone: '300000004',
    email: `ana.diaz@${DEMO_DOMAIN}`,
    tipoServicio: 'Zumba y Box',
    turno: 'de 10:00 am a 11:00 am',
    metodoPago: 'Tarjeta',
  },
  {
    name: 'Luis',
    lastName: 'Martinez',
    phone: '300000005',
    email: `luis.martinez@${DEMO_DOMAIN}`,
    tipoServicio: 'VIP',
    turno: null,
    metodoPago: 'Tarjeta',
  },
  {
    name: 'Sofia',
    lastName: 'Ramirez',
    phone: '300000006',
    email: `sofia.ramirez@${DEMO_DOMAIN}`,
    tipoServicio: 'VIP + Zumba y Box',
    turno: 'de 4:00 pm a 5:00 pm',
    metodoPago: 'Efectivo',
  },
  {
    name: 'Pedro',
    lastName: 'Torres',
    phone: '300000007',
    email: `pedro.torres@${DEMO_DOMAIN}`,
    tipoServicio: 'Normal',
    turno: 'de 1:00 pm a 2:00 pm',
    metodoPago: 'Efectivo',
  },
  {
    name: 'Lucia',
    lastName: 'Vargas',
    phone: '300000008',
    email: `lucia.vargas@${DEMO_DOMAIN}`,
    tipoServicio: 'Zumba',
    turno: 'de 2:00 pm a 3:00 pm',
    metodoPago: 'Tarjeta',
  },
  {
    name: 'Diego',
    lastName: 'Morales',
    phone: '300000009',
    email: `diego.morales@${DEMO_DOMAIN}`,
    tipoServicio: 'Box',
    turno: 'de 3:00 pm a 4:00 pm',
    metodoPago: 'Efectivo',
  },
  {
    name: 'Valentina',
    lastName: 'Castro',
    phone: '300000010',
    email: `valentina.castro@${DEMO_DOMAIN}`,
    tipoServicio: 'VIP',
    turno: null,
    metodoPago: 'Tarjeta',
  },
  {
    name: 'Andres',
    lastName: 'Rojas',
    phone: '300000011',
    email: `andres.rojas@${DEMO_DOMAIN}`,
    tipoServicio: 'Zumba y Box',
    turno: 'de 5:00 pm a 6:00 pm',
    metodoPago: 'Efectivo',
  },
  {
    name: 'Camila',
    lastName: 'Suarez',
    phone: '300000012',
    email: `camila.suarez@${DEMO_DOMAIN}`,
    tipoServicio: 'Normal',
    turno: 'de 6:00 pm a 7:00 pm',
    metodoPago: 'Tarjeta',
  },
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

async function seedUsers(payloadInstance: Awaited<ReturnType<typeof getPayload>>) {
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
      const existingUser = existing.docs[0]
      await payloadInstance.update({
        collection: 'users',
        id: existingUser.id,
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

const closePayload = async (payloadInstance: PayloadInstance | null) => {
  const db = payloadInstance?.db
  if (!db) return

  const destroy = 'destroy' in db ? db.destroy : null
  if (typeof destroy === 'function') {
    await destroy.call(db)
  }
}

async function seedClients(payloadInstance: Awaited<ReturnType<typeof getPayload>>) {
  const upsertedClientIds: Array<number | string> = []

  for (const client of DEMO_CLIENTS) {
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

    const flags = getFlagsFromService(client.tipoServicio)

    if (existing.docs.length > 0) {
      const existingClient = existing.docs[0]
      const updated = await payloadInstance.update({
        collection: 'clientes',
        id: existingClient.id,
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
      upsertedClientIds.push(updated.id)
      continue
    }

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

    upsertedClientIds.push(created.id)
  }

  return upsertedClientIds
}

async function seedHistoricalPayments(
  payloadInstance: Awaited<ReturnType<typeof getPayload>>,
  clientIds: Array<number | string>,
) {
  const now = new Date()
  const previousMonth = getMonthOffset(now, -1)
  const twoMonthsAgo = getMonthOffset(now, -2)

  const clients = await payloadInstance.find({
    collection: 'clientes',
    where: {
      id: {
        in: clientIds,
      },
    },
    depth: 0,
    limit: 100,
  })

  for (const client of clients.docs) {
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

    const existingPrevious = await payloadInstance.find({
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
              equals: previousMonth.month,
            },
          },
          {
            anioPago: {
              equals: previousMonth.year,
            },
          },
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
          metodoPago: 'Efectivo',
          tipoServicio,
          fechaPago: previousMonth.date,
          mesPago: previousMonth.month,
          anioPago: previousMonth.year,
          turno,
        },
      })
    }

    const existingTwoMonths = await payloadInstance.find({
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
              equals: twoMonthsAgo.month,
            },
          },
          {
            anioPago: {
              equals: twoMonthsAgo.year,
            },
          },
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
          metodoPago: 'Tarjeta',
          tipoServicio,
          fechaPago: twoMonthsAgo.date,
          mesPago: twoMonthsAgo.month,
          anioPago: twoMonthsAgo.year,
          turno,
        },
      })
    }
  }
}

async function resetDemoData(payloadInstance: Awaited<ReturnType<typeof getPayload>>) {
  const demoClients = await payloadInstance.find({
    collection: 'clientes',
    where: {
      email: {
        like: `@${DEMO_DOMAIN}`,
      },
    },
    depth: 0,
    limit: 500,
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
}

async function main() {
  let payloadInstance: PayloadInstance | null = null

  try {
    payloadInstance = await getPayload({ config })
    const shouldReset = process.argv.includes('--reset')

    if (shouldReset) {
      await resetDemoData(payloadInstance)
    }

    await seedUsers(payloadInstance)
    const clientIds = await seedClients(payloadInstance)
    await seedHistoricalPayments(payloadInstance, clientIds)

    const current = new Date()
    const pagosCurrentMonth = await payloadInstance.find({
      collection: 'pagos',
      where: {
        and: [
          {
            mesPago: {
              equals: current.getMonth(),
            },
          },
          {
            anioPago: {
              equals: current.getFullYear(),
            },
          },
        ],
      },
      depth: 0,
      limit: 200,
    })

    console.log('Seed demo completado')
    console.log(`Usuarios demo: ${DEMO_USERS.length}`)
    console.log(`Clientes demo: ${DEMO_CLIENTS.length}`)
    console.log(`Pagos del mes actual: ${pagosCurrentMonth.totalDocs}`)
    console.log(`Login admin: admin@${DEMO_DOMAIN} / admin123`)
    console.log(`Login staff: staff@${DEMO_DOMAIN} / staff123`)
  } finally {
    await closePayload(payloadInstance)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error ejecutando seed demo:', error)
    process.exit(1)
  })

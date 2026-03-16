'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { initialSettings } from '@/lib/mock-data'
import type { Client, LogEntry, Payment, Settings, TipoServicio, Turno } from '@/types'

interface DataContextType {
  clients: Client[]
  payments: Payment[]
  logs: LogEntry[]
  settings: Settings
  loading: boolean
  refresh: () => Promise<void>
  addClient: (client: Omit<Client, 'id' | 'fechaRegistro'>) => Promise<void>
  updateClient: (id: string, data: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  addPayment: (
    payment: Omit<Payment, 'id' | 'fecha'>,
  ) => Promise<{ success: boolean; error?: string }>
  updatePayment: (id: string, data: Partial<Payment>) => Promise<void>
  deletePayment: (id: string) => Promise<void>
  updateSettings: (data: Partial<Settings>) => Promise<void>
  getClientPayments: (clientId: string) => Payment[]
  getActiveClients: (mes: number, anio: number) => (Client & { pagado: boolean })[]
}

type BackendCliente = {
  id: number
  name: string
  lastName: string
  phone: string
  email?: string | null
  vip?: boolean | null
  zumba?: boolean | null
  box?: boolean | null
  turno?: string | null
  createdAt?: string
}

type BackendPago = {
  id: number
  monto: number
  metodoPago?: 'Efectivo' | 'Tarjeta' | null
  tipoServicio: TipoServicio
  fechaPago: string
  mesPago: number
  anioPago: number
  turno?: string | null
  cliente?: number | BackendCliente | null
}

type BackendLog = {
  id: number
  accion: string
  entidad: string
  usuario?: string | null
  nombreCompleto?: string | null
  createdAt: string
  detalles?: unknown
}

type PriceMap = {
  precio_normal: number
  precio_vip: number
  precio_zumba_o_box: number
  precio_zumba_y_box: number
  precio_vip_zumba_y_box: number
}

const DataContext = createContext<DataContextType | null>(null)

const TURNO_BACKEND_TO_UI: Record<string, Turno> = {
  'de 7:00 am a 8:00 am': '07:00',
  'de 8:00 am a 9:00 am': '08:00',
  'de 9:00 am a 10:00 am': '09:00',
  'de 10:00 am a 11:00 am': '10:00',
  'de 11:00 am a 12:00 pm': '11:00',
  'de 1:00 pm a 2:00 pm': '13:00',
  'de 2:00 pm a 3:00 pm': '14:00',
  'de 3:00 pm a 4:00 pm': '15:00',
  'de 4:00 pm a 5:00 pm': '16:00',
  'de 5:00 pm a 6:00 pm': '17:00',
  'de 6:00 pm a 7:00 pm': '18:00',
  'de 7:00 pm a 8:00 pm': '19:00',
}

const TURNO_UI_TO_BACKEND: Record<Turno, string> = {
  '07:00': 'de 7:00 am a 8:00 am',
  '08:00': 'de 8:00 am a 9:00 am',
  '09:00': 'de 9:00 am a 10:00 am',
  '10:00': 'de 10:00 am a 11:00 am',
  '11:00': 'de 11:00 am a 12:00 pm',
  '13:00': 'de 1:00 pm a 2:00 pm',
  '14:00': 'de 2:00 pm a 3:00 pm',
  '15:00': 'de 3:00 pm a 4:00 pm',
  '16:00': 'de 4:00 pm a 5:00 pm',
  '17:00': 'de 5:00 pm a 6:00 pm',
  '18:00': 'de 6:00 pm a 7:00 pm',
  '19:00': 'de 7:00 pm a 8:00 pm',
}

const DEFAULT_PRICES: PriceMap = {
  precio_normal: 30,
  precio_vip: 50,
  precio_zumba_o_box: 40,
  precio_zumba_y_box: 60,
  precio_vip_zumba_y_box: 80,
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem('gym_token')
}

const authHeaders = (): HeadersInit => {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `JWT ${token}`
  }

  return headers
}

const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers || {}),
    },
    credentials: 'include',
  })
}

const deriveServiceFromFlags = (cliente: BackendCliente): TipoServicio => {
  if (cliente.vip && cliente.zumba && cliente.box) return 'VIP + Zumba y Box'
  if (cliente.vip) return 'VIP'
  if (cliente.zumba && cliente.box) return 'Zumba y Box'
  if (cliente.zumba) return 'Zumba'
  if (cliente.box) return 'Box'
  return 'Normal'
}

const priceForService = (tipo: TipoServicio, prices: PriceMap): number => {
  switch (tipo) {
    case 'VIP + Zumba y Box':
      return prices.precio_vip_zumba_y_box
    case 'VIP':
      return prices.precio_vip
    case 'Zumba y Box':
      return prices.precio_zumba_y_box
    case 'Zumba':
    case 'Box':
      return prices.precio_zumba_o_box
    default:
      return prices.precio_normal
  }
}

const mapPayment = (payment: BackendPago): Payment => {
  const relatedClient = typeof payment.cliente === 'object' ? payment.cliente : null
  return {
    id: String(payment.id),
    clienteId:
      payment.cliente == null
        ? null
        : typeof payment.cliente === 'number'
          ? String(payment.cliente)
          : String(payment.cliente.id),
    clienteNombre: relatedClient
      ? `${relatedClient.name} ${relatedClient.lastName}`
      : 'Cliente eliminado',
    monto: payment.monto,
    mes: payment.mesPago,
    anio: payment.anioPago,
    metodoPago: payment.metodoPago ?? 'Efectivo',
    tipoServicio: payment.tipoServicio,
    turno: payment.turno ? (TURNO_BACKEND_TO_UI[payment.turno] ?? '08:00') : '08:00',
    fecha: payment.fechaPago,
    estado: 'Completado',
  }
}

const mapLog = (log: BackendLog): LogEntry => {
  const accionMap: Record<string, LogEntry['accion']> = {
    crear_cliente: 'Crear',
    editar_cliente: 'Editar',
    eliminar_cliente: 'Eliminar',
    crear_pago: 'Crear',
    editar_pago: 'Editar',
    eliminar_pago: 'Eliminar',
  }

  const entidadMap: Record<string, LogEntry['entidad']> = {
    Cliente: 'Cliente',
    Pago: 'Pago',
    Ajuste: 'Ajuste',
  }

  return {
    id: String(log.id),
    entidad: entidadMap[log.entidad] ?? 'Ajuste',
    accion: accionMap[log.accion] ?? 'Editar',
    descripcion: log.nombreCompleto || log.accion,
    fecha: log.createdAt,
    usuario: log.usuario || 'Sistema',
  }
}

const mapClients = (
  clientes: BackendCliente[],
  payments: Payment[],
  prices: PriceMap,
): Client[] => {
  return clientes.map((cliente) => {
    const paymentsForClient = payments
      .filter((payment) => payment.clienteId === String(cliente.id))
      .sort((a, b) => b.anio * 12 + b.mes - (a.anio * 12 + a.mes))

    const latest = paymentsForClient[0]
    const tipoServicio = latest?.tipoServicio ?? deriveServiceFromFlags(cliente)
    const precioMensual = latest?.monto ?? priceForService(tipoServicio, prices)

    return {
      id: String(cliente.id),
      nombre: cliente.name,
      apellido: cliente.lastName,
      telefono: cliente.phone,
      email: cliente.email || '',
      tipoServicio,
      turno: cliente.turno ? (TURNO_BACKEND_TO_UI[cliente.turno] ?? '08:00') : '08:00',
      precioMensual,
      fechaRegistro: cliente.createdAt?.split('T')[0] ?? '',
      notas: '',
    }
  })
}

const tipoServicioFlags = (tipoServicio: TipoServicio) => {
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

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setClients([])
      setPayments([])
      setLogs([])
      setSettings(initialSettings)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const [clientesRes, pagosRes, logsRes, preciosRes, logoRes] = await Promise.all([
        authFetch('/api/clientes?limit=500&depth=0&sort=name'),
        authFetch('/api/pagos?limit=1000&depth=1&sort=-fechaPago'),
        authFetch('/api/logs?limit=500&depth=0&sort=-createdAt'),
        fetch('/api/configuraciones/precios'),
        fetch('/api/configuraciones/logo'),
      ])

      const clientesJson = (await clientesRes.json()) as { docs?: BackendCliente[] }
      const pagosJson = (await pagosRes.json()) as { docs?: BackendPago[] }
      const logsJson = (await logsRes.json()) as { docs?: BackendLog[] }
      const preciosJson = (await preciosRes.json()) as { data?: Partial<PriceMap> }
      const logoJson = (await logoRes.json()) as { data?: { url?: string | null } | null }

      const priceMap = {
        ...DEFAULT_PRICES,
        ...(preciosJson.data || {}),
      }

      const mappedPayments = (pagosJson.docs ?? []).map(mapPayment)
      const mappedClients = mapClients(clientesJson.docs ?? [], mappedPayments, priceMap)
      const mappedLogs = (logsJson.docs ?? []).map(mapLog)

      setPayments(mappedPayments)
      setClients(mappedClients)
      setLogs(mappedLogs)
      setSettings({
        ...initialSettings,
        precios: [
          { tipoServicio: 'Normal', precio: priceMap.precio_normal },
          { tipoServicio: 'VIP', precio: priceMap.precio_vip },
          { tipoServicio: 'Zumba', precio: priceMap.precio_zumba_o_box },
          { tipoServicio: 'Box', precio: priceMap.precio_zumba_o_box },
          { tipoServicio: 'Zumba y Box', precio: priceMap.precio_zumba_y_box },
          { tipoServicio: 'VIP + Zumba y Box', precio: priceMap.precio_vip_zumba_y_box },
        ],
        logoUrl: logoJson.data?.url || '',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addClient = useCallback(
    async (data: Omit<Client, 'id' | 'fechaRegistro'>) => {
      const flags = tipoServicioFlags(data.tipoServicio)
      await authFetch('/api/clientes', {
        method: 'POST',
        body: JSON.stringify({
          name: data.nombre,
          lastName: data.apellido,
          phone: data.telefono,
          email: data.email || null,
          metodoPago: 'Efectivo',
          turno: flags.vip ? null : TURNO_UI_TO_BACKEND[data.turno],
          ...flags,
        }),
      })
      await refresh()
    },
    [refresh],
  )

  const updateClient = useCallback(
    async (id: string, data: Partial<Client>) => {
      const flags = data.tipoServicio ? tipoServicioFlags(data.tipoServicio) : undefined
      await authFetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(data.nombre ? { name: data.nombre } : {}),
          ...(data.apellido ? { lastName: data.apellido } : {}),
          ...(data.telefono ? { phone: data.telefono } : {}),
          ...(data.email !== undefined ? { email: data.email || null } : {}),
          ...(data.turno ? { turno: TURNO_UI_TO_BACKEND[data.turno] } : {}),
          ...(flags || {}),
        }),
      })
      await refresh()
    },
    [refresh],
  )

  const deleteClient = useCallback(
    async (id: string) => {
      await authFetch(`/api/clientes/${id}`, {
        method: 'DELETE',
      })
      await refresh()
    },
    [refresh],
  )

  const addPayment = useCallback(
    async (data: Omit<Payment, 'id' | 'fecha'>) => {
      const response = await authFetch('/api/pagos', {
        method: 'POST',
        body: JSON.stringify({
          cliente: Number(data.clienteId),
          monto: data.monto,
          metodoPago: data.metodoPago,
          tipoServicio: data.tipoServicio,
          turno:
            data.tipoServicio === 'VIP' || data.tipoServicio === 'VIP + Zumba y Box'
              ? null
              : TURNO_UI_TO_BACKEND[data.turno],
          fechaPago: new Date().toISOString().split('T')[0],
          mesPago: data.mes,
          anioPago: data.anio,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          errors?: Array<{ message?: string }>
        } | null
        return {
          success: false,
          error: body?.errors?.[0]?.message || 'No se pudo registrar el pago.',
        }
      }

      await refresh()
      return { success: true }
    },
    [refresh],
  )

  const updatePayment = useCallback(
    async (id: string, data: Partial<Payment>) => {
      await authFetch(`/api/pagos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(data.monto !== undefined ? { monto: data.monto } : {}),
          ...(data.metodoPago ? { metodoPago: data.metodoPago } : {}),
          ...(data.tipoServicio ? { tipoServicio: data.tipoServicio } : {}),
          ...(data.turno ? { turno: TURNO_UI_TO_BACKEND[data.turno] } : {}),
          ...(data.mes !== undefined ? { mesPago: data.mes } : {}),
          ...(data.anio !== undefined ? { anioPago: data.anio } : {}),
        }),
      })
      await refresh()
    },
    [refresh],
  )

  const deletePayment = useCallback(
    async (id: string) => {
      await authFetch(`/api/pagos/${id}`, {
        method: 'DELETE',
      })
      await refresh()
    },
    [refresh],
  )

  const updateSettings = useCallback(
    async (data: Partial<Settings>) => {
      if (data.nombreGimnasio) {
        await fetch('/api/configuraciones/upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clave: 'nombre_gimnasio', valor: data.nombreGimnasio }),
        })
      }

      if (data.precios) {
        const keyMap: Record<TipoServicio, keyof PriceMap> = {
          Normal: 'precio_normal',
          VIP: 'precio_vip',
          Zumba: 'precio_zumba_o_box',
          Box: 'precio_zumba_o_box',
          'Zumba y Box': 'precio_zumba_y_box',
          'VIP + Zumba y Box': 'precio_vip_zumba_y_box',
        }

        const latestByKey = new Map<keyof PriceMap, number>()
        for (const item of data.precios) {
          latestByKey.set(keyMap[item.tipoServicio], item.precio)
        }

        for (const [clave, valor] of latestByKey.entries()) {
          await fetch('/api/configuraciones/upsert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clave, valor }),
          })
        }
      }

      if (data.logoUrl) {
        setSettings((prev) => ({ ...prev, logoUrl: data.logoUrl || prev.logoUrl }))
      }

      await refresh()
    },
    [refresh],
  )

  const getClientPayments = useCallback(
    (clientId: string) => {
      return payments
        .filter((payment) => payment.clienteId === clientId)
        .sort((a, b) => {
          const da = a.anio * 12 + a.mes
          const db = b.anio * 12 + b.mes
          return db - da
        })
    },
    [payments],
  )

  const getActiveClients = useCallback(
    (mes: number, anio: number) => {
      return clients.map((client) => ({
        ...client,
        pagado: payments.some(
          (payment) =>
            payment.clienteId === client.id && payment.mes === mes && payment.anio === anio,
        ),
      }))
    },
    [clients, payments],
  )

  const value = useMemo<DataContextType>(
    () => ({
      clients,
      payments,
      logs,
      settings,
      loading,
      refresh,
      addClient,
      updateClient,
      deleteClient,
      addPayment,
      updatePayment,
      deletePayment,
      updateSettings,
      getClientPayments,
      getActiveClients,
    }),
    [
      clients,
      payments,
      logs,
      settings,
      loading,
      refresh,
      addClient,
      updateClient,
      deleteClient,
      addPayment,
      updatePayment,
      deletePayment,
      updateSettings,
      getClientPayments,
      getActiveClients,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Client, MetodoPago, Settings, TipoServicio, Turno } from '@/types'

type BackendCliente = {
  id: number
  name: string
  lastName: string
  phone: string
  email?: string | null
  notes?: string | null
  metodoPago?: MetodoPago | null
  vip?: boolean | null
  zumba?: boolean | null
  box?: boolean | null
  turno?: string | null
  createdAt?: string
}

type PriceMap = {
  precio_normal: number
  precio_vip: number
  precio_zumba_o_box: number
  precio_zumba_y_box: number
  precio_vip_zumba_y_box: number
}

const DEFAULT_PRICES: PriceMap = {
  precio_normal: 30,
  precio_vip: 50,
  precio_zumba_o_box: 40,
  precio_zumba_y_box: 60,
  precio_vip_zumba_y_box: 80,
}

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

const settingsToPriceMap = (settings: Settings): PriceMap => {
  const priceMap: PriceMap = { ...DEFAULT_PRICES }

  for (const item of settings.precios) {
    if (item.tipoServicio === 'Normal') priceMap.precio_normal = item.precio
    if (item.tipoServicio === 'VIP') priceMap.precio_vip = item.precio
    if (item.tipoServicio === 'Zumba' || item.tipoServicio === 'Box') {
      priceMap.precio_zumba_o_box = item.precio
    }
    if (item.tipoServicio === 'Zumba y Box') priceMap.precio_zumba_y_box = item.precio
    if (item.tipoServicio === 'VIP + Zumba y Box') priceMap.precio_vip_zumba_y_box = item.precio
  }

  return priceMap
}

const mapClients = (clientes: BackendCliente[], settings: Settings): Client[] => {
  const prices = settingsToPriceMap(settings)

  return clientes.map((cliente) => {
    const tipoServicio = deriveServiceFromFlags(cliente)
    const precioMensual = priceForService(tipoServicio, prices)

    return {
      id: String(cliente.id),
      nombre: cliente.name,
      apellido: cliente.lastName,
      telefono: cliente.phone,
      email: cliente.email || '',
      metodoPago: cliente.metodoPago ?? 'Efectivo',
      tipoServicio,
      turno: cliente.turno ? (TURNO_BACKEND_TO_UI[cliente.turno] ?? '08:00') : '08:00',
      precioMensual,
      fechaRegistro: cliente.createdAt?.split('T')[0] ?? '',
      notas: cliente.notes || '',
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

const invalidateClientRelatedQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.clients }),
    queryClient.invalidateQueries({ queryKey: ['clients', 'list'] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
  ])
}

type PaginatedClientsResult = {
  docs: Client[]
  totalDocs: number
  totalPages: number
  page: number
}

type BackendPaginatedClientsResponse = {
  docs?: BackendCliente[]
  totalDocs?: number
  totalPages?: number
  page?: number
}

export const useClientsQuery = (settings: Settings) => {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: async () => {
      const response = await apiClient.clientes.list()
      const json = (await response.json()) as { docs?: BackendCliente[] }
      return mapClients(json.docs ?? [], settings)
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export const useClientsListQuery = (
  settings: Settings,
  params: { page: number; limit: number; search?: string },
) => {
  return useQuery({
    queryKey: queryKeys.clientsList(params),
    queryFn: async (): Promise<PaginatedClientsResult> => {
      const response = await apiClient.clientes.list(params)
      const json = (await response.json()) as BackendPaginatedClientsResponse

      return {
        docs: mapClients(json.docs ?? [], settings),
        totalDocs: json.totalDocs ?? 0,
        totalPages: json.totalPages ?? 1,
        page: json.page ?? params.page,
      }
    },
    staleTime: 2 * 60_000,
    gcTime: 20 * 60_000,
  })
}

export const useCreateClientMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Client, 'id' | 'fechaRegistro'>) => {
      const flags = tipoServicioFlags(data.tipoServicio)
      await apiClient.clientes.create({
        name: data.nombre,
        lastName: data.apellido,
        phone: data.telefono,
        email: data.email || null,
        notes: data.notas || null,
        metodoPago: data.metodoPago,
        turno: flags.vip ? null : TURNO_UI_TO_BACKEND[data.turno],
        ...flags,
      })
    },
    onSuccess: async () => {
      await invalidateClientRelatedQueries(queryClient)
    },
  })
}

export const useUpdateClientMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const flags = data.tipoServicio ? tipoServicioFlags(data.tipoServicio) : undefined
      await apiClient.clientes.update(id, {
        ...(data.nombre ? { name: data.nombre } : {}),
        ...(data.apellido ? { lastName: data.apellido } : {}),
        ...(data.telefono ? { phone: data.telefono } : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
        ...(data.notas !== undefined ? { notes: data.notas || null } : {}),
        ...(data.metodoPago ? { metodoPago: data.metodoPago } : {}),
        ...(data.turno ? { turno: TURNO_UI_TO_BACKEND[data.turno] } : {}),
        ...(flags || {}),
      })
    },
    onSuccess: async () => {
      await invalidateClientRelatedQueries(queryClient)
    },
  })
}

export const useDeleteClientMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.clientes.remove(id)
    },
    onSuccess: async () => {
      await invalidateClientRelatedQueries(queryClient)
    },
  })
}

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Payment } from '@/types'
import { isVipServiceType, VIP_TURNO_VALUE } from '@/features/clients/schemas/client-form.schema'

type BackendCliente = {
  id: number
  name: string
  lastName: string
}

type BackendPago = {
  id: number
  monto: number
  metodoPago?: 'Efectivo' | 'Tarjeta' | null
  tipoServicio: Payment['tipoServicio']
  fechaPago: string
  mesPago: number
  anioPago: number
  turno?: string | null
  cliente?: number | BackendCliente | null
}

const TURNO_BACKEND_TO_UI: Record<string, Payment['turno']> = {
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

const TURNO_UI_TO_BACKEND: Record<Exclude<Payment['turno'], 'VIP'>, string> = {
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

const mapTurnoToBackend = (turno: Payment['turno']): string | null => {
  if (turno === VIP_TURNO_VALUE) {
    return null
  }

  return TURNO_UI_TO_BACKEND[turno]
}

const mapPayment = (payment: BackendPago): Payment => {
  const relatedClient = typeof payment.cliente === 'object' ? payment.cliente : null
  const isVip = isVipServiceType(payment.tipoServicio)

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
    turno:
      payment.turno == null
        ? isVip
          ? VIP_TURNO_VALUE
          : '08:00'
        : (TURNO_BACKEND_TO_UI[payment.turno] ?? '08:00'),
    fecha: payment.fechaPago,
  }
}

const parseApiError = async (response: Response): Promise<string> => {
  const body = (await response.json().catch(() => null)) as {
    errors?: Array<{ message?: string }>
  } | null

  return body?.errors?.[0]?.message || 'Operacion no completada'
}

type PaginatedPaymentsResult = {
  docs: Payment[]
  totalDocs: number
  totalPages: number
  page: number
}

type BackendPaginatedResponse = {
  docs?: BackendPago[]
  totalDocs?: number
  totalPages?: number
  page?: number
}

export const usePaymentsQuery = () => {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: async () => {
      const response = await apiClient.pagos.list({ page: 1, limit: 1000 })
      const json = (await response.json()) as { docs?: BackendPago[] }
      return (json.docs ?? []).map(mapPayment)
    },
    staleTime: 2 * 60_000,
    gcTime: 20 * 60_000,
  })
}

type UsePaymentsQueryParams = {
  month?: number
  year?: number
  limit?: number
}

export const usePaymentsQueryFiltered = (params?: UsePaymentsQueryParams) => {
  const month = params?.month
  const year = params?.year
  const limit = params?.limit ?? 500

  return useQuery({
    queryKey: queryKeys.paymentsFiltered({ month, year, limit }),
    queryFn: async () => {
      const response = await apiClient.pagos.list({ page: 1, limit, month, year })
      const json = (await response.json()) as { docs?: BackendPago[] }
      return (json.docs ?? []).map(mapPayment)
    },
    staleTime: 2 * 60_000,
    gcTime: 20 * 60_000,
  })
}

export const useClientPaymentsQuery = (clientId?: string) => {
  return useQuery({
    queryKey: queryKeys.clientPayments(clientId ?? ''),
    enabled: Boolean(clientId),
    queryFn: async () => {
      const response = await apiClient.pagos.list({
        page: 1,
        limit: 200,
        clientId,
      })
      const json = (await response.json()) as { docs?: BackendPago[] }
      return (json.docs ?? []).map(mapPayment)
    },
    staleTime: 2 * 60_000,
    gcTime: 20 * 60_000,
  })
}

export const useClientPaymentsInfiniteQuery = (clientId?: string, pageSize = 25) => {
  return useInfiniteQuery({
    queryKey: queryKeys.clientPaymentsInfinite(clientId ?? '', pageSize),
    enabled: Boolean(clientId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<PaginatedPaymentsResult> => {
      const response = await apiClient.pagos.list({
        page: pageParam,
        limit: pageSize,
        clientId,
      })
      const json = (await response.json()) as BackendPaginatedResponse

      return {
        docs: (json.docs ?? []).map(mapPayment),
        totalDocs: json.totalDocs ?? 0,
        totalPages: json.totalPages ?? 1,
        page: json.page ?? pageParam,
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 2 * 60_000,
    gcTime: 20 * 60_000,
  })
}

export const usePaymentsListQuery = (params: {
  page: number
  limit: number
  month?: number
  year?: number
}) => {
  return useQuery({
    queryKey: queryKeys.paymentsList(params),
    queryFn: async (): Promise<PaginatedPaymentsResult> => {
      const response = await apiClient.pagos.list(params)
      const json = (await response.json()) as BackendPaginatedResponse

      return {
        docs: (json.docs ?? []).map(mapPayment),
        totalDocs: json.totalDocs ?? 0,
        totalPages: json.totalPages ?? 1,
        page: json.page ?? params.page,
      }
    },
    staleTime: 2 * 60_000,
    gcTime: 20 * 60_000,
  })
}

export const useCreatePaymentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Payment, 'id' | 'fecha'>) => {
      const response = await apiClient.pagos.create({
        cliente: Number(data.clienteId),
        monto: data.monto,
        metodoPago: data.metodoPago,
        tipoServicio: data.tipoServicio,
        turno: isVipServiceType(data.tipoServicio) ? null : mapTurnoToBackend(data.turno),
        fechaPago: new Date().toISOString().split('T')[0],
        mesPago: data.mes,
        anioPago: data.anio,
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.clientPaymentsAll }),
      ])
    },
  })
}

export const useUpdatePaymentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Payment> }) => {
      const response = await apiClient.pagos.update(id, {
        ...(data.monto !== undefined ? { monto: data.monto } : {}),
        ...(data.metodoPago ? { metodoPago: data.metodoPago } : {}),
        ...(data.tipoServicio ? { tipoServicio: data.tipoServicio } : {}),
        ...((data.turno || data.tipoServicio) && isVipServiceType(data.tipoServicio ?? 'Normal')
          ? { turno: null }
          : data.turno
            ? { turno: mapTurnoToBackend(data.turno) }
            : {}),
        ...(data.mes !== undefined ? { mesPago: data.mes } : {}),
        ...(data.anio !== undefined ? { anioPago: data.anio } : {}),
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.clientPaymentsAll }),
      ])
    },
  })
}

export const useDeletePaymentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.pagos.remove(id)
      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
        queryClient.invalidateQueries({ queryKey: queryKeys.clientPaymentsAll }),
      ])
    },
  })
}

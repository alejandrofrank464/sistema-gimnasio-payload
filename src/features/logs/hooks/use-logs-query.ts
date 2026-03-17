import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { LogEntry } from '@/types'

type BackendLog = {
  id: number
  accion: string
  entidad: string
  usuario?: string | null
  nombreCompleto?: string | null
  createdAt: string
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

type PaginatedLogsResult = {
  docs: LogEntry[]
  totalDocs: number
  totalPages: number
  page: number
}

type BackendPaginatedResponse = {
  docs?: BackendLog[]
  totalDocs?: number
  totalPages?: number
  page?: number
}

export const useLogsQuery = () => {
  return useQuery({
    queryKey: queryKeys.logs,
    queryFn: async () => {
      const response = await apiClient.logs.list()
      const json = (await response.json()) as { docs?: BackendLog[] }
      return (json.docs ?? []).map(mapLog)
    },
    staleTime: 2 * 60_000,
    gcTime: 20 * 60_000,
  })
}

export const useLogsListQuery = (params: { page: number; limit: number; search?: string }) => {
  return useQuery({
    queryKey: queryKeys.logsList(params),
    queryFn: async (): Promise<PaginatedLogsResult> => {
      const response = await apiClient.logs.list(params)
      const json = (await response.json()) as BackendPaginatedResponse

      return {
        docs: (json.docs ?? []).map(mapLog),
        totalDocs: json.totalDocs ?? 0,
        totalPages: json.totalPages ?? 1,
        page: json.page ?? params.page,
      }
    },
    staleTime: 2 * 60_000,
    gcTime: 20 * 60_000,
  })
}

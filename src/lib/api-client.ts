import { trackRequest } from '@/lib/request-metrics'

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

export const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const startedAt = Date.now()
  const method = init?.method ?? 'GET'
  const response = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers || {}),
    },
    credentials: 'include',
  })

  trackRequest(url, method, response.status, Date.now() - startedAt)
  return response
}

const trackedFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const startedAt = Date.now()
  const method = init?.method ?? 'GET'
  const response = await fetch(url, init)
  trackRequest(url, method, response.status, Date.now() - startedAt)
  return response
}

export const apiClient = {
  clientes: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const searchParams = new URLSearchParams({
        depth: '0',
        sort: 'name',
        page: String(params?.page ?? 1),
        limit: String(params?.limit ?? 500),
      })

      const search = params?.search?.trim()
      if (search) {
        searchParams.set('where[or][0][name][like]', search)
        searchParams.set('where[or][1][lastName][like]', search)
        searchParams.set('where[or][2][phone][like]', search)
      }

      return authFetch(`/api/clientes?${searchParams.toString()}`)
    },
    create: (body: unknown) =>
      authFetch('/api/clientes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) =>
      authFetch(`/api/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => authFetch(`/api/clientes/${id}`, { method: 'DELETE' }),
  },
  pagos: {
    list: (params?: {
      page?: number
      limit?: number
      month?: number
      year?: number
      clientId?: string
    }) => {
      const searchParams = new URLSearchParams({
        depth: '1',
        sort: '-fechaPago',
        page: String(params?.page ?? 1),
        limit: String(params?.limit ?? 25),
      })

      if (params?.month !== undefined) {
        searchParams.set('where[mesPago][equals]', String(params.month))
      }
      if (params?.year !== undefined) {
        searchParams.set('where[anioPago][equals]', String(params.year))
      }
      if (params?.clientId) {
        searchParams.set('where[cliente][equals]', params.clientId)
      }

      return authFetch(`/api/pagos?${searchParams.toString()}`)
    },
    create: (body: unknown) =>
      authFetch('/api/pagos', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) =>
      authFetch(`/api/pagos/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => authFetch(`/api/pagos/${id}`, { method: 'DELETE' }),
  },
  logs: {
    list: (params?: {
      page?: number
      limit?: number
      search?: string
      entity?: 'all' | 'Cliente' | 'Pago' | 'Ajuste'
      action?: 'all' | 'Crear' | 'Editar' | 'Eliminar'
      sortDate?: 'asc' | 'desc'
    }) => {
      const searchParams = new URLSearchParams({
        depth: '0',
        sort: params?.sortDate === 'asc' ? 'createdAt' : '-createdAt',
        page: String(params?.page ?? 1),
        limit: String(params?.limit ?? 25),
      })

      let andIndex = 0

      if (params?.entity && params.entity !== 'all') {
        searchParams.set(`where[and][${andIndex}][entidad][equals]`, params.entity)
        andIndex += 1
      }

      if (params?.action && params.action !== 'all') {
        const actionMap: Record<'Crear' | 'Editar' | 'Eliminar', string[]> = {
          Crear: ['crear_cliente', 'crear_pago'],
          Editar: ['editar_cliente', 'editar_pago'],
          Eliminar: ['eliminar_cliente', 'eliminar_pago'],
        }

        const rawActions = actionMap[params.action]
        rawActions.forEach((action, index) => {
          searchParams.set(`where[and][${andIndex}][or][${index}][accion][equals]`, action)
        })
        andIndex += 1
      }

      const search = params?.search?.trim()
      if (search) {
        searchParams.set(`where[and][${andIndex}][or][0][nombreCompleto][like]`, search)
        searchParams.set(`where[and][${andIndex}][or][1][usuario][like]`, search)
      }

      return authFetch(`/api/logs?${searchParams.toString()}`)
    },
  },
  settings: {
    name: () => trackedFetch('/api/configuraciones/nombre'),
    prices: () => trackedFetch('/api/configuraciones/precios'),
    logo: () => trackedFetch('/api/configuraciones/logo'),
    uploadLogo: (file: File) => {
      const form = new FormData()
      form.append('logo', file)

      return trackedFetch('/api/configuraciones/logo', {
        method: 'POST',
        body: form,
        headers: {
          ...(getToken() ? { Authorization: `JWT ${getToken()}` } : {}),
        },
      })
    },
    upsert: (clave: string, valor: string | number) =>
      trackedFetch('/api/configuraciones/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave, valor }),
      }),
  },
}

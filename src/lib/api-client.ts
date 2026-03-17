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
    list: () => authFetch('/api/clientes?limit=500&depth=0&sort=name'),
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
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const searchParams = new URLSearchParams({
        depth: '0',
        sort: '-createdAt',
        page: String(params?.page ?? 1),
        limit: String(params?.limit ?? 25),
      })

      const search = params?.search?.trim()
      if (search) {
        searchParams.set('where[or][0][entidad][like]', search)
        searchParams.set('where[or][1][accion][like]', search)
        searchParams.set('where[or][2][nombreCompleto][like]', search)
        searchParams.set('where[or][3][usuario][like]', search)
      }

      return authFetch(`/api/logs?${searchParams.toString()}`)
    },
  },
  settings: {
    prices: () => trackedFetch('/api/configuraciones/precios'),
    logo: () => trackedFetch('/api/configuraciones/logo'),
    upsert: (clave: string, valor: string | number) =>
      trackedFetch('/api/configuraciones/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave, valor }),
      }),
  },
}

type MetricsKey = string

type RequestMetric = {
  key: MetricsKey
  route: string
  endpoint: string
  method: string
  status: number
  count: number
  totalDurationMs: number
  lastDurationMs: number
  lastRequestAt: string
}

type MetricsStore = {
  byKey: Record<MetricsKey, RequestMetric>
}

type MetricsSnapshot = {
  totalRequests: number
  metrics: RequestMetric[]
}

const store: MetricsStore = {
  byKey: {},
}

const getCurrentRoute = (): string => {
  if (typeof window === 'undefined') return 'server'
  return window.location.pathname || 'unknown'
}

const normalizeEndpoint = (url: string): string => {
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    )
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

const buildKey = (route: string, endpoint: string, method: string, status: number): MetricsKey => {
  return `${route}::${method.toUpperCase()}::${endpoint}::${status}`
}

const upsertMetric = (
  route: string,
  endpoint: string,
  method: string,
  status: number,
  durationMs: number,
) => {
  const key = buildKey(route, endpoint, method, status)
  const existing = store.byKey[key]

  if (!existing) {
    store.byKey[key] = {
      key,
      route,
      endpoint,
      method: method.toUpperCase(),
      status,
      count: 1,
      totalDurationMs: durationMs,
      lastDurationMs: durationMs,
      lastRequestAt: new Date().toISOString(),
    }
    return
  }

  existing.count += 1
  existing.totalDurationMs += durationMs
  existing.lastDurationMs = durationMs
  existing.lastRequestAt = new Date().toISOString()
}

const exposeInWindow = () => {
  if (typeof window === 'undefined') return

  const win = window as Window & {
    __gymMetrics?: {
      getSnapshot: () => MetricsSnapshot
      reset: () => void
    }
  }

  if (!win.__gymMetrics) {
    win.__gymMetrics = {
      getSnapshot: () => getMetricsSnapshot(),
      reset: () => resetMetrics(),
    }
  }
}

export const trackRequest = (
  inputUrl: string,
  method: string,
  status: number,
  durationMs: number,
) => {
  const route = getCurrentRoute()
  const endpoint = normalizeEndpoint(inputUrl)
  upsertMetric(route, endpoint, method, status, durationMs)
  exposeInWindow()
}

export const getMetricsSnapshot = (): MetricsSnapshot => {
  const metrics = Object.values(store.byKey).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return b.totalDurationMs - a.totalDurationMs
  })

  const totalRequests = metrics.reduce((sum, item) => sum + item.count, 0)
  return { totalRequests, metrics }
}

export const resetMetrics = () => {
  store.byKey = {}
}

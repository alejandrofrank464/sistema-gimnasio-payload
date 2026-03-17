'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

import { apiClient } from '@/lib/api-client'
import type { Settings, TipoServicio } from '@/types'

type DataContextType = {
  settings: Settings
  loading: boolean
  updateSettings: (data: Partial<Settings>) => Promise<void>
}

type PriceMap = {
  precio_normal: number
  precio_vip: number
  precio_zumba_o_box: number
  precio_zumba_y_box: number
  precio_vip_zumba_y_box: number
}

const DataContext = createContext<DataContextType | null>(null)

const DEFAULT_PRICES: PriceMap = {
  precio_normal: 30,
  precio_vip: 50,
  precio_zumba_o_box: 40,
  precio_zumba_y_box: 60,
  precio_vip_zumba_y_box: 80,
}

const DEFAULT_SETTINGS: Settings = {
  nombreGimnasio: 'Gym',
  precios: [
    { tipoServicio: 'Normal', precio: DEFAULT_PRICES.precio_normal },
    { tipoServicio: 'VIP', precio: DEFAULT_PRICES.precio_vip },
    { tipoServicio: 'Zumba', precio: DEFAULT_PRICES.precio_zumba_o_box },
    { tipoServicio: 'Box', precio: DEFAULT_PRICES.precio_zumba_o_box },
    { tipoServicio: 'Zumba y Box', precio: DEFAULT_PRICES.precio_zumba_y_box },
    { tipoServicio: 'VIP + Zumba y Box', precio: DEFAULT_PRICES.precio_vip_zumba_y_box },
  ],
  logoUrl: '',
}

const SETTINGS_CACHE_TTL_MS = 10 * 60 * 1000

const SETTINGS_KEY_MAP: Record<TipoServicio, keyof PriceMap> = {
  Normal: 'precio_normal',
  VIP: 'precio_vip',
  Zumba: 'precio_zumba_o_box',
  Box: 'precio_zumba_o_box',
  'Zumba y Box': 'precio_zumba_y_box',
  'VIP + Zumba y Box': 'precio_vip_zumba_y_box',
}

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem('gym_token')
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

const priceMapToSettings = (priceMap: PriceMap, logoUrl: string): Settings => ({
  ...DEFAULT_SETTINGS,
  precios: [
    { tipoServicio: 'Normal', precio: priceMap.precio_normal },
    { tipoServicio: 'VIP', precio: priceMap.precio_vip },
    { tipoServicio: 'Zumba', precio: priceMap.precio_zumba_o_box },
    { tipoServicio: 'Box', precio: priceMap.precio_zumba_o_box },
    { tipoServicio: 'Zumba y Box', precio: priceMap.precio_zumba_y_box },
    { tipoServicio: 'VIP + Zumba y Box', precio: priceMap.precio_vip_zumba_y_box },
  ],
  logoUrl,
})

const isDashboardRoute = (pathname: string) => {
  return (
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/pagos') ||
    pathname.startsWith('/horario') ||
    pathname.startsWith('/ajustes')
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

export function DataProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS)
  const settingsFetchedAtRef = useRef<number>(0)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const refreshSettings = useCallback(async (options?: { force?: boolean }) => {
    const token = getToken()
    if (!token) {
      setSettings(DEFAULT_SETTINGS)
      settingsFetchedAtRef.current = 0
      return
    }

    const shouldUseCache =
      !options?.force &&
      settingsFetchedAtRef.current > 0 &&
      Date.now() - settingsFetchedAtRef.current < SETTINGS_CACHE_TTL_MS

    if (shouldUseCache) {
      return
    }

    const [preciosRes, logoRes] = await Promise.all([
      apiClient.settings.prices(),
      apiClient.settings.logo(),
    ])

    const preciosJson = (await preciosRes.json()) as { data?: Partial<PriceMap> }
    const logoJson = (await logoRes.json()) as { data?: { url?: string | null } | null }

    const nextPriceMap: PriceMap = {
      ...DEFAULT_PRICES,
      ...(preciosJson.data || {}),
    }

    setSettings(priceMapToSettings(nextPriceMap, logoJson.data?.url || ''))
    settingsFetchedAtRef.current = Date.now()
  }, [])

  useEffect(() => {
    const shouldFetch = isDashboardRoute(pathname)
    if (!shouldFetch) {
      setLoading(false)
      return
    }

    let mounted = true

    const run = async () => {
      setLoading(true)
      try {
        await refreshSettings()
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void run()

    return () => {
      mounted = false
    }
  }, [pathname, refreshSettings])

  const updateSettings = useCallback(
    async (data: Partial<Settings>) => {
      const currentSettings = settingsRef.current
      const currentPriceMap = settingsToPriceMap(currentSettings)

      if (
        data.nombreGimnasio !== undefined &&
        data.nombreGimnasio.trim() !== '' &&
        data.nombreGimnasio !== currentSettings.nombreGimnasio
      ) {
        await apiClient.settings.upsert('nombre_gimnasio', data.nombreGimnasio)
      }

      if (data.precios) {
        const latestByKey = new Map<keyof PriceMap, number>()
        for (const item of data.precios) {
          latestByKey.set(SETTINGS_KEY_MAP[item.tipoServicio], item.precio)
        }

        for (const [clave, valor] of latestByKey.entries()) {
          if (currentPriceMap[clave] !== valor) {
            await apiClient.settings.upsert(clave, valor)
          }
        }
      }

      if (data.logoUrl) {
        setSettings((prev) => ({ ...prev, logoUrl: data.logoUrl || prev.logoUrl }))
      }

      await refreshSettings({ force: true })
    },
    [refreshSettings],
  )

  const value = useMemo<DataContextType>(
    () => ({
      settings,
      loading,
      updateSettings,
    }),
    [settings, loading, updateSettings],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

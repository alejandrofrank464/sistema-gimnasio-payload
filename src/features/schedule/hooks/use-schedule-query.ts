import { useMemo } from 'react'

import { useClientsQuery } from '@/features/clients/hooks/use-clients-query'
import { usePaymentsQueryFiltered } from '@/features/payments/hooks/use-payments-query'
import type { Client, Settings } from '@/types'

type ActiveClient = Client & { pagado: boolean }

type UseScheduleDataParams = {
  settings: Settings
  month: number
  year: number
  visibleWeekDays: Date[]
  rowKeys: string[]
}

const isVipService = (tipo: string) => {
  return tipo === 'VIP' || tipo === 'VIP + Zumba y Box'
}

const isZumbaBoxService = (tipo: string) => {
  return (
    tipo === 'Zumba' || tipo === 'Box' || tipo === 'Zumba y Box' || tipo === 'VIP + Zumba y Box'
  )
}

const hasZumba = (tipo: string): boolean => {
  return tipo === 'Zumba' || tipo === 'Zumba y Box' || tipo === 'VIP + Zumba y Box'
}

const hasBox = (tipo: string): boolean => {
  return tipo === 'Box' || tipo === 'Zumba y Box' || tipo === 'VIP + Zumba y Box'
}

export const useScheduleData = ({
  settings,
  month,
  year,
  visibleWeekDays,
  rowKeys,
}: UseScheduleDataParams) => {
  const { data: clients = [], isLoading: loadingClients } = useClientsQuery(settings)
  const { data: payments = [], isLoading: loadingPayments } = usePaymentsQueryFiltered({
    month,
    year,
    limit: 500,
  })

  const activeClients = useMemo<ActiveClient[]>(() => {
    const all = clients.map((client) => ({
      ...client,
      pagado: payments.some(
        (payment) =>
          payment.clienteId === client.id && payment.mes === month && payment.anio === year,
      ),
    }))

    return all.filter((client) => client.pagado)
  }, [clients, payments, month, year])

  const gridData = useMemo<Record<string, Record<number, ActiveClient[]>>>(() => {
    const grid: Record<string, Record<number, ActiveClient[]>> = {}
    const assignmentsByDay = new Map<number, Set<string>>()

    for (const rowKey of rowKeys) {
      grid[rowKey] = {}
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        grid[rowKey][dayIndex] = []
      }
    }

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      assignmentsByDay.set(dayIndex, new Set())
    }

    const assignClientToDay = (rowKey: string, dayIndex: number, client: ActiveClient) => {
      if (!grid[rowKey]) return
      if (!visibleWeekDays[dayIndex] || visibleWeekDays[dayIndex].getMonth() !== month) return

      const assignedClients = assignmentsByDay.get(dayIndex)
      if (!assignedClients || assignedClients.has(client.id)) return

      grid[rowKey][dayIndex].push(client)
      assignedClients.add(client.id)
    }

    for (const client of activeClients) {
      const saturdayIndex = 5

      if (isVipService(client.tipoServicio)) {
        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
          assignClientToDay('vip', dayIndex, client)
        }

        if (hasZumba(client.tipoServicio)) {
          assignClientToDay('sabado-zumba', saturdayIndex, client)
        }
        if (hasBox(client.tipoServicio)) {
          assignClientToDay('sabado-box', saturdayIndex, client)
        }
      } else if (isZumbaBoxService(client.tipoServicio)) {
        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
          assignClientToDay(client.turno, dayIndex, client)
        }

        if (hasZumba(client.tipoServicio)) {
          assignClientToDay('sabado-zumba', saturdayIndex, client)
        }
        if (hasBox(client.tipoServicio)) {
          assignClientToDay('sabado-box', saturdayIndex, client)
        }
      } else {
        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
          assignClientToDay(client.turno, dayIndex, client)
        }
      }
    }

    return grid
  }, [activeClients, month, rowKeys, visibleWeekDays])

  return {
    activeClients,
    gridData,
    isLoading: loadingClients || loadingPayments,
  }
}

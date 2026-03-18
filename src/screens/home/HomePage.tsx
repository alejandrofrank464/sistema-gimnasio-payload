'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  CreditCardIcon,
  ReceiptDollarIcon,
  BadgeDollarSignIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { PageHeader } from '@/components/shared/PageHeader'
import { RecentLogs, StatCard } from '@/features/dashboard'
import { useClientsQuery } from '@/features/clients/hooks/use-clients-query'
import { useLogsListQuery } from '@/features/logs/hooks/use-logs-query'
import { usePaymentsQueryFiltered } from '@/features/payments/hooks/use-payments-query'
import { useData } from '@/lib/data-context'

const PREVIOUS_PERIOD_LABEL = 'vs mes anterior'

const RevenueChart = dynamic(
  () => import('@/features/dashboard/components/RevenueChart').then((mod) => mod.RevenueChart),
  { ssr: false },
)

const ServiceDistributionChart = dynamic(
  () =>
    import('@/features/dashboard/components/ServiceDistributionChart').then(
      (mod) => mod.ServiceDistributionChart,
    ),
  { ssr: false },
)

export default function HomePage() {
  const { settings } = useData()
  const { data: clients = [] } = useClientsQuery(settings)

  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  const { data: paymentsThisMonth = [] } = usePaymentsQueryFiltered({
    month,
    year,
    limit: 2000,
  })

  const { data: paymentsForCharts = [] } = usePaymentsQueryFiltered({
    limit: 2000,
  })

  const { data: logsPage } = useLogsListQuery({
    page: 1,
    limit: 6,
    action: 'all',
    entity: 'all',
    sortDate: 'desc',
    search: '',
  })

  const stats = useMemo(() => {
    const monthRevenue = paymentsThisMonth.reduce((sum, payment) => sum + payment.monto, 0)
    const monthPaymentsCount = paymentsThisMonth.length

    const prevDate = new Date(year, month - 1, 1)
    const prevMonth = prevDate.getMonth()
    const prevYear = prevDate.getFullYear()

    const previousMonthRevenue = paymentsForCharts
      .filter((payment) => payment.mes === prevMonth && payment.anio === prevYear)
      .reduce((sum, payment) => sum + payment.monto, 0)

    const revenueDiffPercent =
      previousMonthRevenue > 0
        ? Math.round(((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
        : 0

    const averageTicket = monthPaymentsCount > 0 ? Math.round(monthRevenue / monthPaymentsCount) : 0

    return {
      monthRevenue,
      monthPaymentsCount,
      revenueDiffPercent,
      averageTicket,
    }
  }, [month, paymentsForCharts, paymentsThisMonth, year])

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general del sistema" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total clientes" value={clients.length} icon={UserGroupIcon} />
        <StatCard
          title="Ingresos del mes"
          value={`$${stats.monthRevenue.toLocaleString()}`}
          icon={BadgeDollarSignIcon}
          trend={stats.revenueDiffPercent >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(stats.revenueDiffPercent)}% ${PREVIOUS_PERIOD_LABEL}`}
        />
        <StatCard title="Pagos del mes" value={stats.monthPaymentsCount} icon={CreditCardIcon} />
        <StatCard
          title="Ticket promedio"
          value={`$${stats.averageTicket.toLocaleString()}`}
          icon={ReceiptDollarIcon}
          subtitle="Promedio por pago del mes"
          trend="neutral"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueChart payments={paymentsForCharts} />
        <ServiceDistributionChart clients={clients} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <RecentLogs logs={logsPage?.docs ?? []} />
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MESES, type Payment } from '@/types'

type RevenueChartProps = {
  payments: Payment[]
}

export function RevenueChart({ payments }: RevenueChartProps) {
  const data = useMemo(() => {
    const now = new Date()
    const months: Array<{ mes: string; ingresos: number }> = []

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = date.getMonth()
      const year = date.getFullYear()

      const monthlyRevenue = payments
        .filter((payment) => payment.mes === month && payment.anio === year)
        .reduce((sum, payment) => sum + payment.monto, 0)

      months.push({
        mes: MESES[month].slice(0, 3),
        ingresos: monthlyRevenue,
      })
    }

    return months
  }, [payments])

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Ingresos últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 3.7% 15.9%)" />
              <XAxis
                dataKey="mes"
                tick={{ fill: 'hsl(240 5% 64.9%)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(240 5% 64.9%)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(240 5.9% 10%)',
                  border: '1px solid hsl(240 3.7% 15.9%)',
                  borderRadius: 8,
                  color: 'hsl(0 0% 98%)',
                }}
                formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Ingresos']}
              />
              <Bar dataKey="ingresos" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

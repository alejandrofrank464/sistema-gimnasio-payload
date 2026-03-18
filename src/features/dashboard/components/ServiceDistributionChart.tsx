import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Client } from '@/types'

type ServiceDistributionChartProps = {
  clients: Client[]
}

const COLORS = [
  'hsl(217 91% 60%)',
  'hsl(160 84% 39%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(280 70% 55%)',
  'hsl(190 80% 45%)',
]

export function ServiceDistributionChart({ clients }: ServiceDistributionChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}

    clients.forEach((client) => {
      counts[client.tipoServicio] = (counts[client.tipoServicio] || 0) + 1
    })

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [clients])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Distribución por servicio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[260px] items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(240 5.9% 10%)',
                  border: '1px solid hsl(240 3.7% 15.9%)',
                  borderRadius: 8,
                  color: 'hsl(0 0% 98%)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {data.map((entry, index) => (
            <div
              key={entry.name}
              className="text-muted-foreground flex items-center gap-1.5 text-xs"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              {entry.name} ({entry.value})
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

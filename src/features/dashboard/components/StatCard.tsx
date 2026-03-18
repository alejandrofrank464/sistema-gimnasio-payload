import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon: IconSvgElement
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export function StatCard({ title, value, subtitle, icon, trend, trendValue }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {title}
            </p>
            <p className="text-foreground text-2xl font-bold tabular-nums">{value}</p>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
            {trendValue && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend === 'up' && 'text-emerald-500',
                  trend === 'down' && 'text-destructive',
                  trend === 'neutral' && 'text-muted-foreground',
                )}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </p>
            )}
          </div>
          <div className="bg-primary/10 rounded-lg p-2.5">
            <HugeiconsIcon icon={icon} className="text-primary h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

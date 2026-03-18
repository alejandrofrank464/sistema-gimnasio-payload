import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LogEntry } from '@/types'

type RecentLogsProps = {
  logs: LogEntry[]
  limit?: number
}

export function RecentLogs({ logs, limit = 6 }: RecentLogsProps) {
  const recent = logs.slice(0, limit)

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-border divide-y">
          {recent.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Sin actividad reciente</p>
          ) : (
            recent.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm">{log.descripcion}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {new Date(log.fecha).toLocaleString('es-ES')} · {log.usuario}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {log.entidad}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

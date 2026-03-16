'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/lib/data-context'
import { TURNOS, DIAS_SEMANA, MESES, Turno, Client } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Users, Coffee, Ban } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// All display rows: turnos + receso + VIP
const SCHEDULE_ROWS: { label: string; key: string; isBreak?: boolean; isVip?: boolean }[] = [
  ...TURNOS.slice(0, 5).map((t) => ({ label: `${t} - ${nextHour(t)}`, key: t })),
  { label: '12:00 - 13:00', key: 'receso', isBreak: true },
  ...TURNOS.slice(5).map((t) => ({ label: `${t} - ${nextHour(t)}`, key: t })),
  { label: 'VIP', key: 'vip', isVip: true },
]

function nextHour(t: string) {
  const h = parseInt(t.split(':')[0]) + 1
  return `${String(h).padStart(2, '0')}:00`
}

function getWeeksOfMonth(month: number, year: number) {
  const weeks: { start: Date; end: Date; label: string }[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Start from the Monday of the week containing the 1st
  const cursor = new Date(firstDay)
  const dayOfWeek = cursor.getDay() // 0=Sun
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  cursor.setDate(cursor.getDate() + diff)

  while (cursor <= lastDay || cursor.getMonth() === month) {
    const weekStart = new Date(cursor)
    const weekEnd = new Date(cursor)
    weekEnd.setDate(weekEnd.getDate() + 5) // Mon-Sat

    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label: `${weekStart.getDate()} - ${weekEnd.getDate()} ${MESES[month]}`,
    })

    cursor.setDate(cursor.getDate() + 7)
    if (cursor.getMonth() !== month && cursor > lastDay) break
  }

  return weeks
}

function getDayDate(weekStart: Date, dayIndex: number): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayIndex)
  return d
}

function isVipService(tipo: string) {
  return tipo === 'VIP' || tipo === 'VIP + Zumba y Box'
}

function isZumbaBoxService(tipo: string) {
  return (
    tipo === 'Zumba' || tipo === 'Box' || tipo === 'Zumba y Box' || tipo === 'VIP + Zumba y Box'
  )
}

export default function SchedulePage() {
  const { getActiveClients } = useData()
  const now = new Date()
  const mes = now.getMonth()
  const anio = now.getFullYear()
  const [weekIndex, setWeekIndex] = useState(0)

  const weeks = useMemo(() => getWeeksOfMonth(mes, anio), [mes, anio])
  const currentWeek = weeks[weekIndex] || weeks[0]

  const activeClients = useMemo(() => {
    const all = getActiveClients(mes, anio)
    return all.filter((c) => c.pagado)
  }, [getActiveClients, mes, anio])

  // Build grid data: for each row + day, list clients
  const gridData = useMemo(() => {
    const grid: Record<string, Record<number, (Client & { pagado: boolean })[]>> = {}

    for (const row of SCHEDULE_ROWS) {
      grid[row.key] = {}
      for (let d = 0; d < 6; d++) {
        grid[row.key][d] = []
      }
    }

    for (const client of activeClients) {
      const isSaturday = 5 // index for Sábado

      // VIP clients go to VIP row (all days Mon-Fri) + their turno
      if (isVipService(client.tipoServicio)) {
        // VIP row for Mon-Fri
        for (let d = 0; d < 5; d++) {
          grid['vip'][d].push(client)
        }
        // Zumba/Box VIP also go to Saturday
        if (isZumbaBoxService(client.tipoServicio)) {
          // Saturday: all turns
          for (const row of SCHEDULE_ROWS) {
            if (!row.isBreak && !row.isVip) {
              grid[row.key][isSaturday].push(client)
            }
          }
        }
      } else if (isZumbaBoxService(client.tipoServicio)) {
        // Zumba/Box clients: their turno Mon-Fri + all Saturday
        // Mon-Fri: assigned turno
        for (let d = 0; d < 5; d++) {
          if (grid[client.turno]) {
            grid[client.turno][d].push(client)
          }
        }
        // Saturday: all turns
        for (const row of SCHEDULE_ROWS) {
          if (!row.isBreak && !row.isVip) {
            grid[row.key][isSaturday].push(client)
          }
        }
      } else {
        // Normal clients: their turno, Mon-Fri only
        for (let d = 0; d < 5; d++) {
          if (grid[client.turno]) {
            grid[client.turno][d].push(client)
          }
        }
      }
    }

    return grid
  }, [activeClients])

  return (
    <div>
      <PageHeader
        title="Horario Semanal"
        description={`${MESES[mes]} ${anio} — ${activeClients.length} miembros activos`}
      />

      {/* Week pagination */}
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={weekIndex === 0}
          onClick={() => setWeekIndex((i) => i - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[160px] text-center text-sm font-medium tabular-nums">
          {currentWeek?.label}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={weekIndex >= weeks.length - 1}
          onClick={() => setWeekIndex((i) => i + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Schedule grid */}
      <ScrollArea className="w-full">
        <div className="min-w-[800px]">
          <div className="border-border grid grid-cols-[100px_repeat(6,1fr)_80px] overflow-hidden rounded-lg border">
            {/* Header row */}
            <div className="bg-muted/50 text-muted-foreground border-border border-b p-2 text-xs font-medium">
              Turno
            </div>
            {DIAS_SEMANA.map((dia, i) => {
              const date = currentWeek ? getDayDate(currentWeek.start, i) : null
              const isSaturday = i === 5
              return (
                <div
                  key={dia}
                  className={cn(
                    'bg-muted/50 border-border border-b border-l p-2 text-center text-xs font-medium',
                    isSaturday && 'bg-accent/30',
                  )}
                >
                  <div>{dia}</div>
                  {date && (
                    <div className="text-muted-foreground tabular-nums">{date.getDate()}</div>
                  )}
                  {isSaturday && (
                    <Badge variant="outline" className="mt-0.5 text-[10px]">
                      Zumba & Box
                    </Badge>
                  )}
                </div>
              )
            })}
            {/* Sunday column */}
            <div className="bg-muted/20 border-border text-muted-foreground border-b border-l p-2 text-center text-xs font-medium">
              <div>Dom</div>
              <Ban className="text-muted-foreground/50 mx-auto mt-1 h-3 w-3" />
            </div>

            {/* Grid rows */}
            {SCHEDULE_ROWS.map((row) => (
              <>
                {/* Row label */}
                <div
                  key={`label-${row.key}`}
                  className={cn(
                    'border-border flex items-center border-b p-2 text-xs font-medium',
                    row.isBreak && 'bg-muted/30 text-muted-foreground italic',
                    row.isVip && 'bg-primary/10 text-primary font-semibold',
                  )}
                >
                  {row.isBreak && <Coffee className="mr-1.5 h-3 w-3 shrink-0" />}
                  {row.label}
                </div>

                {/* Day cells */}
                {DIAS_SEMANA.map((dia, dayIdx) => {
                  const clients = gridData[row.key]?.[dayIdx] || []
                  const isSaturday = dayIdx === 5

                  if (row.isBreak) {
                    return (
                      <div
                        key={`${row.key}-${dayIdx}`}
                        className="bg-muted/20 border-border border-b border-l p-1"
                      />
                    )
                  }

                  // VIP row: not on Saturday (they're already in regular slots)
                  if (row.isVip && isSaturday) {
                    return (
                      <div
                        key={`${row.key}-${dayIdx}`}
                        className="bg-muted/10 border-border border-b border-l p-1"
                      />
                    )
                  }

                  return (
                    <div
                      key={`${row.key}-${dayIdx}`}
                      className={cn(
                        'border-border min-h-[48px] border-b border-l p-1',
                        isSaturday && 'bg-accent/10',
                        row.isVip && 'bg-primary/5',
                      )}
                    >
                      {clients.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                'hover:bg-accent flex w-full cursor-pointer items-center justify-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                                row.isVip ? 'text-primary' : 'text-foreground',
                              )}
                            >
                              <Users className="h-3 w-3 shrink-0" />
                              {clients.length}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="top" className="w-48 space-y-1 p-2">
                            <p className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wider uppercase">
                              {row.label} — {DIAS_SEMANA[dayIdx]}
                            </p>
                            {clients.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between py-0.5 text-xs"
                              >
                                <span>
                                  {c.nombre} {c.apellido}
                                </span>
                                {isVipService(c.tipoServicio) && (
                                  <Badge
                                    variant="outline"
                                    className="text-primary border-primary/30 ml-1 text-[9px]"
                                  >
                                    VIP
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </PopoverContent>
                        </Popover>
                      ) : null}
                    </div>
                  )
                })}

                {/* Sunday cell - closed */}
                <div
                  key={`${row.key}-dom`}
                  className={cn(
                    'border-border bg-muted/10 border-b border-l p-1',
                    row.isBreak && 'bg-muted/20',
                  )}
                />
              </>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="text-muted-foreground mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="bg-secondary h-3 w-3 rounded" />
          <span>Normal / Zumba / Box</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="bg-primary/20 border-primary/30 h-3 w-3 rounded border" />
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Coffee className="h-3 w-3" />
          <span>Receso 12:00 - 13:00</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Ban className="h-3 w-3" />
          <span>Domingo cerrado</span>
        </div>
      </div>
    </div>
  )
}

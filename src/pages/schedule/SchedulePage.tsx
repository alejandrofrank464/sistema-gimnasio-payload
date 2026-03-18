'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useData } from '@/lib/data-context'
import { TURNOS, DIAS_SEMANA, MESES } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Users, Coffee, Ban } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useScheduleData } from '@/features/schedule/hooks/use-schedule-query'

// All display rows: turnos + receso + VIP + Saturday activities
const SCHEDULE_ROWS: {
  label: string
  key: string
  isBreak?: boolean
  isVip?: boolean
  isSaturdayOnly?: boolean
}[] = [
  ...TURNOS.slice(0, 5).map((t) => ({ label: `${t} - ${nextHour(t)}`, key: t })),
  { label: '12:00 - 13:00', key: 'receso', isBreak: true },
  ...TURNOS.slice(5).map((t) => ({ label: `${t} - ${nextHour(t)}`, key: t })),
  { label: 'VIP', key: 'vip', isVip: true },
  { label: 'Zumba', key: 'sabado-zumba', isSaturdayOnly: true },
  { label: 'Box', key: 'sabado-box', isSaturdayOnly: true },
]

const SCHEDULE_ROW_KEYS = SCHEDULE_ROWS.map((row) => row.key)

function nextHour(t: string) {
  const h = parseInt(t.split(':')[0]) + 1
  return `${String(h).padStart(2, '0')}:00`
}

function getWeeksOfMonth(month: number, year: number) {
  const weeks: { start: Date; end: Date; label: string; days: Date[] }[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Start from the Monday of the week containing the 1st
  const firstWeekStart = new Date(firstDay)
  const firstDayOfWeek = firstWeekStart.getDay() // 0=Sun
  const firstDiff = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek
  firstWeekStart.setDate(firstWeekStart.getDate() + firstDiff)

  // End at the Sunday of the week containing the last day of month
  const lastWeekEnd = new Date(lastDay)
  const lastDayOfWeek = lastWeekEnd.getDay() // 0=Sun
  const lastDiff = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek
  lastWeekEnd.setDate(lastWeekEnd.getDate() + lastDiff)

  const cursor = new Date(firstWeekStart)
  while (cursor <= lastWeekEnd) {
    const weekStart = new Date(cursor)
    const weekEnd = new Date(cursor)
    weekEnd.setDate(weekEnd.getDate() + 6) // Mon-Sun

    const weekDays = Array.from({ length: 7 }, (_, dayIndex) => getDayDate(weekStart, dayIndex))
    const inMonthDays = weekDays.filter((d) => d.getMonth() === month)
    const firstInMonth = inMonthDays[0]
    const lastInMonth = inMonthDays[inMonthDays.length - 1]
    const label =
      firstInMonth && lastInMonth
        ? `${firstInMonth.getDate()} - ${lastInMonth.getDate()} ${MESES[month]}`
        : `${MESES[month]}`

    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label,
      days: weekDays,
    })

    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

function getDayDate(weekStart: Date, dayIndex: number): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayIndex)
  return d
}

function findWeekIndexForDate(
  weeks: { start: Date; end: Date; label: string; days: Date[] }[],
  date: Date,
) {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const index = weeks.findIndex((week) => {
    const weekStart = new Date(week.start)
    const weekEnd = new Date(week.end)
    weekStart.setHours(0, 0, 0, 0)
    weekEnd.setHours(23, 59, 59, 999)
    return targetDate >= weekStart && targetDate <= weekEnd
  })

  return index >= 0 ? index : 0
}

function isVipService(tipo: string) {
  return tipo === 'VIP' || tipo === 'VIP + Zumba y Box'
}

export default function SchedulePage() {
  const { settings } = useData()
  const now = new Date()
  const mes = now.getMonth()
  const anio = now.getFullYear()
  const diaActual = now.getDate()

  const weeks = useMemo(() => getWeeksOfMonth(mes, anio), [mes, anio])
  const currentDate = useMemo(() => new Date(anio, mes, diaActual), [anio, mes, diaActual])
  const initialWeekIndex = useMemo(
    () => findWeekIndexForDate(weeks, currentDate),
    [weeks, currentDate],
  )
  const [weekIndex, setWeekIndex] = useState(initialWeekIndex)

  useEffect(() => {
    setWeekIndex(initialWeekIndex)
  }, [initialWeekIndex])

  const currentWeek = weeks[weekIndex] || weeks[0]
  const visibleWeekDays = currentWeek?.days ?? []

  const { activeClients, gridData } = useScheduleData({
    settings,
    month: mes,
    year: anio,
    visibleWeekDays,
    rowKeys: SCHEDULE_ROW_KEYS,
  })

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
        <span className="min-w-44 text-center text-base font-medium tabular-nums">
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
        <div className="min-w-230">
          <div className="border-border grid grid-cols-[130px_repeat(6,1fr)_90px] overflow-hidden rounded-lg border">
            {/* Header row */}
            <div className="bg-muted/50 text-muted-foreground border-border flex items-center justify-center border-b p-3 text-sm font-semibold">
              Turno
            </div>
            {DIAS_SEMANA.map((dia, i) => {
              const date = visibleWeekDays[i] ?? null
              const isInCurrentMonth = date?.getMonth() === mes
              const isSaturday = i === 5
              return (
                <div
                  key={dia}
                  className={cn(
                    'bg-muted/50 border-border flex flex-col items-center justify-center border-b border-l p-3 text-center text-sm font-semibold',
                    !isInCurrentMonth && 'bg-muted/20 text-muted-foreground/60',
                    isSaturday && 'bg-accent/30',
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div>{dia}</div>
                    {date && isInCurrentMonth ? (
                      <div className="text-muted-foreground text-sm tabular-nums">
                        {date.getDate()}
                      </div>
                    ) : (
                      <div className="text-muted-foreground/60 text-sm">-</div>
                    )}
                  </div>
                  {isSaturday && (
                    <Badge variant="outline" className="mt-1 text-[11px]">
                      Zumba & Box
                    </Badge>
                  )}
                </div>
              )
            })}
            {/* Sunday column */}
            <div className="bg-muted/20 border-border text-muted-foreground border-b border-l p-3 text-center text-sm font-semibold">
              <div>Dom</div>
              <Ban className="text-muted-foreground/50 mx-auto mt-1 h-3.5 w-3.5" />
            </div>

            {/* Grid rows */}
            {SCHEDULE_ROWS.map((row) => {
              // Saturday activity rows
              if (row.isSaturdayOnly) {
                const isZumba = row.key === 'sabado-zumba'
                const isPurple = isZumba
                const labelBg = isPurple
                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                  : 'bg-orange-500/15 text-orange-700 dark:text-orange-300'
                const cellBg = isPurple ? 'bg-purple-500/10' : 'bg-orange-500/10'
                const badgeBg = isPurple ? 'bg-purple-500' : 'bg-orange-500'

                return (
                  <Fragment key={row.key}>
                    {/* Row label */}
                    <div
                      className={cn(
                        'border-border flex items-center justify-center border-b p-3 text-sm font-semibold',
                        labelBg,
                      )}
                    >
                      {isZumba ? 'Zumba' : 'Box'}
                    </div>
                    {/* Show activity count on each day */}
                    {DIAS_SEMANA.map((dia, dayIdx) => {
                      const dayDate = visibleWeekDays[dayIdx]
                      const isInCurrentMonth = dayDate?.getMonth() === mes
                      const isSaturday = dayIdx === 5

                      if (!isInCurrentMonth) {
                        return (
                          <div
                            key={`${row.key}-${dayIdx}`}
                            className="bg-muted/10 border-border border-b border-l p-1"
                          />
                        )
                      }

                      if (isSaturday) {
                        const clients = gridData[row.key]?.[dayIdx] || []
                        return (
                          <div
                            key={`${row.key}-${dayIdx}`}
                            className={cn(
                              'border-border flex min-h-16 items-center justify-center border-b border-l p-2',
                              cellBg,
                            )}
                          >
                            {clients.length > 0 ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    className={cn(
                                      'flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all hover:scale-105',
                                      badgeBg,
                                      'text-white',
                                    )}
                                  >
                                    <Users className="h-4 w-4 shrink-0" />
                                    {clients.length}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="top"
                                  className="max-h-96 w-72 space-y-1.5 overflow-y-auto p-3"
                                >
                                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                                    {isZumba ? 'Zumba' : 'Box'} - {clients.length} cliente
                                    {clients.length !== 1 ? 's' : ''}
                                  </p>
                                  {clients.map((c) => (
                                    <div
                                      key={c.id}
                                      className="flex items-center justify-between py-0.5 text-sm"
                                    >
                                      <span className="font-medium">
                                        {c.nombre} {c.apellido}
                                      </span>
                                      {isVipService(c.tipoServicio) && (
                                        <Badge
                                          variant="outline"
                                          className="text-primary border-primary/30 ml-2 text-[10px]"
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
                      }

                      return (
                        <div
                          key={`${row.key}-${dayIdx}`}
                          className="bg-muted/10 border-border border-b border-l p-1"
                        />
                      )
                    })}
                    {/* Sunday cell - closed */}
                    <div className="bg-muted/10 border-border border-b border-l p-2" />
                  </Fragment>
                )
              }

              return (
                <Fragment key={row.key}>
                  {/* Row label */}
                  <div
                    className={cn(
                      'border-border flex items-center justify-center border-b p-3 text-sm font-semibold',
                      row.isBreak && 'bg-muted/30 text-muted-foreground italic',
                      row.isVip && 'bg-primary/10 text-primary font-semibold',
                    )}
                  >
                    {row.isBreak && <Coffee className="mr-1.5 h-3.5 w-3.5 shrink-0" />}
                    {row.label}
                  </div>

                  {/* Day cells */}
                  {DIAS_SEMANA.map((dia, dayIdx) => {
                    const clients = gridData[row.key]?.[dayIdx] || []
                    const isSaturday = dayIdx === 5
                    const dayDate = visibleWeekDays[dayIdx]
                    const isInCurrentMonth = dayDate?.getMonth() === mes

                    if (!isInCurrentMonth) {
                      return (
                        <div
                          key={`${row.key}-${dayIdx}`}
                          className="bg-muted/10 border-border border-b border-l p-1"
                        />
                      )
                    }

                    if (row.isBreak) {
                      return (
                        <div
                          key={`${row.key}-${dayIdx}`}
                          className="bg-muted/20 border-border border-b border-l p-2"
                        />
                      )
                    }

                    // VIP row: not on Saturday (they're already in regular slots)
                    if (row.isVip && isSaturday) {
                      return (
                        <div
                          key={`${row.key}-${dayIdx}`}
                          className="bg-muted/10 border-border border-b border-l p-2"
                        />
                      )
                    }

                    return (
                      <div
                        key={`${row.key}-${dayIdx}`}
                        className={cn(
                          'border-border min-h-14 border-b border-l p-2',
                          isSaturday && 'bg-accent/10',
                          row.isVip && 'bg-primary/5',
                        )}
                      >
                        {clients.length > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  'hover:bg-accent flex w-full cursor-pointer items-center justify-center gap-1.5 rounded px-2 py-1 text-sm font-semibold transition-colors',
                                  row.isVip ? 'text-primary' : 'text-foreground',
                                )}
                              >
                                <Users className="h-3.5 w-3.5 shrink-0" />
                                {clients.length}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="top"
                              className="max-h-96 w-64 space-y-1.5 overflow-y-auto p-3"
                            >
                              <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                                {row.label} — {DIAS_SEMANA[dayIdx]}
                              </p>
                              {clients.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between py-0.5 text-sm"
                                >
                                  <span>
                                    {c.nombre} {c.apellido}
                                  </span>
                                  {isVipService(c.tipoServicio) && (
                                    <Badge
                                      variant="outline"
                                      className="text-primary border-primary/30 ml-2 text-[10px]"
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
                      'border-border bg-muted/10 border-b border-l p-2',
                      row.isBreak && 'bg-muted/20',
                    )}
                  />
                </Fragment>
              )
            })}
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

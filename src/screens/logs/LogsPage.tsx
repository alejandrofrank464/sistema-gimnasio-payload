'use client'

import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLogsListQuery } from '@/features/logs/hooks/use-logs-query'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'

const PAGE_SIZE = 25
type ActionFilter = 'all' | 'Crear' | 'Editar' | 'Eliminar'
type EntityFilter = 'all' | 'Cliente' | 'Pago' | 'Ajuste'
type DateSortOrder = 'asc' | 'desc'

export default function LogsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all')
  const [sortDate, setSortDate] = useState<DateSortOrder>('desc')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, actionFilter, entityFilter, sortDate])

  const { data: logsPage } = useLogsListQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    action: actionFilter,
    entity: entityFilter,
    sortDate,
  })

  const logs = logsPage?.docs ?? []
  const totalDocs = logsPage?.totalDocs ?? 0
  const totalPages = logsPage?.totalPages ?? 1

  return (
    <div>
      <PageHeader title="Logs" description={`${totalDocs} eventos registrados`}>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por descripción o usuario..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
            className="bg-background h-9 w-50 pl-8 text-sm sm:w-65"
          />
        </div>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <ToggleGroup
          type="single"
          value={entityFilter}
          onValueChange={(value) => setEntityFilter((value as EntityFilter) || 'all')}
          variant="outline"
          size="sm"
          className="justify-start"
        >
          <ToggleGroupItem value="all">Todas las entidades</ToggleGroupItem>
          <ToggleGroupItem value="Cliente">Cliente</ToggleGroupItem>
          <ToggleGroupItem value="Pago">Pago</ToggleGroupItem>
          <ToggleGroupItem value="Ajuste">Ajuste</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          type="single"
          value={actionFilter}
          onValueChange={(value) => setActionFilter((value as ActionFilter) || 'all')}
          variant="outline"
          size="sm"
          className="justify-start"
        >
          <ToggleGroupItem value="all">Todas las acciones</ToggleGroupItem>
          <ToggleGroupItem value="Crear">Crear</ToggleGroupItem>
          <ToggleGroupItem value="Editar">Editar</ToggleGroupItem>
          <ToggleGroupItem value="Eliminar">Eliminar</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          message={debouncedSearch ? 'Sin resultados' : 'No hay logs'}
          description={
            debouncedSearch
              ? 'Intenta con otro término de búsqueda o ajusta los filtros.'
              : 'Los eventos aparecerán aquí cuando existan operaciones registradas.'
          }
        />
      ) : (
        <div className="border-border overflow-hidden rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="bg-card text-left">
                <th className="text-muted-foreground px-4 py-3 text-xs tracking-wider uppercase">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-7 gap-1 px-2"
                    onClick={() => setSortDate((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  >
                    Fecha
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </Button>
                </th>
                <th className="text-muted-foreground px-4 py-3 text-xs tracking-wider uppercase">
                  Entidad
                </th>
                <th className="text-muted-foreground px-4 py-3 text-xs tracking-wider uppercase">
                  Acción
                </th>
                <th className="text-muted-foreground px-4 py-3 text-xs tracking-wider uppercase">
                  Descripción
                </th>
                <th className="text-muted-foreground px-4 py-3 text-xs tracking-wider uppercase">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-border border-t">
                  <td className="text-muted-foreground px-4 py-3 text-sm">
                    {new Date(log.fecha).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline">{log.entidad}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.accion}</td>
                  <td className="px-4 py-3 text-sm">{log.descripcion}</td>
                  <td className="text-muted-foreground px-4 py-3 text-sm">{log.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {Math.max(1, (page - 1) * PAGE_SIZE + 1)}–{Math.min(page * PAGE_SIZE, totalDocs)} de{' '}
            {totalDocs}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

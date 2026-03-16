'use client'

'use client'

import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/lib/data-context'

export default function LogsPage() {
  const { logs } = useData()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return logs
    return logs.filter((log) =>
      `${log.entidad} ${log.accion} ${log.descripcion} ${log.usuario}`
        .toLowerCase()
        .includes(query),
    )
  }, [logs, search])

  return (
    <div>
      <PageHeader title="Logs" description={`${logs.length} eventos registrados`}>
        <Input
          placeholder="Buscar log..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background w-[240px]"
        />
      </PageHeader>

      {filtered.length === 0 ? (
        <EmptyState
          message="No hay logs"
          description="Los eventos aparecerán aquí cuando existan operaciones registradas."
        />
      ) : (
        <div className="border-border overflow-hidden rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="bg-card text-left">
                <th className="text-muted-foreground px-4 py-3 text-xs tracking-wider uppercase">
                  Fecha
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
              {filtered.map((log) => (
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
    </div>
  )
}

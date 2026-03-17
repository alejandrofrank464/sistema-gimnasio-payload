'use client'

'use client'

import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/lib/data-context'
import { Search } from 'lucide-react'

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
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background h-9 w-50 pl-8 text-sm sm:w-65"
          />
        </div>
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

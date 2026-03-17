'use client'

import { useState, useMemo } from 'react'
import { useData } from '@/lib/data-context'
import { Client } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ClientsTable } from '@/features/clients/components/ClientsTable'
import { ClientForm } from '@/features/clients/components/ClientForm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  useClientsQuery,
  useCreateClientMutation,
  useDeleteClientMutation,
  useUpdateClientMutation,
} from '@/features/clients/hooks/use-clients-query'
import { usePaymentsQueryFiltered } from '@/features/payments/hooks/use-payments-query'

const PAGE_SIZE = 10

export default function ClientsPage() {
  const { settings } = useData()
  const { data: clients = [] } = useClientsQuery(settings)
  const now = new Date()
  const { data: payments = [] } = usePaymentsQueryFiltered({
    month: now.getMonth(),
    year: now.getFullYear(),
    limit: 1000,
  })
  const createClientMutation = useCreateClientMutation()
  const updateClientMutation = useUpdateClientMutation()
  const deleteClientMutation = useDeleteClientMutation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter((c) =>
      `${c.nombre} ${c.apellido} ${c.telefono} ${c.email} ${c.tipoServicio}`
        .toLowerCase()
        .includes(q),
    )
  }, [clients, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleEdit = (client: Client) => {
    setEditClient(client)
    setFormOpen(true)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      void deleteClientMutation.mutateAsync(deleteTarget.id).then(() => {
        toast.success('Cliente eliminado. Los pagos históricos se conservan.')
      })
      setDeleteTarget(null)
    }
  }

  const handleCreateClient = async (data: Omit<Client, 'id' | 'fechaRegistro'>) => {
    await createClientMutation.mutateAsync(data)
  }

  const handleUpdateClient = async (id: string, data: Partial<Client>) => {
    await updateClientMutation.mutateAsync({ id, data })
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients.length} miembros registrados`}
        actionLabel="Nuevo Cliente"
        onAction={() => {
          setEditClient(null)
          setFormOpen(true)
        }}
      >
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="bg-background h-9 w-50 pl-8 text-sm sm:w-65"
          />
        </div>
      </PageHeader>

      {paginated.length === 0 ? (
        <EmptyState
          message={search ? 'Sin resultados' : 'No hay clientes registrados'}
          description={
            search
              ? 'Intenta con otro término de búsqueda.'
              : 'Registra el primer cliente para comenzar.'
          }
        />
      ) : (
        <>
          <ClientsTable
            clients={paginated}
            payments={payments}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de{' '}
                {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editClient}
        settings={settings}
        onCreate={handleCreateClient}
        onUpdate={handleUpdateClient}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="¿Eliminar cliente?"
        description="Sus pagos históricos se mantendrán como registros anónimos."
        onConfirm={handleDelete}
      />
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useData } from '@/lib/data-context'
import { Client, TipoServicio, TIPOS_SERVICIO } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ClientsTable } from '@/features/clients/components/ClientsTable'
import { ClientForm } from '@/features/clients/components/ClientForm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
type StatusFilter = 'all' | 'active' | 'inactive'
type ServiceFilter = 'all' | TipoServicio

export default function ClientsPage() {
  const { settings } = useData()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  const { data: clients = [] } = useClientsQuery(settings)
  const now = new Date()
  const { data: payments = [] } = usePaymentsQueryFiltered({
    month: now.getMonth(),
    year: now.getFullYear(),
    limit: 1000,
  })

  const activeClientIds = useMemo(
    () =>
      new Set(
        payments
          .map((payment) => payment.clienteId)
          .filter((clientId): clientId is string => clientId !== null),
      ),
    [payments],
  )

  const filteredClients = useMemo(() => {
    const searchTerm = debouncedSearch.trim().toLowerCase()

    return clients.filter((client) => {
      const isActive = activeClientIds.has(client.id)
      const statusMatches =
        statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive)
      const serviceMatches = serviceFilter === 'all' || client.tipoServicio === serviceFilter
      const searchMatches =
        searchTerm.length === 0 ||
        client.nombre.toLowerCase().includes(searchTerm) ||
        client.apellido.toLowerCase().includes(searchTerm) ||
        client.telefono.toLowerCase().includes(searchTerm)

      return statusMatches && serviceMatches && searchMatches
    })
  }, [clients, activeClientIds, statusFilter, serviceFilter, debouncedSearch])

  const totalDocs = filteredClients.length
  const totalPages = Math.max(1, Math.ceil(totalDocs / PAGE_SIZE))
  const paginatedClients = filteredClients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, serviceFilter])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const createClientMutation = useCreateClientMutation()
  const updateClientMutation = useUpdateClientMutation()
  const deleteClientMutation = useDeleteClientMutation()
  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

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
        description={`${totalDocs} miembros`}
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
            }}
            className="bg-background h-9 w-50 pl-8 text-sm sm:w-65"
          />
        </div>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <ToggleGroup
          type="single"
          value={statusFilter}
          onValueChange={(value) => setStatusFilter((value as StatusFilter) || 'all')}
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
        >
          <ToggleGroupItem value="all">Todos</ToggleGroupItem>
          <ToggleGroupItem value="active">Activos</ToggleGroupItem>
          <ToggleGroupItem value="inactive">Inactivos</ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          type="single"
          value={serviceFilter}
          onValueChange={(value) => setServiceFilter((value as ServiceFilter) || 'all')}
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
        >
          <ToggleGroupItem value="all">Todos</ToggleGroupItem>
          {TIPOS_SERVICIO.map((tipo) => (
            <ToggleGroupItem key={tipo} value={tipo}>
              {tipo}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {paginatedClients.length === 0 ? (
        <EmptyState
          message={debouncedSearch ? 'Sin resultados' : 'No hay clientes registrados'}
          description={
            debouncedSearch
              ? 'Intenta con otro término de búsqueda.'
              : 'Registra el primer cliente para comenzar.'
          }
        />
      ) : (
        <>
          <ClientsTable
            clients={paginatedClients}
            payments={payments}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
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

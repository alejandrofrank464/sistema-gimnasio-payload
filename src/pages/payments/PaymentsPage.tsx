'use client'

import { useEffect, useMemo, useState } from 'react'
import { useData } from '@/lib/data-context'
import { Payment, MESES, TipoServicio, TIPOS_SERVICIO } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PaymentsTable } from '@/features/payments/components/PaymentsTable'
import { PaymentForm } from '@/features/payments/components/PaymentForm'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  usePaymentsQueryFiltered,
  useUpdatePaymentMutation,
} from '@/features/payments/hooks/use-payments-query'
import { useClientsQuery } from '@/features/clients/hooks/use-clients-query'

const PAGE_SIZE = 25
type ServiceFilter = 'all' | TipoServicio
type TurnoSort = 'none' | 'asc' | 'desc'

const turnoToSortValue = (turno: Payment['turno']): number => {
  if (turno === 'VIP') return 99
  const hour = Number(turno.split(':')[0])
  return Number.isNaN(hour) ? 99 : hour
}

export default function PaymentsPage() {
  const { settings } = useData()
  const { data: clients = [] } = useClientsQuery(settings)
  const createPaymentMutation = useCreatePaymentMutation()
  const updatePaymentMutation = useUpdatePaymentMutation()
  const deletePaymentMutation = useDeletePaymentMutation()
  const now = new Date()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all')
  const [turnoSort, setTurnoSort] = useState<TurnoSort>('none')
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth()))
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()))
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)

  const month = filterMonth === 'all' ? undefined : Number(filterMonth)
  const year = filterYear === 'all' ? undefined : Number(filterYear)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  const { data: paymentsData = [] } = usePaymentsQueryFiltered({
    month,
    year,
    limit: 2000,
  })

  const filteredPayments = useMemo(() => {
    const searchTerm = debouncedSearch.trim().toLowerCase()

    let result = paymentsData.filter((payment) => {
      const serviceMatches = serviceFilter === 'all' || payment.tipoServicio === serviceFilter
      const nameMatches =
        searchTerm.length === 0 || payment.clienteNombre.toLowerCase().includes(searchTerm)

      return serviceMatches && nameMatches
    })

    if (turnoSort !== 'none') {
      result = [...result].sort((a, b) => {
        const aValue = turnoToSortValue(a.turno)
        const bValue = turnoToSortValue(b.turno)
        return turnoSort === 'asc' ? aValue - bValue : bValue - aValue
      })
    }

    return result
  }, [paymentsData, debouncedSearch, serviceFilter, turnoSort])

  const totalDocs = filteredPayments.length
  const totalPages = Math.max(1, Math.ceil(totalDocs / PAGE_SIZE))
  const payments = filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalIncome = payments.reduce((sum, payment) => sum + payment.monto, 0)

  useEffect(() => {
    setPage(1)
  }, [filterMonth, filterYear, serviceFilter, debouncedSearch, turnoSort])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, idx) => current - idx)
  }, [])

  const handleEdit = (payment: Payment) => {
    setEditPayment(payment)
    setFormOpen(true)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      void deletePaymentMutation.mutateAsync(deleteTarget.id).then(() => {
        toast.success('Pago eliminado')
      })
      setDeleteTarget(null)
    }
  }

  const handleCreatePayment = async (data: Omit<Payment, 'id' | 'fecha'>) => {
    try {
      await createPaymentMutation.mutateAsync(data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo registrar el pago.',
      }
    }
  }

  const handleUpdatePayment = async (id: string, data: Partial<Payment>) => {
    await updatePaymentMutation.mutateAsync({ id, data })
  }

  return (
    <div>
      <PageHeader
        title="Pagos"
        description={`Pagina ${page} · ${totalDocs} registros filtrados · $${totalIncome.toLocaleString()} en esta página`}
        actionLabel="Nuevo Pago"
        onAction={() => {
          setEditPayment(null)
          setFormOpen(true)
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Buscar por cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background h-9 w-50 pl-8 text-sm sm:w-65"
            />
          </div>
          <Select
            value={filterMonth}
            onValueChange={(v) => {
              setFilterMonth(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-background h-9 w-[130px] text-sm">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterYear}
            onValueChange={(v) => {
              setFilterYear(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-background h-9 w-[100px] text-sm">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={serviceFilter}
            onValueChange={(value) => setServiceFilter((value as ServiceFilter) || 'all')}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="all">Todos los servicios</ToggleGroupItem>
            {TIPOS_SERVICIO.map((tipo) => (
              <ToggleGroupItem key={tipo} value={tipo}>
                {tipo}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </PageHeader>

      {payments.length === 0 ? (
        <EmptyState
          message={`No hay pagos registrados${filterMonth !== 'all' ? ` en ${MESES[Number(filterMonth)]}` : ''}`}
          description="Registra el primero para comenzar el tracking."
        />
      ) : (
        <>
          <PaymentsTable
            payments={payments}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            turnoSort={turnoSort}
            onToggleTurnoSort={() =>
              setTurnoSort((current) =>
                current === 'none' ? 'asc' : current === 'asc' ? 'desc' : 'none',
              )
            }
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

      <PaymentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        payment={editPayment}
        clients={clients}
        settings={settings}
        onCreate={handleCreatePayment}
        onUpdate={handleUpdatePayment}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="¿Eliminar pago?"
        description={`Se eliminará el pago de ${deleteTarget?.clienteNombre} por $${deleteTarget?.monto}.`}
        onConfirm={handleDelete}
      />
    </div>
  )
}

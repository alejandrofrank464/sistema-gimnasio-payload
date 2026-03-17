'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/lib/data-context'
import { Payment, MESES } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PaymentsTable } from '@/features/payments/components/PaymentsTable'
import { PaymentForm } from '@/features/payments/components/PaymentForm'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  usePaymentsListQuery,
  useUpdatePaymentMutation,
} from '@/features/payments/hooks/use-payments-query'
import { useClientsQuery } from '@/features/clients/hooks/use-clients-query'

const PAGE_SIZE = 25

export default function PaymentsPage() {
  const { settings } = useData()
  const { data: clients = [] } = useClientsQuery(settings)
  const createPaymentMutation = useCreatePaymentMutation()
  const updatePaymentMutation = useUpdatePaymentMutation()
  const deletePaymentMutation = useDeletePaymentMutation()
  const now = new Date()
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth()))
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()))
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)

  const month = filterMonth === 'all' ? undefined : Number(filterMonth)
  const year = filterYear === 'all' ? undefined : Number(filterYear)

  const { data: paymentsPage } = usePaymentsListQuery({
    page,
    limit: PAGE_SIZE,
    month,
    year,
  })

  const payments = paymentsPage?.docs ?? []
  const totalPages = paymentsPage?.totalPages ?? 1
  const totalDocs = paymentsPage?.totalDocs ?? 0

  const totalIncome = payments
    .filter((p) => p.estado === 'Completado')
    .reduce((s, p) => s + p.monto, 0)

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
        <div className="flex items-center gap-2">
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
        </div>
      </PageHeader>

      {payments.length === 0 ? (
        <EmptyState
          message={`No hay pagos registrados${filterMonth !== 'all' ? ` en ${MESES[Number(filterMonth)]}` : ''}`}
          description="Registra el primero para comenzar el tracking."
        />
      ) : (
        <>
          <PaymentsTable payments={payments} onEdit={handleEdit} onDelete={setDeleteTarget} />
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

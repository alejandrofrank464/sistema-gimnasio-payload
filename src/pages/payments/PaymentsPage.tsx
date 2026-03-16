'use client'

import { useState, useMemo } from 'react'
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

const PAGE_SIZE = 10

export default function PaymentsPage() {
  const { payments, deletePayment } = useData()
  const now = new Date()
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth()))
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()))
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null)

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filterMonth !== 'all' && p.mes !== Number(filterMonth)) return false
      if (filterYear !== 'all' && p.anio !== Number(filterYear)) return false
      return true
    })
  }, [payments, filterMonth, filterYear])

  const totalIncome = filtered
    .filter((p) => p.estado === 'Completado')
    .reduce((s, p) => s + p.monto, 0)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const years = [...new Set(payments.map((p) => p.anio))].sort((a, b) => b - a)

  const handleEdit = (payment: Payment) => {
    setEditPayment(payment)
    setFormOpen(true)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      void deletePayment(deleteTarget.id).then(() => {
        toast.success('Pago eliminado')
      })
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Pagos"
        description={`Total: $${totalIncome.toLocaleString()} (${filtered.length} registros)`}
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
              setPage(0)
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
              setPage(0)
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

      {paginated.length === 0 ? (
        <EmptyState
          message={`No hay pagos registrados${filterMonth !== 'all' ? ` en ${MESES[Number(filterMonth)]}` : ''}`}
          description="Registra el primero para comenzar el tracking."
        />
      ) : (
        <>
          <PaymentsTable payments={paginated} onEdit={handleEdit} onDelete={setDeleteTarget} />
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

      <PaymentForm open={formOpen} onOpenChange={setFormOpen} payment={editPayment} />
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

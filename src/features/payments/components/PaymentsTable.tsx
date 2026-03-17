import { Payment, MESES } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowDownAZ, ArrowUpZA, ArrowUpDown, Pencil, Trash2 } from 'lucide-react'

interface PaymentsTableProps {
  payments: Payment[]
  onEdit: (payment: Payment) => void
  onDelete: (payment: Payment) => void
  turnoSort: 'none' | 'asc' | 'desc'
  onToggleTurnoSort: () => void
}

export function PaymentsTable({
  payments,
  onEdit,
  onDelete,
  turnoSort,
  onToggleTurnoSort,
}: PaymentsTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-card hover:bg-card">
            <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Cliente
            </TableHead>
            <TableHead className="text-muted-foreground hidden text-xs font-medium tracking-wider uppercase md:table-cell">
              Periodo
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase tabular-nums">
              Monto
            </TableHead>
            <TableHead className="text-muted-foreground hidden text-xs font-medium tracking-wider uppercase sm:table-cell">
              Método
            </TableHead>
            <TableHead className="text-muted-foreground hidden text-xs font-medium tracking-wider uppercase lg:table-cell">
              Servicio
            </TableHead>
            <TableHead className="text-muted-foreground hidden text-xs font-medium tracking-wider uppercase sm:table-cell">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-1 text-xs tracking-wider uppercase"
                onClick={onToggleTurnoSort}
              >
                Turno
                {turnoSort === 'asc' ? (
                  <ArrowDownAZ className="ml-1 h-3.5 w-3.5" />
                ) : turnoSort === 'desc' ? (
                  <ArrowUpZA className="ml-1 h-3.5 w-3.5" />
                ) : (
                  <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                )}
              </Button>
            </TableHead>
            <TableHead className="text-muted-foreground w-[80px] text-xs font-medium tracking-wider uppercase">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="border-border hover:bg-accent/50">
              <TableCell className="text-sm font-medium">
                {payment.clienteNombre}
                {!payment.clienteId && (
                  <span className="text-muted-foreground ml-1 text-xs">(eliminado)</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                {MESES[payment.mes]} {payment.anio}
              </TableCell>
              <TableCell className="text-success text-sm font-medium tabular-nums">
                ${payment.monto}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                {payment.metodoPago}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                {payment.tipoServicio}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                {payment.turno}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(payment)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-7 w-7"
                    onClick={() => onDelete(payment)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

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
      <div className="w-full overflow-x-auto">
        <Table className="min-w-230">
          <TableHeader>
            <TableRow className="bg-card hover:bg-card">
              <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Cliente
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Periodo
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase tabular-nums">
                Monto
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Método
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Servicio
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
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
              <TableHead className="text-muted-foreground w-20 text-xs font-medium tracking-wider uppercase">
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
                <TableCell className="text-muted-foreground text-sm">
                  {MESES[payment.mes]} {payment.anio}
                </TableCell>
                <TableCell className="text-success text-sm font-medium tabular-nums">
                  ${payment.monto}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {payment.metodoPago}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {payment.tipoServicio}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{payment.turno}</TableCell>
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
    </div>
  )
}

import { Payment, MESES } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface PaymentsTableProps {
  payments: Payment[];
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}

export function PaymentsTable({ payments, onEdit, onDelete }: PaymentsTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-card hover:bg-card">
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Cliente</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Periodo</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium tabular-nums">Monto</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium hidden sm:table-cell">Método</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium hidden lg:table-cell">Servicio</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium hidden sm:table-cell">Turno</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium w-[80px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map(payment => (
            <TableRow key={payment.id} className="border-border hover:bg-accent/50">
              <TableCell className="text-sm font-medium">
                {payment.clienteNombre}
                {!payment.clienteId && <span className="text-xs text-muted-foreground ml-1">(eliminado)</span>}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                {MESES[payment.mes]} {payment.anio}
              </TableCell>
              <TableCell className="text-sm tabular-nums text-success font-medium">${payment.monto}</TableCell>
              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{payment.metodoPago}</TableCell>
              <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{payment.tipoServicio}</TableCell>
              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{payment.turno}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(payment)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(payment)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

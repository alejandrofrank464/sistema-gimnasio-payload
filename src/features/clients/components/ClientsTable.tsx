import { Client, Payment, MESES } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ClientsTableProps {
  clients: Client[]
  payments: Payment[]
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export function ClientsTable({ clients, payments, onEdit, onDelete }: ClientsTableProps) {
  const router = useRouter()
  const now = new Date()

  const isActive = (clientId: string) =>
    payments.some(
      (p) => p.clienteId === clientId && p.mes === now.getMonth() && p.anio === now.getFullYear(),
    )

  return (
    <div className="border-border overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-card hover:bg-card">
            <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Nombre
            </TableHead>
            <TableHead className="text-muted-foreground hidden text-xs font-medium tracking-wider uppercase md:table-cell">
              Teléfono
            </TableHead>
            <TableHead className="text-muted-foreground hidden text-xs font-medium tracking-wider uppercase lg:table-cell">
              Servicio
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Estado
            </TableHead>
            <TableHead className="text-muted-foreground hidden text-xs font-medium tracking-wider uppercase tabular-nums sm:table-cell">
              Precio
            </TableHead>
            <TableHead className="text-muted-foreground w-[120px] text-xs font-medium tracking-wider uppercase">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="border-border hover:bg-accent/50">
              <TableCell className="text-sm font-medium">
                {client.nombre} {client.apellido}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                {client.telefono}
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                {client.tipoServicio}
              </TableCell>
              <TableCell>
                <StatusBadge activo={isActive(client.id)} />
              </TableCell>
              <TableCell className="text-success hidden text-sm tabular-nums sm:table-cell">
                ${client.precioMensual}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => router.push(`/clientes/${client.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(client)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-7 w-7"
                    onClick={() => onDelete(client)}
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

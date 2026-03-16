import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  activo: boolean;
}

export function StatusBadge({ activo }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={activo
        ? 'border-success/30 bg-success/10 text-success text-2xs'
        : 'border-destructive/30 bg-destructive/10 text-destructive text-2xs'
      }
    >
      {activo ? 'Activo' : 'Deudor'}
    </Badge>
  );
}

export function PaymentStatusBadge({ estado }: { estado: string }) {
  const isCompleted = estado === 'Completado';
  return (
    <Badge
      variant="outline"
      className={isCompleted
        ? 'border-success/30 bg-success/10 text-success text-2xs'
        : 'border-warning/30 bg-warning/10 text-warning text-2xs'
      }
    >
      {estado}
    </Badge>
  );
}

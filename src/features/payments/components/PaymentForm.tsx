import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import {
  Client,
  Payment,
  TIPOS_SERVICIO,
  TURNOS,
  MESES,
  TipoServicio,
  Turno,
  MetodoPago,
  EstadoPago,
} from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect } from 'react'
import { toast } from 'sonner'

const paymentSchema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  monto: z.number().min(0, 'Monto debe ser positivo'),
  mes: z.number().min(0).max(11),
  anio: z.number().min(2020).max(2100),
  metodoPago: z.enum(['Efectivo', 'Tarjeta']),
  tipoServicio: z.enum(TIPOS_SERVICIO),
  turno: z.enum(TURNOS),
  estado: z.enum(['Completado', 'Pendiente']),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment?: Payment | null
  clients: Client[]
  onCreate: (data: Omit<Payment, 'id' | 'fecha'>) => Promise<{ success: boolean; error?: string }>
  onUpdate: (id: string, data: Partial<Payment>) => Promise<void>
}

export function PaymentForm({
  open,
  onOpenChange,
  payment,
  clients,
  onCreate,
  onUpdate,
}: PaymentFormProps) {
  const now = new Date()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema as any) as any,
    defaultValues: {
      clienteId: '',
      monto: 500,
      mes: now.getMonth(),
      anio: now.getFullYear(),
      metodoPago: 'Efectivo',
      tipoServicio: 'Normal',
      turno: '08:00',
      estado: 'Completado',
    },
  })

  const selectedClientId = watch('clienteId')

  useEffect(() => {
    if (payment) {
      reset({
        clienteId: payment.clienteId || '',
        monto: payment.monto,
        mes: payment.mes,
        anio: payment.anio,
        metodoPago: payment.metodoPago,
        tipoServicio: payment.tipoServicio,
        turno: payment.turno,
        estado: payment.estado,
      })
    } else {
      reset({
        clienteId: '',
        monto: 500,
        mes: now.getMonth(),
        anio: now.getFullYear(),
        metodoPago: 'Efectivo',
        tipoServicio: 'Normal',
        turno: '08:00',
        estado: 'Completado',
      })
    }
  }, [payment, reset])

  useEffect(() => {
    if (!payment && selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId)
      if (client) {
        setValue('monto', client.precioMensual)
        setValue('tipoServicio', client.tipoServicio)
        setValue('turno', client.turno)
      }
    }
  }, [selectedClientId, payment, clients, setValue])

  const onSubmit = async (data: PaymentFormData) => {
    const client = clients.find((c) => c.id === data.clienteId)
    const clienteNombre = client ? `${client.nombre} ${client.apellido}` : 'Desconocido'

    if (payment) {
      await onUpdate(payment.id, { ...data, clienteNombre } as Partial<Payment>)
      toast.success('Pago actualizado')
    } else {
      const result = await onCreate({ ...data, clienteNombre } as Omit<Payment, 'id' | 'fecha'>)
      if (!result.success) {
        toast.error(result.error || 'Error al crear pago')
        return
      }
      toast.success('Pago registrado')
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto p-2">
        <SheetHeader>
          <SheetTitle>{payment ? 'Editar Pago' : 'Nuevo Pago'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Label className="text-xs">Cliente</Label>
            <Select
              value={selectedClientId}
              onValueChange={(v) => setValue('clienteId', v)}
              disabled={!!payment}
            >
              <SelectTrigger className="bg-background mt-1">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre} {c.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clienteId && (
              <p className="text-destructive mt-1 text-xs">{errors.clienteId.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Mes</Label>
              <Select
                value={String(watch('mes'))}
                onValueChange={(v) => setValue('mes', Number(v))}
              >
                <SelectTrigger className="bg-background mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Año</Label>
              <Input
                {...register('anio', { valueAsNumber: true })}
                type="number"
                className="bg-background mt-1 tabular-nums"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Monto ($)</Label>
            <Input
              {...register('monto', { valueAsNumber: true })}
              type="number"
              className="bg-background mt-1 tabular-nums"
            />
            {errors.monto && (
              <p className="text-destructive mt-1 text-xs">{errors.monto.message}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Turno</Label>
            <Select value={watch('turno')} onValueChange={(v) => setValue('turno', v as Turno)}>
              <SelectTrigger className="bg-background mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TURNOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t} - {String(parseInt(t) + 1).padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Método de Pago</Label>
            <Select
              value={watch('metodoPago')}
              onValueChange={(v) => setValue('metodoPago', v as MetodoPago)}
            >
              <SelectTrigger className="bg-background mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo de Servicio</Label>
            <Select
              value={watch('tipoServicio')}
              onValueChange={(v) => setValue('tipoServicio', v as TipoServicio)}
            >
              <SelectTrigger className="bg-background mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_SERVICIO.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Estado</Label>
            <Select
              value={watch('estado')}
              onValueChange={(v) => setValue('estado', v as EstadoPago)}
            >
              <SelectTrigger className="bg-background mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Completado">Completado</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {payment ? 'Guardar' : 'Registrar Pago'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

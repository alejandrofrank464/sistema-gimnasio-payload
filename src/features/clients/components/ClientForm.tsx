import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Client, MetodoPago, TIPOS_SERVICIO, TURNOS, TipoServicio, Turno } from '@/types'
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
import { Textarea } from '@/components/ui/textarea'
import { useEffect } from 'react'
import {
  ClientFormData,
  clientFormSchema,
  isVipServiceType,
  VIP_TURNO_VALUE,
} from '@/features/clients/schemas/client-form.schema'

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  settings: { precios: Array<{ tipoServicio: TipoServicio; precio: number }> }
  onCreate: (data: Omit<Client, 'id' | 'fechaRegistro'>) => Promise<void>
  onUpdate: (id: string, data: Partial<Client>) => Promise<void>
}

export function ClientForm({
  open,
  onOpenChange,
  client,
  settings,
  onCreate,
  onUpdate,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema) as Resolver<ClientFormData>,
    defaultValues: {
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      metodoPago: 'Efectivo',
      tipoServicio: 'Normal',
      turno: '08:00',
      precioMensual: 500,
      notas: '',
    },
  })

  const tipoServicio = watch('tipoServicio')
  const turno = watch('turno')
  const isVip = isVipServiceType(tipoServicio)

  useEffect(() => {
    if (client) {
      reset({
        nombre: client.nombre,
        apellido: client.apellido,
        telefono: client.telefono,
        email: client.email,
        metodoPago: client.metodoPago,
        tipoServicio: client.tipoServicio,
        turno: isVipServiceType(client.tipoServicio) ? VIP_TURNO_VALUE : client.turno,
        precioMensual: client.precioMensual,
        notas: client.notas,
      })
    } else {
      reset({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        metodoPago: 'Efectivo',
        tipoServicio: 'Normal',
        turno: '08:00',
        precioMensual: 500,
        notas: '',
      })
    }
  }, [client, reset])

  useEffect(() => {
    const precio = settings.precios.find((p) => p.tipoServicio === tipoServicio)
    if (precio) {
      setValue('precioMensual', precio.precio)
    }
  }, [tipoServicio, settings.precios, setValue])

  useEffect(() => {
    if (isVip && turno !== VIP_TURNO_VALUE) {
      setValue('turno', VIP_TURNO_VALUE)
    }

    if (!isVip && turno === VIP_TURNO_VALUE) {
      setValue('turno', '08:00')
    }
  }, [isVip, turno, setValue])

  const onSubmit = async (data: ClientFormData) => {
    const payload = {
      ...data,
      turno: (isVipServiceType(data.tipoServicio) ? '08:00' : data.turno) as Turno,
      email: data.email || '',
      notas: data.notas || '',
    }

    if (client) {
      await onUpdate(client.id, payload as Partial<Client>)
    } else {
      await onCreate(payload as Omit<Client, 'id' | 'fechaRegistro'>)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto p-2">
        <SheetHeader>
          <SheetTitle>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre</Label>
              <Input {...register('nombre')} className="bg-background mt-1" />
              {errors.nombre && (
                <p className="text-destructive mt-1 text-xs">{errors.nombre.message}</p>
              )}
            </div>
            <div>
              <Label>Apellido</Label>
              <Input {...register('apellido')} className="bg-background mt-1" />
              {errors.apellido && (
                <p className="text-destructive mt-1 text-xs">{errors.apellido.message}</p>
              )}
            </div>
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input {...register('telefono')} className="bg-background mt-1" placeholder="+53..." />
            {errors.telefono && (
              <p className="text-destructive mt-1 text-xs">{errors.telefono.message}</p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            <Input {...register('email')} type="email" className="bg-background mt-1" />
            {errors.email && (
              <p className="text-destructive mt-1 text-xs">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label>Método de Pago Inicial</Label>
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
            <Label>Tipo de Servicio</Label>
            <Select
              value={tipoServicio}
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
            <Label>
              Turno{' '}
              {isVip && (
                <span className="text-muted-foreground">(VIP: acceso a todos los turnos)</span>
              )}
            </Label>
            <Select
              value={turno}
              onValueChange={(v) => setValue('turno', v as Turno)}
              disabled={isVip}
            >
              <SelectTrigger className="bg-background mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isVip ? (
                  <SelectItem value={VIP_TURNO_VALUE}>VIP</SelectItem>
                ) : (
                  TURNOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t} - {String(parseInt(t) + 1).padStart(2, '0')}:00
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.turno && (
              <p className="text-destructive mt-1 text-xs">{errors.turno.message}</p>
            )}
            {isVip && (
              <p className="text-muted-foreground mt-1 text-xs">
                Los clientes VIP aparecen en el turno VIP especial del horario.
              </p>
            )}
          </div>
          <div>
            <Label>Precio Mensual ($)</Label>
            <Input
              {...register('precioMensual', { valueAsNumber: true })}
              type="number"
              readOnly
              className="bg-background mt-1 tabular-nums"
            />
            {errors.precioMensual && (
              <p className="text-destructive mt-1 text-xs">{errors.precioMensual.message}</p>
            )}
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea {...register('notas')} className="bg-background mt-1 resize-none" rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {client ? 'Guardar' : 'Crear Cliente'}
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

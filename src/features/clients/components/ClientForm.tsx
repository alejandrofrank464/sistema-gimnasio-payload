import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Client, TIPOS_SERVICIO, TURNOS, TipoServicio, Turno } from '@/types'
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

const clientSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  apellido: z.string().min(1, 'Apellido requerido').max(100),
  telefono: z.string().min(1, 'Teléfono requerido').max(20),
  email: z.string().email('Email inválido').or(z.literal('')),
  tipoServicio: z.enum(TIPOS_SERVICIO),
  turno: z.enum(TURNOS),
  precioMensual: z.number().min(0, 'Precio debe ser positivo'),
  notas: z.string().max(500).optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

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
    resolver: zodResolver(clientSchema as any) as any,
    defaultValues: {
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      tipoServicio: 'Normal',
      turno: '08:00',
      precioMensual: 500,
      notas: '',
    },
  })

  const tipoServicio = watch('tipoServicio')
  const isVip = tipoServicio === 'VIP' || tipoServicio === 'VIP + Zumba y Box'

  useEffect(() => {
    if (client) {
      reset({
        nombre: client.nombre,
        apellido: client.apellido,
        telefono: client.telefono,
        email: client.email,
        tipoServicio: client.tipoServicio,
        turno: client.turno,
        precioMensual: client.precioMensual,
        notas: client.notas,
      })
    } else {
      reset({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        tipoServicio: 'Normal',
        turno: '08:00',
        precioMensual: 500,
        notas: '',
      })
    }
  }, [client, reset])

  useEffect(() => {
    if (!client) {
      const precio = settings.precios.find((p) => p.tipoServicio === tipoServicio)
      if (precio) setValue('precioMensual', precio.precio)
    }
  }, [tipoServicio, client, settings.precios, setValue])

  const onSubmit = async (data: ClientFormData) => {
    if (client) {
      await onUpdate(client.id, data as Partial<Client>)
    } else {
      await onCreate(data as Omit<Client, 'id' | 'fechaRegistro'>)
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
              <Label className="text-xs">Nombre</Label>
              <Input {...register('nombre')} className="bg-background mt-1" />
              {errors.nombre && (
                <p className="text-destructive mt-1 text-xs">{errors.nombre.message}</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Apellido</Label>
              <Input {...register('apellido')} className="bg-background mt-1" />
              {errors.apellido && (
                <p className="text-destructive mt-1 text-xs">{errors.apellido.message}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Teléfono</Label>
            <Input {...register('telefono')} className="bg-background mt-1" />
            {errors.telefono && (
              <p className="text-destructive mt-1 text-xs">{errors.telefono.message}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input {...register('email')} type="email" className="bg-background mt-1" />
            {errors.email && (
              <p className="text-destructive mt-1 text-xs">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Tipo de Servicio</Label>
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
            <Label className="text-xs">
              Turno{' '}
              {isVip && (
                <span className="text-muted-foreground">(VIP: acceso a todos los turnos)</span>
              )}
            </Label>
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
            {isVip && (
              <p className="text-muted-foreground mt-1 text-xs">
                Los clientes VIP aparecen en el turno VIP especial del horario.
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs">Precio Mensual ($)</Label>
            <Input
              {...register('precioMensual', { valueAsNumber: true })}
              type="number"
              className="bg-background mt-1 tabular-nums"
            />
            {errors.precioMensual && (
              <p className="text-destructive mt-1 text-xs">{errors.precioMensual.message}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Notas</Label>
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

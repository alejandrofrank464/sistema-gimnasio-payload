import { z } from 'zod/v4'

import { VIP_TURNO_VALUE } from '@/features/clients/schemas/client-form.schema'
import { MESES, TIPOS_SERVICIO, TURNOS } from '@/types'

export const paymentSchema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  monto: z.number().min(0, 'Monto debe ser positivo'),
  mes: z
    .number()
    .min(0)
    .max(MESES.length - 1),
  anio: z.number().min(2020).max(2100),
  metodoPago: z.enum(['Efectivo', 'Tarjeta']),
  tipoServicio: z.enum(TIPOS_SERVICIO),
  turno: z.enum([...TURNOS, VIP_TURNO_VALUE] as const),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

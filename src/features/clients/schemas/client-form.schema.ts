import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { z } from 'zod/v4'

import { METODO_PAGO_OPTIONS, TIPO_SERVICIO_OPTIONS } from '@/constants/domain'
import { TURNOS } from '@/types'

export const VIP_TURNO_VALUE = 'VIP' as const
export const CLIENT_FORM_TURNOS = [...TURNOS, VIP_TURNO_VALUE] as const

const isVipService = (tipoServicio: string): boolean => {
  return tipoServicio === 'VIP' || tipoServicio === 'VIP + Zumba y Box'
}

const toCuE164 = (value: string): string | null => {
  const parsed = parsePhoneNumberFromString(value, 'CU')
  if (!parsed || !parsed.isValid()) {
    return null
  }

  return parsed.number
}

export const clientFormSchema = z
  .object({
    nombre: z.string().trim().min(1, 'Nombre requerido').max(100),
    apellido: z.string().trim().min(1, 'Apellido requerido').max(100),
    telefono: z
      .string()
      .trim()
      .min(1, 'Telefono requerido')
      .refine((value) => Boolean(toCuE164(value)), 'Telefono invalido para Cuba (+53)')
      .transform((value) => toCuE164(value) as string),
    email: z.string().trim().email('Email invalido').or(z.literal('')),
    metodoPago: z.enum(METODO_PAGO_OPTIONS),
    tipoServicio: z.enum(TIPO_SERVICIO_OPTIONS),
    turno: z.enum(CLIENT_FORM_TURNOS),
    precioMensual: z.number().min(0, 'Precio debe ser positivo'),
    notas: z.string().trim().max(500).or(z.literal('')),
  })
  .superRefine((value, ctx) => {
    const vip = isVipService(value.tipoServicio)

    if (vip && value.turno !== VIP_TURNO_VALUE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para clientes VIP el turno debe ser VIP',
        path: ['turno'],
      })
    }

    if (!vip && value.turno === VIP_TURNO_VALUE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona un turno valido para este servicio',
        path: ['turno'],
      })
    }
  })

export type ClientFormData = z.infer<typeof clientFormSchema>
export type ClientFormTurno = (typeof CLIENT_FORM_TURNOS)[number]

export const isVipServiceType = isVipService

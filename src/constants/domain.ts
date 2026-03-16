export const TURNO_OPTIONS = [
  'de 7:00 am a 8:00 am',
  'de 8:00 am a 9:00 am',
  'de 9:00 am a 10:00 am',
  'de 10:00 am a 11:00 am',
  'de 11:00 am a 12:00 pm',
  'de 1:00 pm a 2:00 pm',
  'de 2:00 pm a 3:00 pm',
  'de 3:00 pm a 4:00 pm',
  'de 4:00 pm a 5:00 pm',
  'de 5:00 pm a 6:00 pm',
  'de 6:00 pm a 7:00 pm',
  'de 7:00 pm a 8:00 pm',
] as const

export const METODO_PAGO_OPTIONS = ['Efectivo', 'Tarjeta'] as const

export const TIPO_SERVICIO_OPTIONS = [
  'Normal',
  'VIP',
  'Zumba',
  'Box',
  'Zumba y Box',
  'VIP + Zumba y Box',
] as const

export const LOG_ACCION_OPTIONS = [
  'crear_cliente',
  'editar_cliente',
  'eliminar_cliente',
  'crear_pago',
  'editar_pago',
  'eliminar_pago',
] as const

export type MetodoPago = (typeof METODO_PAGO_OPTIONS)[number]
export type TipoServicio = (typeof TIPO_SERVICIO_OPTIONS)[number]
export type Turno = (typeof TURNO_OPTIONS)[number]

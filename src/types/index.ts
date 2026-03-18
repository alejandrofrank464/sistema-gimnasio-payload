export const TIPOS_SERVICIO = [
  'Normal',
  'VIP',
  'Zumba',
  'Box',
  'Zumba y Box',
  'VIP + Zumba y Box',
] as const

export type TipoServicio = (typeof TIPOS_SERVICIO)[number]
export type MetodoPago = 'Efectivo' | 'Tarjeta'

// Turnos disponibles: 07:00-20:00, excluyendo 12:00-13:00
export const TURNOS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  // 12:00-13:00 = receso
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
] as const

export type Turno = (typeof TURNOS)[number]
export type PaymentTurno = Turno | 'VIP'

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const
export type DiaSemana = (typeof DIAS_SEMANA)[number]

export interface Client {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  metodoPago: MetodoPago
  tipoServicio: TipoServicio
  turno: Turno
  precioMensual: number
  fechaRegistro: string
  notas: string
}

export interface Payment {
  id: string
  clienteId: string | null
  clienteNombre: string
  monto: number
  mes: number
  anio: number
  metodoPago: MetodoPago
  tipoServicio: TipoServicio
  turno: PaymentTurno
  fecha: string
}

export interface LogEntry {
  id: string
  entidad: 'Cliente' | 'Pago' | 'Ajuste'
  accion: 'Crear' | 'Editar' | 'Eliminar'
  descripcion: string
  fecha: string
  usuario: string
}

export interface PrecioServicio {
  tipoServicio: TipoServicio
  precio: number
}

export interface Settings {
  nombreGimnasio: string
  precios: PrecioServicio[]
  logoUrl: string
}

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

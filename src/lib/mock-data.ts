import { Client, Payment, LogEntry, Settings, Turno } from '@/types';

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

export const initialClients: Client[] = [
  { id: 'c1', nombre: 'Carlos', apellido: 'Ramírez', telefono: '555-0101', email: 'carlos@email.com', tipoServicio: 'Normal', turno: '08:00', precioMensual: 500, fechaRegistro: '2025-01-15', notas: '' },
  { id: 'c2', nombre: 'Ana', apellido: 'López', telefono: '555-0102', email: 'ana@email.com', tipoServicio: 'VIP', turno: '09:00', precioMensual: 900, fechaRegistro: '2025-02-01', notas: 'Horario preferido: mañana' },
  { id: 'c3', nombre: 'Miguel', apellido: 'Torres', telefono: '555-0103', email: 'miguel@email.com', tipoServicio: 'Zumba', turno: '10:00', precioMensual: 600, fechaRegistro: '2025-03-10', notas: '' },
  { id: 'c4', nombre: 'Laura', apellido: 'García', telefono: '555-0104', email: 'laura@email.com', tipoServicio: 'Box', turno: '17:00', precioMensual: 700, fechaRegistro: '2025-01-20', notas: '' },
  { id: 'c5', nombre: 'Roberto', apellido: 'Méndez', telefono: '555-0105', email: 'roberto@email.com', tipoServicio: 'Zumba y Box', turno: '18:00', precioMensual: 800, fechaRegistro: '2025-04-01', notas: '' },
  { id: 'c6', nombre: 'Sofía', apellido: 'Hernández', telefono: '555-0106', email: 'sofia@email.com', tipoServicio: 'VIP + Zumba y Box', turno: '07:00', precioMensual: 1200, fechaRegistro: '2025-05-15', notas: 'Cliente premium' },
  { id: 'c7', nombre: 'Diego', apellido: 'Martínez', telefono: '555-0107', email: 'diego@email.com', tipoServicio: 'Normal', turno: '08:00', precioMensual: 500, fechaRegistro: '2025-06-01', notas: '' },
  { id: 'c8', nombre: 'Valentina', apellido: 'Ruiz', telefono: '555-0108', email: 'valentina@email.com', tipoServicio: 'VIP', turno: '15:00', precioMensual: 900, fechaRegistro: '2025-07-10', notas: '' },
];

export const initialPayments: Payment[] = [
  { id: 'p1', clienteId: 'c1', clienteNombre: 'Carlos Ramírez', monto: 500, mes: currentMonth, anio: currentYear, metodoPago: 'Efectivo', tipoServicio: 'Normal', turno: '08:00', fecha: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`, estado: 'Completado' },
  { id: 'p2', clienteId: 'c2', clienteNombre: 'Ana López', monto: 900, mes: currentMonth, anio: currentYear, metodoPago: 'Tarjeta', tipoServicio: 'VIP', turno: '09:00', fecha: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-02`, estado: 'Completado' },
  { id: 'p3', clienteId: 'c3', clienteNombre: 'Miguel Torres', monto: 600, mes: currentMonth, anio: currentYear, metodoPago: 'Efectivo', tipoServicio: 'Zumba', turno: '10:00', fecha: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-03`, estado: 'Completado' },
  { id: 'p4', clienteId: 'c5', clienteNombre: 'Roberto Méndez', monto: 800, mes: currentMonth, anio: currentYear, metodoPago: 'Tarjeta', tipoServicio: 'Zumba y Box', turno: '18:00', fecha: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`, estado: 'Completado' },
  { id: 'p5', clienteId: 'c6', clienteNombre: 'Sofía Hernández', monto: 1200, mes: currentMonth, anio: currentYear, metodoPago: 'Tarjeta', tipoServicio: 'VIP + Zumba y Box', turno: '07:00', fecha: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-06`, estado: 'Completado' },
  { id: 'p6', clienteId: 'c1', clienteNombre: 'Carlos Ramírez', monto: 500, mes: currentMonth > 0 ? currentMonth - 1 : 11, anio: currentMonth > 0 ? currentYear : currentYear - 1, metodoPago: 'Efectivo', tipoServicio: 'Normal', turno: '08:00', fecha: '2026-02-01', estado: 'Completado' },
  { id: 'p7', clienteId: 'c2', clienteNombre: 'Ana López', monto: 900, mes: currentMonth > 0 ? currentMonth - 1 : 11, anio: currentMonth > 0 ? currentYear : currentYear - 1, metodoPago: 'Tarjeta', tipoServicio: 'VIP', turno: '09:00', fecha: '2026-02-02', estado: 'Completado' },
  { id: 'p8', clienteId: 'c4', clienteNombre: 'Laura García', monto: 700, mes: currentMonth > 0 ? currentMonth - 1 : 11, anio: currentMonth > 0 ? currentYear : currentYear - 1, metodoPago: 'Efectivo', tipoServicio: 'Box', turno: '17:00', fecha: '2026-02-03', estado: 'Completado' },
];

export const initialLogs: LogEntry[] = [
  { id: 'l1', entidad: 'Cliente', accion: 'Crear', descripcion: 'Nuevo cliente: Carlos Ramírez', fecha: '2025-01-15T10:30:00', usuario: 'admin' },
  { id: 'l2', entidad: 'Pago', accion: 'Crear', descripcion: 'Pago inicial de Carlos Ramírez — $500', fecha: '2025-01-15T10:31:00', usuario: 'admin' },
  { id: 'l3', entidad: 'Cliente', accion: 'Crear', descripcion: 'Nuevo cliente: Ana López', fecha: '2025-02-01T09:00:00', usuario: 'staff' },
  { id: 'l4', entidad: 'Ajuste', accion: 'Editar', descripcion: 'Precio Normal actualizado: $450 → $500', fecha: '2025-06-01T14:00:00', usuario: 'admin' },
];

export const initialSettings: Settings = {
  nombreGimnasio: 'GymOS Fitness Center',
  precios: [
    { tipoServicio: 'Normal', precio: 500 },
    { tipoServicio: 'VIP', precio: 900 },
    { tipoServicio: 'Zumba', precio: 600 },
    { tipoServicio: 'Box', precio: 700 },
    { tipoServicio: 'Zumba y Box', precio: 800 },
    { tipoServicio: 'VIP + Zumba y Box', precio: 1200 },
  ],
  logoUrl: '',
};

# Sistema Gimnasio Payload

Proyecto backend-first para migrar la logica de datos del sistema de gimnasio a Next.js + Payload + TypeScript.

## Estado actual

Implementado en esta fase:

- Colecciones: users, media, clientes, pagos, configuraciones, logs.
- Auth Payload con roles `admin` y `staff`.
- Dashboard funcional con modulos:
  - Clientes: create/read/update/delete + busqueda + detalle con historial de pagos.
  - Pagos: create/read/update/delete + filtros por mes/anio.
  - Horario: tabla por turnos usando pagos activos del mes.
  - Ajustes: precios y carga de logo.
  - Logs: tabla con filtros por entidad y accion.
- Hooks de negocio:
  - Crear cliente genera pago inicial automatico del mes actual.
  - Editar cliente no modifica pagos existentes.
  - Eliminar cliente conserva pagos historicos (desasocia `pago.cliente`).
  - Logs minimos para CRUD de cliente y pago.
- Regla anti-duplicado de pagos por `cliente + mesPago + anioPago`.
- Endpoints de configuracion:
  - `GET /api/configuraciones/precios`
  - `POST /api/configuraciones/upsert`
  - `GET /api/configuraciones/logo`
  - `POST /api/configuraciones/logo`

## Requisitos

- Node 20+
- pnpm 10+

## Inicio rapido (internet limitado)

1. Copiar variables:
   - `cp .env.example .env`
2. Instalar:
   - `pnpm install`
3. Generar tipos:
   - `pnpm generate:types`
4. Levantar app:
   - `pnpm dev`

## Configuracion de DB

- Por defecto usa SQLite local con `DATABASE_URL=file:./sistema-gimnasio-payload.db`.
- Si defines `POSTGRES_URL`, se activa automaticamente el adapter Postgres.

## Configuracion de Blob

- Si defines `BLOB_READ_WRITE_TOKEN`, se activa storage en Vercel Blob para `media`.
- Si no lo defines, Payload mantiene upload local.

## Reglas de negocio de pagos al crear cliente

Prioridad de servicio y monto:

1. `vip && zumba && box` -> `VIP + Zumba y Box` -> `precio_vip_zumba_y_box`
2. `vip` -> `VIP` -> `precio_vip`
3. `zumba && box` -> `Zumba y Box` -> `precio_zumba_y_box`
4. `zumba || box` -> `Zumba` o `Box` -> `precio_zumba_o_box`
5. default -> `Normal` -> `precio_normal`

Defaults de precios si faltan configuraciones:

- precio_normal: 30
- precio_vip: 50
- precio_zumba_o_box: 40
- precio_zumba_y_box: 60
- precio_vip_zumba_y_box: 80

## Proximo bloque

- Agregar paginacion y filtros avanzados (VIP, servicio, rango de fechas).
- Endurecer permisos por rol en acciones sensibles del frontend.

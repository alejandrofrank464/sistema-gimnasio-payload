# Setup minimo antes de pasar el plan al agente

## Objetivo

Dejar creado el proyecto base y las credenciales listas para que el agente ejecute la migracion sin friccion.

## 1. Crear el proyecto nuevo (vacio, con TypeScript)

En la carpeta Gym:

1. Crear carpeta destino del proyecto nuevo:
   - sistema-gimnasio-payload
2. Ejecutar el scaffold oficial de Payload:
   - npx create-payload-app@latest
3. Durante el asistente, elegir:
   - TypeScript: si
   - Database: PostgreSQL
   - Template: el mas basico posible (backend-first)
   - Package manager: npm (o el que prefieras, pero uno solo)
4. Verificar que el proyecto arranca en local:
   - npm install
   - npm run dev

## 2. Preparar Neon (Postgres)

1. Crear proyecto en Neon.
2. Crear base de datos de produccion y (opcional) una de desarrollo.
3. Copiar cadena de conexion (pooled y non-pooled si Neon te da ambas).
4. Guardar estos valores para el proyecto:
   - POSTGRES_URL
   - POSTGRES_PRISMA_URL (si aplica)
   - POSTGRES_URL_NON_POOLING (si aplica)

## 3. Preparar Vercel Blob

1. Crear/usar proyecto en Vercel.
2. Habilitar Blob para ese proyecto.
3. Generar token de lectura/escritura.
4. Guardar:
   - BLOB_READ_WRITE_TOKEN

## 4. Preparar variables de entorno locales

En el proyecto nuevo crear archivo de entorno con:

- PAYLOAD_SECRET
- NEXT_PUBLIC_APP_URL=http://localhost:3000
- POSTGRES_URL (la de Neon)
- BLOB_READ_WRITE_TOKEN

Recomendado:

- generar un PAYLOAD_SECRET largo (32+ caracteres)

## 5. Dejar listo el acceso para deploy en Vercel

1. Crear proyecto en Vercel (o enlazar repo cuando lo subas).
2. Cargar las mismas variables en:
   - Preview
   - Production
3. Verificar que no falte ninguna variable critica.

## 6. Cargar datos fuente para migracion (opcional pero recomendado)

Antes de abrir el chat del agente, deja preparado uno de estos dos caminos:

1. Acceso al Strapi corriendo localmente para lectura por API.
2. Export JSON de:
   - clientes
   - pagos
   - configuraciones

Nota: logs no son prioridad para esta migracion.

## 7. Checklist de arranque para el chat con agente

Debes tener listo esto antes de pegar plan.md:

- Proyecto Next + Payload creado y ejecutando en local.
- Variables locales cargadas.
- Neon listo con cadena de conexion valida.
- Blob token listo.
- Decisiones cerradas (ya definidas):
  - camelCase
  - TypeScript
  - auth Payload
  - roles admin/staff
  - sin migracion historica de logs

## 8. Primer prompt que debes usar con el agente

1. Abrir el proyecto nuevo sistema-gimnasio-payload.
2. Pegar el contenido de plan.md.
3. Pedirle que empiece por:
   - Fase 1: colecciones y esquema
   - Fase 2: hooks de negocio (pago automatico)
   - Fase 3: endpoints de configuracion
   - Fase 4: script de migracion sin logs

# Plan V2: Migracion Strapi -> Next + Payload (Enfoque Backend)

## 1) Objetivo real de este plan

Este plan esta optimizado para migrar la logica de negocio y el modelo de datos de Strapi a Payload sin perder schemas ni comportamiento critico.

Prioridad alta:

- Colecciones, relaciones, validaciones y enums.
- Hooks equivalentes a lifecycles de Strapi.
- Auth nativo de Payload con roles admin/staff.
- Endpoints custom de configuracion.
- Base de datos Postgres en Neon (Vercel Integration).
- Storage de archivos con Vercel Blob.
- Deploy en Vercel.

Prioridad baja (a criterio del owner):

- Rediseno frontend y detalles de UI.
- Refactor visual completo.

Decisiones ya confirmadas por el owner:

- Naming de campos: camelCase.
- Proyecto nuevo: TypeScript.
- Auth: Payload auth (manteniendo flujo parecido al actual).
- Roles: admin y staff.
- Storage media: Vercel Blob.
- Logs internos historicos: no se migran y no son prioridad funcional.

---

## 2) Estado actual relevante en Strapi (fuente de verdad)

Colecciones detectadas:

1. cliente

- Name (string, required)
- LastName (string, required)
- Phone (text, required, unique)
- Email (email, unique)
- Vip (boolean, default false)
- Zumba (boolean, default false)
- Box (boolean, default false)
- Turno (enum horarios)
- MetodoPago (enum: Efectivo, Tarjeta)
- Relacion one-to-many con pago

2. pago

- Monto (decimal, required, min 0)
- MetodoPago (enum: Efectivo, Tarjeta)
- TipoServicio (enum, required, default Normal)
- FechaPago (date, required)
- MesPago (int 0..11, required)
- AnioPago (int, required)
- Turno (enum, opcional)
- Relacion many-to-one con cliente

3. configuracion

- clave (string, required, unique)
- valor (text, required)
- logo (media image)

4. log

- Accion, Entidad, EntidadId, Detalles, Usuario, NombreCompleto
- Nota: mantener o no esta coleccion queda opcional por baja prioridad.

Reglas de negocio actuales detectadas:

- Al crear cliente:
  - log crear_cliente
  - crear pago automatico del mes actual
  - calcular tipoServicio y monto segun vip/zumba/box y tabla de precios
  - si vip=true -> turno null
- Al editar/eliminar cliente: log correspondiente
- Al crear/editar/eliminar pago: log correspondiente
- Endpoints custom en configuracion (precios/upsert/logo)

---

## 3) Arquitectura objetivo recomendada

Stack:

- Next.js (App Router) + TypeScript
- Payload CMS embebido
- Postgres (Neon)
- Vercel Blob para media/logo
- Deploy full en Vercel

Estructura sugerida:

- src/payload/collections/users.ts
- src/payload/collections/clientes.ts
- src/payload/collections/pagos.ts
- src/payload/collections/configuraciones.ts
- src/payload/collections/media.ts
- src/payload/hooks/clientes/\*.ts
- src/payload/hooks/pagos/\*.ts
- src/payload/utils/precios.ts
- src/app/api/configuraciones/\* (si mantienes rutas custom)

---

## 4) Modelo de datos objetivo en Payload (camelCase)

## 4.1 users (auth)

- auth habilitado
- email
- password
- role: select [admin, staff], required, default staff
- active: checkbox default true

Permisos:

- admin: acceso completo a admin panel y operaciones de negocio
- staff: acceso solo a operaciones necesarias para la web

## 4.2 clientes

Campos:

- name: text required
- lastName: text required
- phone: text required unique
- email: email unique opcional
- vip: checkbox default false
- zumba: checkbox default false
- box: checkbox default false
- turno: select (mismas opciones de horario)
- metodoPago: select [Efectivo, Tarjeta] default Efectivo

Indices recomendados:

- unique phone
- unique email (nullable)
- index compuesto name + lastName

## 4.3 pagos

Campos:

- monto: number required min 0
- metodoPago: select [Efectivo, Tarjeta]
- tipoServicio: select [Normal, VIP, Zumba, Box, Zumba y Box, VIP + Zumba y Box]
- fechaPago: date required
- mesPago: number required min 0 max 11
- anioPago: number required
- turno: select opcional
- cliente: relationship -> clientes (required)

Indices recomendados:

- index mesPago + anioPago
- index cliente + fechaPago desc

## 4.4 configuraciones

Mantener esquema key-value por compatibilidad:

- clave: text required unique
- valor: text required
- logo: relationship -> media (single)

Claves minimas a inicializar:

- precio_normal
- precio_vip
- precio_zumba_o_box
- precio_zumba_y_box
- precio_vip_zumba_y_box

## 4.5 media

- Upload collection para Vercel Blob
- solo imagen para logo (validar mime y size)

## 4.6 logs (opcional)

Como no es prioridad, elegir una de dos:

- Opcion A: no crear coleccion logs y quitar auditoria.
- Opcion B: crear logs minima solo para trazabilidad basica.

Recomendacion para tu caso:

- Opcion A para reducir complejidad inicial.

---

## 5) Logica de negocio a portar 1:1 desde Strapi

## 5.1 Helper de precios y tipoServicio

Crear util central `precios.ts`:

- Lee precios desde configuraciones (fallback por defecto).
- Calcula tipoServicio y monto por prioridad exacta:
  1. vip && zumba && box -> VIP + Zumba y Box
  2. vip -> VIP
  3. zumba && box -> Zumba y Box
  4. zumba || box -> Zumba o Box
  5. default -> Normal

Mapeo de precios:

- normal -> precio_normal
- vip -> precio_vip
- zumba_o_box -> precio_zumba_o_box
- zumba_y_box -> precio_zumba_y_box
- vip_zumba_y_box -> precio_vip_zumba_y_box

## 5.2 Hook en clientes al crear

En `afterChange` cuando operation=create:

- calcular tipoServicio y monto
- crear pago automatico del mes actual con:
  - fechaPago = hoy
  - mesPago = getMonth()
  - anioPago = getFullYear()
  - metodoPago = cliente.metodoPago || Efectivo
  - turno = null si vip=true, sino turno del cliente

## 5.3 Hook en clientes al editar/eliminar

- Si mantienes logs: registrar accion
- Si no mantienes logs: no-op (sin bloquear operacion)

## 5.4 Hook en pagos al crear/editar/eliminar

- Igual: solo auditoria si decides mantener logs

Regla clave:

- Ningun hook de auditoria debe romper la operacion principal.

---

## 6) Auth en Payload (sin Strapi auth)

Objetivo:

- Login con users de Payload (admin/staff).
- Sesion segura para la web.

Implementacion recomendada:

- Usar auth de Payload y cookies httpOnly/secure.
- Middleware para proteger rutas de app privada.
- Crear seed inicial de usuario admin en primer arranque si no existe.

Compatibilidad con flujo actual:

- Puedes mantener temporalmente un route handler `/api/login` que envuelva el login de Payload para no reescribir todo el front de una vez.

---

## 7) Endpoints custom minimos a mantener

Como el foco es backend y continuidad funcional, mantener:

1. GET /api/configuraciones/precios

- Devuelve objeto de precios ya normalizado

2. POST /api/configuraciones/upsert

- upsert por clave/valor

3. GET /api/configuraciones/logo

- devuelve URL publica del logo

4. POST /api/configuraciones/logo

- sube logo a Vercel Blob y guarda relacion en configuraciones

No prioritario:

- export excel de logs
- historico de logs del sistema

---

## 8) Migracion de datos (sin logs)

Orden recomendado:

1. configuraciones (precios y logo)
2. clientes
3. pagos

Estrategia:

- Script TypeScript idempotente.
- Mapa oldId -> newId para relacion pagos.cliente.
- Modo dry-run y modo apply.
- Validacion final de conteos:
  - clientes origen = clientes destino
  - pagos origen = pagos destino
  - todas las relaciones pago->cliente validas

Sobre logo:

- Si existe URL/archivo en Strapi, descargar y re-subir a media en Payload con Vercel Blob.

---

## 9) Neon + Vercel + Blob (hard requirements)

Variables de entorno esperadas:

- POSTGRES_URL o DATABASE_URI (Neon)
- PAYLOAD_SECRET
- NEXT_PUBLIC_APP_URL
- BLOB_READ_WRITE_TOKEN

Checklist deploy:

1. Crear DB en Neon.
2. Vincular Neon con Vercel project.
3. Configurar env vars en Preview y Production.
4. Ejecutar schema/migrations de Payload.
5. Verificar upload de logo y lectura publica.
6. Verificar login admin/staff en produccion.

---

## 10) Fases de ejecucion (backend-first)

### Fase 0 - Scaffold

- Crear proyecto Next + Payload + TypeScript.
- Configurar Neon y Blob.

### Fase 1 - Data model

- Implementar users, clientes, pagos, configuraciones, media.
- Validaciones y enums.

### Fase 2 - Business logic

- Helper de precios.
- Hook create cliente -> pago automatico.
- (Opcional) hooks de logs.

### Fase 3 - Custom APIs

- configuraciones/precios
- configuraciones/upsert
- configuraciones/logo (GET/POST)

### Fase 4 - Data migration

- Script Strapi -> Payload para configuraciones/clientes/pagos.
- Dry-run + apply + validaciones.

### Fase 5 - Seguridad y release

- Auth payload con roles admin/staff.
- Middleware de proteccion.
- Deploy en Vercel.

Frontend (fuera de alcance principal):

- Solo adaptar consumo de API y reemplazar Chakra por shadcn cuando te convenga.

---

## 11) Definition of Done (enfocada a lo que te importa)

Listo cuando:

- Schemas de clientes/pagos/configuraciones existen en Payload y respetan la logica actual.
- Pago automatico al crear cliente funciona igual que en Strapi.
- Auth con users de Payload funciona para admin/staff.
- Configuracion de precios y logo funciona con Neon + Blob.
- Datos de clientes y pagos migrados con relaciones integras.
- App desplegada en Vercel sin depender de Strapi.

---

## 12) Prompt actualizado para pegar a Copilot (nuevo chat)

"""
Quiero migrar mi sistema desde Strapi a Next + Payload con enfoque backend-first.

Condiciones cerradas:

- TypeScript.
- Campos en camelCase.
- Auth nativo de Payload.
- Roles: admin y staff.
- DB: Postgres con Neon (Vercel Integration).
- Media: Vercel Blob.
- No quiero migrar logs historicos ni priorizar reportes de logs.

Objetivo principal:

- No perder schemas ni logica actual de Strapi (clientes, pagos, configuraciones y hooks de negocio).

Instrucciones:

1. Primero resume el plan y lista dudas criticas.
2. Implementa por fases backend:
   - modelo de datos
   - hooks de negocio
   - endpoints custom de configuraciones
   - script de migracion de datos sin logs
   - auth y permisos admin/staff
3. Mantener regla de pago automatico al crear cliente.
4. Ejecutar lint/build por fase y reportar resultados.
5. Al final, entregar checklist de deploy en Vercel.

Empieza por crear el scaffold de Next + Payload en TypeScript y luego define las colecciones.
"""

---

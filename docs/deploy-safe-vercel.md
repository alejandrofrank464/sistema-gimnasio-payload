# Deploy seguro en Vercel (Payload + PostgreSQL)

Este proyecto incluye un flujo seguro para evitar errores de schema en producción.

## Script recomendado

Usa este script en Vercel como Build Command:

```bash
pnpm run build:vercel:safe
```

Este comando ejecuta, en orden:

1. `db:check` valida que exista `POSTGRES_URL` o `DATABASE_URL`.
2. `db:migrate:status` revisa el estado de migraciones.
3. `db:migrate` aplica migraciones pendientes (no destructivo).
4. `build` compila la app.

## Configuración en Vercel

1. Ve a Project Settings > Build & Development Settings.
2. En Build Command usa: `pnpm run build:vercel:safe`.
3. Verifica Variables de Entorno en Production:
   - `PAYLOAD_SECRET`
   - `POSTGRES_URL` (recomendado)
   - `BLOB_READ_WRITE_TOKEN` (si usas media en Vercel Blob)

## Flujo de cambios de schema

Cuando cambies colecciones o campos en Payload:

1. Crea migración en tu rama:
   ```bash
   pnpm payload migrate:create nombre-del-cambio
   ```
2. Prueba localmente:
   ```bash
   pnpm run db:migrate
   ```
3. Haz commit del código y de la migración.
4. Merge a `main`.
5. Vercel aplicará migraciones antes de compilar.

## Checklist de PR (schema)

- [ ] El PR incluye archivo(s) de migración si hubo cambio de schema.
- [ ] Se probó `pnpm run db:migrate` en entorno local o staging.
- [ ] No se usan comandos destructivos (`migrate:fresh`, `migrate:reset`) para producción.
- [ ] El cambio es backward compatible o tiene plan de migración de datos.
- [ ] `POSTGRES_URL` de producción apunta a la base correcta.
- [ ] Existe backup/snapshot reciente en el proveedor de DB (por ejemplo Neon).

## Comandos peligrosos en producción

No ejecutar en producción:

- `pnpm payload migrate:fresh`
- `pnpm payload migrate:reset`
- scripts de limpieza de DB (`db:clean`, `db:clean:all`)

Estos comandos pueden borrar o recrear datos.

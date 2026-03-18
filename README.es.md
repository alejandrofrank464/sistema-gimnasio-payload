# Sistema de Gestión para Gimnasio

[![Next.js](https://img.shields.io/badge/Next.js-15-111827?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Payload CMS](https://img.shields.io/badge/Payload-3-000000)](https://payloadcms.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-2563eb?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-06b6d4?logo=react&logoColor=white)](https://react.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-ef4444)](https://tanstack.com/query/latest)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba63?logo=playwright&logoColor=white)](https://playwright.dev/)

Aplicación fullstack orientada a negocio para gestionar la operación diaria de un gimnasio: clientes, pagos, configuración y trazabilidad de acciones.

Construida con un enfoque backend-first, reglas de negocio explícitas y arquitectura preparada para producción.

## Resumen para Recruiters

Este proyecto demuestra:

- Modelado de dominio real con reglas de negocio no triviales.
- Implementación de CMS headless con autenticación y control por roles (`admin`, `staff`).
- Desarrollo end-to-end con TypeScript en backend y frontend.
- Arquitectura preparada para migración/evolución de sistemas legacy.
- Buenas prácticas de ingeniería: tipos generados, tests de integración, E2E y scripts de seed.

## Preview

<table align="center">
  <tr>
    <td align="center"><b>Dashboard</b></td>
    <td align="center"><b>Clientes</b></td>
    <td align="center"><b>Pagos</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/dashboard-general.png" width="300" alt="Dashboard"></td>
    <td><img src="docs/screenshots/clientes-crud.png" width="300" alt="Clientes"></td>
    <td><img src="docs/screenshots/pagos-crud.png" width="300" alt="Pagos"></td>
  </tr>
</table>

<table align="center">
  <tr>
    <td align="center"><b>Horario</b></td>
    <td align="center"><b>Configuración</b></td>
    <td align="center"><b>Logs</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/horario-turnos.png" width="300" alt="Horario"></td>
    <td><img src="docs/screenshots/configuraciones.png" width="300" alt="Configuración"></td>
    <td><img src="docs/screenshots/logs-auditoria.png" width="300" alt="Logs"></td>
  </tr>
</table>

## Highlights

- CRUD completo de clientes con historial de pagos.
- CRUD completo de pagos mensuales con filtros por mes/año.
- Generación automática del pago inicial al crear cliente.
- Validación anti-duplicado (`cliente + mes + año`).
- Vista de horario por turnos basada en pagos activos del mes.
- Configuración de precios y logo del gimnasio.
- Logs operativos por entidad y acción.

## Setup Corto

```bash
pnpm install
cp .env.example .env
pnpm generate:types
pnpm dev
```

Scripts opcionales:

- `pnpm seed:demo`
- `pnpm seed:demo:reset`
- `pnpm test:int`
- `pnpm test:e2e`

## Stack Base

- Next.js 15 + React 19
- Payload CMS 3
- TypeScript
- TanStack Query
- Tailwind CSS + componentes reutilizables
- SQLite (default local) / compatible con PostgreSQL
- Vercel Blob para media
- Vitest + Playwright

## Arquitectura

```mermaid
flowchart LR
  A[Usuarios Admin/Staff] --> B[UI Next.js App Router]
  B --> C[Colecciones Payload]
  C --> D[Hooks de Negocio]
  D --> E[(SQLite o PostgreSQL)]
  C --> F[Endpoints custom de configuración]
  C --> G[Media en Vercel Blob]
```

## Notes

- Variables clave: `PAYLOAD_SECRET`, `DATABASE_URL`, `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`.
- La app corre localmente con SQLite por defecto.
- Objetivo de despliegue a producción: **Vercel + Neon + Vercel Blob**.
- Se requiere internet para usar servicios gestionados externos.

## Demo

- URL pública: [PENDIENTE]
- Credenciales demo:
  - Admin: [PENDIENTE]
  - Staff: [PENDIENTE]

## Endpoints de Configuración

- `GET /api/configuraciones/precios`
- `POST /api/configuraciones/upsert`
- `GET /api/configuraciones/logo`
- `POST /api/configuraciones/logo`

## English Version

Read in English: `README.md`

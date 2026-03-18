# Gym Management System

[![Next.js](https://img.shields.io/badge/Next.js-15-111827?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Payload CMS](https://img.shields.io/badge/Payload-3-000000)](https://payloadcms.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-2563eb?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-06b6d4?logo=react&logoColor=white)](https://react.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-ef4444)](https://tanstack.com/query/latest)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba63?logo=playwright&logoColor=white)](https://playwright.dev/)

Business-oriented fullstack app designed to run a gym operation end-to-end: clients, payments, settings, and operational logs.

Built with a backend-first mindset, explicit business rules, and a clean architecture ready for production.

## Recruiter Snapshot

This project showcases:

- Real-world domain modeling with non-trivial business rules.
- Headless CMS implementation with authentication and role-based access (`admin`, `staff`).
- End-to-end TypeScript delivery across backend and frontend.
- Migration-ready architecture for evolving legacy systems.
- Engineering quality practices: generated types, integration tests, E2E tests, and seed scripts.

## Preview

<table align="center">
  <tr>
    <td align="center"><b>Dashboard</b></td>
    <td align="center"><b>Clients</b></td>
    <td align="center"><b>Payments</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/dashboard-general.png" width="300" alt="Dashboard"></td>
    <td><img src="docs/screenshots/clientes-crud.png" width="300" alt="Clients"></td>
    <td><img src="docs/screenshots/pagos-crud.png" width="300" alt="Payments"></td>
  </tr>
</table>

<table align="center">
  <tr>
    <td align="center"><b>Schedule</b></td>
    <td align="center"><b>Settings</b></td>
    <td align="center"><b>Logs</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/horario-turnos.png" width="300" alt="Schedule"></td>
    <td><img src="docs/screenshots/configuraciones.png" width="300" alt="Settings"></td>
    <td><img src="docs/screenshots/logs-auditoria.png" width="300" alt="Logs"></td>
  </tr>
</table>

## Highlights

- Full CRUD for clients with payment history.
- Full CRUD for monthly payments with month/year filtering.
- Automatic initial payment generation when a client is created.
- Anti-duplicate payment validation (`client + month + year`).
- Shift schedule view powered by active monthly payments.
- Business settings for pricing and brand logo.
- Operational logs by entity and action.

## Short Setup

```bash
pnpm install
cp .env.example .env
pnpm generate:types
pnpm dev
```

Optional scripts:

- `pnpm seed:demo`
- `pnpm seed:demo:reset`
- `pnpm test:int`
- `pnpm test:e2e`

## Base Stack

- Next.js 15 + React 19
- Payload CMS 3
- TypeScript
- TanStack Query
- Tailwind CSS + reusable UI components
- SQLite (local default) / PostgreSQL compatible
- Vercel Blob storage for media
- Vitest + Playwright

## Notes

- Core envs: `PAYLOAD_SECRET`, `DATABASE_URL`, `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`.
- The app runs locally with SQLite by default.
- Planned production deployment target: **Vercel + Neon + Vercel Blob**.
- Internet is required when using external storage or managed database services.

## Demo

- Live URL: [PENDING]
- Demo credentials:
  - Admin: [PENDING]
  - Staff: [PENDING]

## API Endpoints (Configuration)

- `GET /api/configuraciones/precios`
- `POST /api/configuraciones/upsert`
- `GET /api/configuraciones/logo`
- `POST /api/configuraciones/logo`

## Spanish Version

Read in Spanish: `README.es.md`

# Gym Management System

[![Next.js](https://img.shields.io/badge/Next.js-15-111827?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Payload CMS](https://img.shields.io/badge/Payload-3-000000)](https://payloadcms.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-2563eb?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-ef4444)](https://tanstack.com/query/latest)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba63?logo=playwright&logoColor=white)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Business-oriented fullstack app designed to run a gym operation end-to-end: clients, payments, settings, and operational logs. Built with a backend-first mindset, explicit business rules, and a clean architecture ready for production.

> 🚀 **[Live Demo](#)** · 📖 **[Versión en Español](README.es.md)**

---

## Preview

<table>
  <tr>
    <td align="center"><b>Dashboard</b></td>
    <td align="center"><b>Clients</b></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/cd9c2d8b-4e00-41ad-a028-eaa82607b7cf" width="400" alt="Dashboard"></td>
    <td><img src="https://github.com/user-attachments/assets/e1f04330-d1be-48b1-b4dd-cc1699b5c3cc" width="400" alt="Clients list"></td>
  </tr>
  <tr>
    <td align="center"><b>Payments</b></td>
    <td align="center"><b>Shift Schedule</b></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/0aecd918-802f-491c-b46a-bd7fa5dc3f6b" width="400" alt="Payments"></td>
    <td><img src="https://github.com/user-attachments/assets/1c69311c-3bb3-49e5-96fa-4338daeea098" width="400" alt="Shift Schedule"></td>
  </tr>
</table>

---

## What it does

A complete gym management system covering the full operational loop:

- **Client management** — Full CRUD with payment history per client.
- **Payment management** — Monthly payments with month/year filtering and anti-duplicate validation (`client + month + year`).
- **Automatic payment generation** — Initial payment is created automatically when a new client is registered.
- **Shift schedule** — Visual schedule view powered by active monthly payments.
- **Business settings** — Configure pricing and upload your gym's brand logo.
- **Operational logs** — Audit trail organized by entity and action type.

---

## Architecture

```mermaid
flowchart LR
  A[Users Admin/Staff] --> B[Next.js App Router UI]
  B --> C[Payload Collections]
  C --> D[Business Hooks]
  D --> E[(SQLite or PostgreSQL)]
  C --> F[Custom Config API Endpoints]
  C --> G[Vercel Blob Media]
```

## Key Engineering Decisions

- **End-to-end TypeScript** across backend and frontend with generated types from Payload's schema.
- **Headless CMS as backend** — Payload CMS handles auth, collections, and REST endpoints, removing boilerplate while keeping full control over business logic.
- **Explicit business rules** — Anti-duplicate payment validation and automatic payment generation are enforced at the collection hook level, not in the UI.
- **Migration-ready architecture** — SQLite locally, PostgreSQL in production. Switching requires only an env var change.
- **Engineering quality practices** — Generated types, integration tests (Vitest), E2E tests (Playwright), and seed scripts for reproducible demo environments.

---

## Stack

| Layer                 | Technology                              |
| --------------------- | --------------------------------------- |
| Framework             | Next.js 15 + React 19                   |
| CMS / Backend         | Payload CMS 3                           |
| Language              | TypeScript 5.7                          |
| Data fetching         | TanStack Query v5                       |
| Styling               | Tailwind CSS + reusable UI components   |
| Database (local)      | SQLite                                  |
| Database (production) | PostgreSQL (Neon)                       |
| Media storage         | Vercel Blob                             |
| Testing               | Vitest (integration) + Playwright (E2E) |
| Deployment target     | Vercel                                  |

---

## Quick Setup

```bash
pnpm install
cp .env.example .env
pnpm generate:types
pnpm dev
```

### Environment Variables

| Variable                | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `PAYLOAD_SECRET`        | Secret key for Payload CMS session signing               |
| `DATABASE_URL`          | SQLite path for local development (e.g. `file:./gym.db`) |
| `POSTGRES_URL`          | PostgreSQL connection string for production              |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for media uploads                      |

> The app runs with SQLite by default. Set `POSTGRES_URL` and switch the db adapter for production deployment.

### Optional Scripts

```bash
pnpm seed:demo          # Populate with demo data
pnpm seed:demo:reset    # Reset and re-seed
pnpm test:int           # Run integration tests (Vitest)
pnpm test:e2e           # Run E2E tests (Playwright)
```

---

## API Reference

### Settings

| Method | Endpoint                       | Description                       |
| ------ | ------------------------------ | --------------------------------- |
| `GET`  | `/api/configuraciones/precios` | Get current pricing configuration |
| `POST` | `/api/configuraciones/upsert`  | Create or update settings         |
| `GET`  | `/api/configuraciones/logo`    | Get gym logo                      |
| `POST` | `/api/configuraciones/logo`    | Upload gym logo                   |

> Additional endpoints for clients, payments, and logs are exposed automatically by Payload CMS's REST API at `/api/[collection]`.

---

## Deployment

Planned production stack: **Vercel + Neon (PostgreSQL) + Vercel Blob**.

1. Set `POSTGRES_URL` and switch the database adapter in `payload.config.ts`.
2. Configure `BLOB_READ_WRITE_TOKEN` for media uploads.
3. Deploy to Vercel — the app is fully compatible with serverless environments.

For a safe migration-first flow on every deploy, see [docs/deploy-safe-vercel.md](docs/deploy-safe-vercel.md).

---

## License

[MIT](LICENSE)

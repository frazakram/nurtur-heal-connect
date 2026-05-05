# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on port 8080
npm run build        # Production build (Vite)
npm run build:dev    # Development build mode
npm run lint         # ESLint
npm run test         # Run tests (Vitest)
npm run test:watch   # Tests in watch mode
npm run preview      # Preview production build
```

## Architecture

**React 18 + TypeScript SPA** built with Vite. Backend is Supabase (PostgreSQL). Path alias `@/` maps to `src/`.

### Routing (App.tsx)

Two route trees:
- **Public** (`/`, `/about`, `/services`, `/doctors`, `/blog`, `/contact`, `/portal`) — wrapped in `<Layout>` with Navbar/Footer
- **Admin** (`/admin/*`) — wrapped in `<AdminLayout>` with sidebar nav; protected by `<Protected>` which checks `AuthContext`

### State Management

- **`AuthContext`** (`src/admin/context/AuthContext.tsx`): Admin session, roles (`admin`, `receptionist`, `assistant`), and permission checks
- **`HospitalContext`** (`src/admin/context/HospitalContext.tsx`): Central store for all hospital data — patients, appointments, beds, staff, billing, expenses, inventory, blog posts. Fetches from Supabase and exposes CRUD actions
- **TanStack React Query**: Used for server-state caching alongside the context

### Database Layer

Supabase client is in `src/lib/supabase.ts`. The file `src/admin/utils/dbMap.ts` handles mapping between snake_case DB columns and camelCase frontend interfaces — any new Supabase table integration should go through this mapping pattern.

Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`).

### UI Components

- `src/components/ui/` — shadcn/ui components (Radix UI primitives). Add new ones with the shadcn CLI.
- `src/admin/components/` — admin-specific layout, `DataTable`, `StatCard`, `ConfirmDialog`, `Protected`
- Forms use React Hook Form + Zod validation

### Design System

Defined in `src/index.css` using CSS HSL variables. Department-specific color tokens: `--gyn-*` (pink, gynecology) and `--peds-*` (yellow, pediatrics). Dark mode is class-based (`.dark`). Tailwind config extends these tokens — prefer CSS variables over hardcoded colors.

### Access Control

`src/admin/access.ts` defines what each role can do. Check this before building any new admin feature that should be permission-gated.

## Key Domain Concepts

This is a two-department hospital (Gynecology + Pediatrics):
- **IPD/OPD** — in-patient vs out-patient distinction used throughout patient records
- **Bed management** — wards: Maternity Ward, Private Rooms (gyn), NICU, Pediatrics Ward (peds)
- **Staff roles** — Doctor, Nurse, Receptionist, Lab Tech (separate from auth roles)
- **Billing** — item-level invoice tracking per patient

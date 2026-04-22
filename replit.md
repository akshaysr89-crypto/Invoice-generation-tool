# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Invoice Decision Tool

A full-stack invoice risk assessment and approval tool.

### Features
- Invoice submission form with vendor name, amount, dates, payment terms, vendor history
- Automated risk scoring engine with configurable thresholds:
  - Amount > $500,000 = High risk flag
  - Due date < 7 days = Urgent flag
  - First-time vendor = Medium risk flag
  - Flagged vendor = Auto-rejected
- PostgreSQL database (via Drizzle ORM) persists all invoices and decisions
- Admin dashboard with stats: total, approved, rejected, review-required, risk breakdown
- Risk level badges: Low (green), Medium (amber), High (red)
- Decision badges: Approved, Rejected, Review Required

### Structure
- **Frontend**: `artifacts/invoice-tool/` (React + Vite, Wouter router)
  - `/` — Invoice submission form with decision result card
  - `/admin` — Admin dashboard with stats and invoice table
- **Backend**: `artifacts/api-server/src/routes/invoices.ts`
- **Risk scoring**: `artifacts/api-server/src/lib/riskScoring.ts`
- **DB schema**: `lib/db/src/schema/invoices.ts`
- **API spec**: `lib/api-spec/openapi.yaml`

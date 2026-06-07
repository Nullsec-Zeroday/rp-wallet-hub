# RPWallet Platform

This folder contains the new platform rebuild, separate from the legacy single-app Next.js Phantom clone in the repository root.

## Planned workspace layout

- `apps/hub`: Next.js hub for auth, dashboard, and wallet launch
- `apps/api`: Hono API for auth, wallet data, and simulated transactions
- `apps/phantom`: Ionic React Phantom wallet app
- `apps/trust`: Ionic React Trust wallet app
- `packages/types`: shared DTOs and domain types
- `packages/auth`: shared auth helpers and session utilities
- `packages/api-client`: shared API client
- `packages/wallet-core`: shared wallet domain logic
- `packages/config`: shared config and environment helpers

## Status

The first runnable slice is in place:

- Hono API with local in-memory auth/session/license/wallet-bootstrap flow
- Next.js hub with license activation and wallet launch actions
- Ionic React shells for Phantom and Trust
- Shared TypeScript contracts, API client, wallet registry, and Drizzle schema package

## Local development

Install dependencies:

```bash
npm install
```

Run individual services:

```bash
npm run dev:api
npm run dev:hub
npm run dev:phantom
npm run dev:trust
```

Local URLs:

- API: `http://localhost:8787`
- Hub: `http://localhost:3000`
- Phantom: `http://localhost:5173`
- Trust: `http://localhost:5174`

Check types:

```bash
npm run typecheck
```

## Next implementation target

The API now supports both in-memory local development and Neon-backed persistence when `DATABASE_URL` is provided to the Worker environment.

To prepare the database:

```bash
npm run db:generate
npm run db:push
```

For local Worker persistence, create `apps/api/.dev.vars` from `apps/api/.dev.vars.example` and add `DATABASE_URL`.

Next target: add the first server-first wallet transaction endpoints.

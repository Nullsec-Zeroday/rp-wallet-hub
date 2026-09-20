# RPWallet Platform — Base44 dev notes

## Architecture

npm workspaces monorepo. The user-facing entry point is the **hub** (`apps/hub`, Next.js 16, port 3000).

- `apps/hub` — Next.js marketing site + dashboard. Proxies all API calls through the server-side route `app/api/rp/[...path]/route.ts` (single-origin wiring). The proxy target is `API_PROXY_TARGET_URL` (defaults to `http://localhost:8787`).
- `apps/api` — Hono API running on Cloudflare Workers via `wrangler dev` (port 8787). Reads non-secret defaults from `apps/api/wrangler.jsonc`. Falls back to **in-memory storage** when `DATABASE_URL` is absent, so it boots with no external credentials.
- `apps/affiliate` (Next.js, 3001), `apps/phantom` / `apps/trust` (Ionic Vite, 5173/5174) — not required for the port-3000 preview; not run by the Base44 compose.

## How the hub talks to the API

The browser calls `/api/rp/*` on the hub (same origin); the hub proxies to the internal `api` service. `NEXT_PUBLIC_API_BASE_URL` is intentionally **unset** so the client uses the same-origin proxy. CORS is a non-issue because the proxy hop is server-side.

## Running here (docker-compose.base44.yml)

- `install` — one-shot `npm install` at the repo root (installs all workspace deps into the bind mount).
- `api` — `npm run dev:api -- --ip 0.0.0.0` (wrangler dev, internal only).
- `hub` — `npm run dev:hub -- --hostname 0.0.0.0`, host port 3000. `API_PROXY_TARGET_URL=http://api:8787`.

## Env / secrets

Nothing is required to boot — the API runs in-memory and all external integrations degrade gracefully when their keys are absent. Optional external credentials (Neon `DATABASE_URL`, Resend, CoinGecko, NOWPayments, SellAuth webhook secret, referral signing secret) are listed in `.base44/environment.json` and delivered via `/run/base44/app.env` when the user provides them.

## Verifying it works

- `curl http://localhost:3000/` returns the marketing page (HTML).
- `curl http://localhost:3000/api/rp/health` proxies to the API and returns `{"ok":true,"service":"rp-wallet-api","storage":"memory"}`.
- Dashboard / license activation flows exercise the in-memory store.

## Quirks

- Next.js dev uses `--webpack` (not Turbopack) per the project's dev script.
- `apps/hub/next.config.ts` adds `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can load dev assets/HMR.
- `apps/api/proxy.ts` is a Next.js middleware (robots/canonical), unrelated to the API proxy route.

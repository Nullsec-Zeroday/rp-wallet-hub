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

## SellAuth card checkout

The buy page offers crypto through NOWPayments and card payments through the same SellAuth embed used by the sibling `rp-wallet-nextjs` project. Whop is configured as the payment method in SellAuth; the app does not select a gateway itself.

```bash
# apps/hub build environment
NEXT_PUBLIC_SELLAUTH_SHOP_ID=253501
NEXT_PUBLIC_SELLAUTH_STARTER_PRODUCT_ID=796131
NEXT_PUBLIC_SELLAUTH_STARTER_VARIANT_ID=1356114
NEXT_PUBLIC_SELLAUTH_MONTHLY_PRODUCT_ID=796135
NEXT_PUBLIC_SELLAUTH_MONTHLY_VARIANT_ID=1356121
NEXT_PUBLIC_SELLAUTH_YEARLY_PRODUCT_ID=796138
NEXT_PUBLIC_SELLAUTH_YEARLY_VARIANT_ID=1356127

# apps/api Worker environment
SELLAUTH_WEBHOOK_SECRET=
SELLAUTH_SHOP_ID=253501
SELLAUTH_STARTER_PRODUCT_ID=796131
SELLAUTH_MONTHLY_PRODUCT_ID=796135
SELLAUTH_YEARLY_PRODUCT_ID=796138
```

No SellAuth API key, gateway, or payment-method environment variable is needed for checkout. The embed uses SellAuth's ALTCHA verification and redirects the current page to the hosted checkout, matching the sibling project's iOS flow. Enable Whop on the corresponding products/variants in the SellAuth dashboard.

Configure every SellAuth product/variant for Dynamic Delivery with this production callback URL:

```text
https://api.rpwallet.us/webhooks/sellauth
```

Use the webhook secret from SellAuth Storefront → Configure → Miscellaneous as `SELLAUTH_WEBHOOK_SECRET`. The callback must return plain text; this API returns the generated RPWallet license key and safely reuses it when SellAuth retries delivery.

## Next implementation target

The API now supports both in-memory local development and Neon-backed persistence when `DATABASE_URL` is provided to the Worker environment.

To prepare the database:

```bash
npm run db:generate
npm run db:push
```

For local Worker persistence, create `apps/api/.dev.vars` from `apps/api/.dev.vars.example` and add `DATABASE_URL`.

Next target: add the first server-first wallet transaction endpoints.

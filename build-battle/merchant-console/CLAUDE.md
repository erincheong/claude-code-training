# Northwind Payments — Merchant Console

The internal tool support and ops staff use to look up a payment, refund it, work the dispute queue, and issue virtual cards.

Northwind Payments is fictional. Every merchant, cardholder, amount, and card in this app is generated.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. No database, no seed step, no Docker.

## Commands

```bash
npm run dev                            # dev server, :3000
npm run build                          # production build
npm run lint                           # eslint (next/core-web-vitals)
npm test                               # vitest run, once
npm run test:watch                     # vitest, watch mode
npx vitest run src/lib/money.test.ts   # a single test file
```

Vitest runs in a plain Node environment (no jsdom), scoped to `src/**/*.test.ts`. Today that's the money, date, and CSV helpers in `src/lib/` only — components and route handlers aren't unit-tested, so verify those by hand in the running app.

## Architecture

Request flow for payments is the pattern every list-and-filter feature here follows:

1. `src/data/generate.ts` builds the seed data once; `src/data/store.ts` holds it on `globalThis` so Next's dev-server module reloading doesn't hand every request a fresh copy.
2. `src/data/queries.ts` is the one query builder: `parseFilters` turns raw `URLSearchParams` into an allowlisted `PaymentFilters`, then `filterPayments` → `sortPayments` → `paginate` compose into `queryPayments`. Anything that lists, filters, or exports payments calls into this file rather than reading `store.payments` directly — see `src/app/api/payments/route.ts` and `src/app/api/payments/export/route.ts` for the two current callers.
3. Route handlers under `src/app/api/` stay thin: parse filters, call the query builder, return JSON (or CSV). They don't touch `src/data/store.ts` directly.
4. Pages under `src/app/` fetch from those routes rather than importing `src/data/` themselves.

## Data lives in memory

Seed data is JSON, loaded into a store module at boot. Route handlers read and write that store.

- Writes last for the life of the dev server and vanish on restart. That is expected.
- Persistence is tracked separately as NWP-203. **Do not add a database, an ORM, or migrations.**
- If you need more seed data, add it to the JSON. Never edit seed data to make a failing case disappear.

## Where the rest of the context lives

This file loads every session, so it stays short. Detail that only matters once you open a particular kind of file lives in `.claude/rules/` and loads when you do:

| Rule | Applies to |
| --- | --- |
| `money.md` | `src/lib/`, `src/app/api/`, `src/data/` |
| `api-routes.md` | `src/app/api/` |
| `cards.md` | anything card-related |
| `components.md` | `src/components/`, `src/app/` |

## Conventions

These four explain most of the code, and breaking them is how bugs get in here.

1. **Money is integer minor units.** `$250.00` is `25000`. No floats, no strings with currency symbols. Format once, at the edge, next to its currency code.
2. **Storage and bucketing are UTC.** Display converts to the merchant's timezone. Nothing else does.
3. **One query builder.** Payment filtering goes through the builder behind `GET /api/payments`. A second implementation is a bug, not a shortcut.
4. **Validate on the server.** Anything from the client — column names, currencies, limits, statuses — is checked against an allowlist before it reaches a query, a filename, or the store.

## Card rules

- Generated numbers use the `4242` test BIN and a valid Luhn check digit. Nothing here may resemble a real PAN.
- The full number is returned exactly once, in the creation response. After that, last four only.
- Status is a state machine: `active ⇄ frozen`, either to `cancelled`, and `cancelled` is terminal.

## Layout

| Path | What lives there |
| --- | --- |
| `src/app/` | Console routes: overview, payments, disputes, payouts. Cards is NWP-201 and does not exist yet |
| `src/app/api/` | Route handlers |
| `src/data/` | Seed JSON, the in-memory store, `queries.ts` (the query builder), and types |
| `src/components/` | Tremor-based primitives and the console's own components |
| `src/lib/` | Money, date, and CSV helpers, each with a `.test.ts` beside it. Read these before touching an amount |

## Release Standards

- All changes need test evidence before merging.
- No direct commits to `main`.
- Every PR must include a one-line business impact summary.

## Before you push

Run `npm test`, then `/ship-ready`. The skill checks the rules above, not just formatting.

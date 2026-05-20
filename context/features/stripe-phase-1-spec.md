# Stripe Integration Phase 1 — Core Infrastructure

## Overview

Install the Stripe SDK, extend the session with `isPro`, update the JWT callback to always sync `isPro` from the database, add free-tier limit constants, and extract a testable `usage-limits` module with unit tests. No webhooks, no UI, no Stripe Dashboard work — pure infrastructure that Phase 2 builds on top of.

## Requirements

- Install `stripe` npm package
- Create `src/lib/stripe.ts` — Stripe client singleton
- Add `isPro: boolean` to `src/types/next-auth.d.ts` session type
- Update `src/auth.ts` JWT + session callbacks to always sync and expose `isPro`
- Add `FREE_ITEMS_LIMIT = 50` and `FREE_COLLECTIONS_LIMIT = 3` to `src/lib/constants.ts`
- Create `src/lib/usage-limits.ts` with `checkItemLimit` and `checkCollectionLimit` helpers
- Write unit tests for `src/lib/usage-limits.ts`

## Files to Create

1. `src/lib/stripe.ts` — Stripe singleton
2. `src/lib/usage-limits.ts` — pure DB helpers for limit checks
3. `src/lib/__tests__/usage-limits.test.ts` — unit tests with mocked Prisma

## Files to Modify

1. `src/types/next-auth.d.ts` — add `isPro: boolean` to `Session.user`
2. `src/auth.ts` — update JWT callback (sync isPro from DB) and session callback (expose it)
3. `src/lib/constants.ts` — add free tier limits

## Code Reference

See `docs/stripe-integration-plan.md` for the exact code for each change.

### `src/lib/stripe.ts`

```typescript
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})
```

### `src/lib/usage-limits.ts`

```typescript
import { prisma } from "@/lib/prisma"
import { FREE_ITEMS_LIMIT, FREE_COLLECTIONS_LIMIT } from "@/lib/constants"

export async function checkItemLimit(
  userId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const count = await prisma.item.count({ where: { userId } })
  return { allowed: count < FREE_ITEMS_LIMIT, count, limit: FREE_ITEMS_LIMIT }
}

export async function checkCollectionLimit(
  userId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const count = await prisma.collection.count({ where: { userId } })
  return { allowed: count < FREE_COLLECTIONS_LIMIT, count, limit: FREE_COLLECTIONS_LIMIT }
}
```

### JWT callback changes in `src/auth.ts`

```typescript
jwt: async ({ token, user }) => {
  if (user) token.id = user.id

  // Always sync isPro from DB so webhook updates are reflected on next session read
  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { isPro: true },
    })
    token.isPro = dbUser?.isPro ?? false
  }

  return token
},
session: async ({ session, token }) => {
  session.user.id = token.id as string
  session.user.isPro = token.isPro as boolean
  return session
},
```

## Unit Tests

`src/lib/__tests__/usage-limits.test.ts` should test:

- `checkItemLimit`: returns `allowed: true` when count < 50, `allowed: false` when count >= 50
- `checkCollectionLimit`: returns `allowed: true` when count < 3, `allowed: false` when count >= 3
- returns correct `count` and `limit` values in all cases

Mock `prisma.item.count` and `prisma.collection.count` via `vi.mock("@/lib/prisma")` following the existing test patterns in the codebase (see `src/actions/__tests__/`).

## Key Notes

- The JWT callback adds one `SELECT isPro` query per session validation. This is intentional — it's the simplest way to ensure webhook-triggered `isPro` changes are picked up on the next page load without any client-side `update()` call.
- `usage-limits.ts` accepts a `userId` with no auth logic — keeping it a pure DB layer makes it straightforward to mock in tests and reuse in both server actions and API routes.
- `STRIPE_SECRET_KEY` is already in `.env`. No new env vars needed for Phase 1.

## Testing

- `npm run test:run` — all usage-limits tests pass
- `npm run build` — no TypeScript errors (especially around `session.user.isPro`)
- Manual check: sign in → open a server component that reads `session.user.isPro` → no TS error, value is `false`
- DB check: set `isPro = true` directly in DB → reload any page → `session.user.isPro` is `true`

## Branch

`feature/stripe-phase-1`

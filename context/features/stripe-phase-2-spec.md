# Stripe Integration Phase 2 — Webhooks, Feature Gating & Billing UI

## Overview

Wire up the complete Stripe subscription flow: webhook handler, checkout + billing portal server actions, Pro gates on uploads and item/collection creation, and a billing page. Requires the Stripe CLI running locally for end-to-end testing.

**Prerequisite:** Phase 1 (`feature/stripe-phase-1`) must be merged before starting this phase.

## Requirements

### Stripe Dashboard (do this before writing code)
- Verify the two price IDs in `.env` exist in the Stripe Dashboard
- Create a webhook endpoint pointing to `/api/webhooks/stripe` and subscribe to four events
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in `.env`
- Enable the Customer Portal under Settings → Billing

### Code
- Create `src/app/api/webhooks/stripe/route.ts` — verify Stripe signature, handle subscription lifecycle events
- Create `src/actions/subscriptions.ts` — `createCheckoutSession(priceId)` and `createBillingPortalSession()`
- Add Pro gate to `src/app/api/upload/route.ts` — block file/image uploads for free users
- Add free-tier limit check to `createItem` in `src/actions/items.ts` (use `usage-limits.ts`)
- Add free-tier limit check to `createCollection` in `src/actions/collections.ts` (use `usage-limits.ts`)
- Create `src/app/billing/page.tsx` — Server Component, fetches user plan + usage counts
- Create `src/components/billing/BillingContent.tsx` — Client Component, pricing cards + form submissions
- Add "Billing" link to sidebar user dropdown

## Files to Create

1. `src/app/api/webhooks/stripe/route.ts`
2. `src/actions/subscriptions.ts`
3. `src/app/billing/page.tsx`
4. `src/components/billing/BillingContent.tsx`

## Files to Modify

1. `src/app/api/upload/route.ts` — add Pro gate after auth check
2. `src/actions/items.ts` — add limit check + file/image Pro gate using `usage-limits.ts`
3. `src/actions/collections.ts` — add limit check using `usage-limits.ts`
4. Sidebar user dropdown — add "Billing" link to `/billing`
5. `.env` — set `STRIPE_WEBHOOK_SECRET`

## Code Reference

See `docs/stripe-integration-plan.md` for the full code for every change.

### Webhook events to subscribe

```
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

### Feature gate pattern in server actions

```typescript
// In createItem / createCollection, after auth check:
const dbUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
})
if (!dbUser?.isPro) {
  const { allowed } = await checkItemLimit(session.user.id)  // or checkCollectionLimit
  if (!allowed) {
    return { success: false, error: "Free plan is limited to 50 items. Upgrade to Pro for unlimited items." }
  }
}
```

### Upload route Pro gate (add after existing auth check)

```typescript
const dbUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
})
if (!dbUser?.isPro) {
  return NextResponse.json({ error: "File uploads require a Pro subscription." }, { status: 403 })
}
```

## Billing Page

`BillingContent` is a Client Component that receives `isPro`, `hasSubscription`, `itemCount`, and `collectionCount` as props and renders:

- **Free users:** usage bar (items X/50, collections X/3) + two pricing cards (Monthly $8, Annual $72) with upgrade buttons that call `createCheckoutSession(priceId)` via form action
- **Pro users:** "Pro Plan Active" status + a "Manage Billing" button that calls `createBillingPortalSession()`

## Key Gotchas

- **Raw body required for webhooks:** The route must call `req.text()` not `req.json()`. Stripe signature validation will fail if the body is parsed first.
- **`userId` must be in subscription metadata:** `createCheckoutSession` sets `subscription_data.metadata.userId`. The webhook reads `sub.metadata?.userId` to find the user. If this is missing, fall back to `prisma.user.findUnique({ where: { stripeCustomerId: sub.customer } })`.
- **`checkout.session.completed` vs `customer.subscription.created`:** Both fire for new subscriptions. Handle `checkout.session.completed` as the authoritative first-upgrade event; `subscription.updated` handles all subsequent state changes.
- **`/billing` must be added to the proxy auth matcher** in `src/proxy.ts` so unauthenticated users are redirected to sign-in.
- **Error strings are user-facing:** Keep them descriptive enough to prompt an upgrade (e.g. "Free plan is limited to 50 items. Upgrade to Pro…").

## Environment Variables

Only one new variable needed (the others are already set):

```
STRIPE_WEBHOOK_SECRET=""   # fill in from Stripe Dashboard → Webhook signing secret
```

For local testing with the Stripe CLI, use the CLI-provided webhook secret (starts with `whsec_`), not the Dashboard secret.

## Testing

### Setup

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... secret printed by the CLI into STRIPE_WEBHOOK_SECRET in .env
npm run dev
```

### Free tier gates
- [ ] Create a free user (set `isPro = false` in DB)
- [ ] Create 50 items — 51st shows limit error toast
- [ ] Create 3 collections — 4th shows limit error toast
- [ ] Try to upload a file — gets 403 / error toast

### Checkout flow
- [ ] Click upgrade → redirected to Stripe Checkout
- [ ] Use test card `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] `checkout.session.completed` fires in CLI output
- [ ] `isPro = true` in database
- [ ] Reload any page → billing page shows "Pro Plan Active"
- [ ] File upload now succeeds
- [ ] Item and collection creation no longer blocked

### Cancellation flow
- [ ] Click "Manage Billing" → Stripe Customer Portal
- [ ] Cancel the subscription
- [ ] `customer.subscription.deleted` fires in CLI output
- [ ] `isPro = false` in database
- [ ] Reload → billing page shows Free plan + limits

### Build
- [ ] `npm run build` passes with no errors

## Stripe Test Cards

| Scenario | Card |
|---|---|
| Success | 4242 4242 4242 4242 |
| Card declined | 4000 0000 0000 0002 |
| Requires 3DS auth | 4000 0025 0000 3155 |

## Branch

`feature/stripe-phase-2`

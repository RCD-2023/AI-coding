# Stripe Subscription Integration Plan

DevStash Pro — $8/month or $72/year.

---

## Current State

The schema is already prepared:

```prisma
model User {
  isPro                Boolean  @default(false)
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
}
```

Stripe env vars are configured in `.env` (keys + price IDs). `STRIPE_WEBHOOK_SECRET` is empty — fill it in during Stripe Dashboard setup.

The session type (`src/types/next-auth.d.ts`) currently only exposes `user.id`. It needs `isPro` added.

The JWT callback in `src/auth.ts` currently does not read `isPro` from the database — it must be updated to always sync it so that webhook updates are reflected on next session validation.

---

## Implementation Order

1. Stripe Dashboard setup (prices, webhook, portal)
2. `src/lib/stripe.ts` — Stripe client
3. `src/auth.ts` — JWT callback sync
4. `src/types/next-auth.d.ts` — session type
5. `src/lib/constants.ts` — free tier limits
6. `src/app/api/webhooks/stripe/route.ts` — webhook handler
7. `src/actions/subscriptions.ts` — checkout + billing portal
8. `src/app/api/upload/route.ts` — Pro gate for file/image uploads
9. `src/actions/items.ts` — free tier item limit
10. `src/actions/collections.ts` — free tier collection limit
11. `src/app/billing/page.tsx` — billing page
12. Wire billing link into settings/nav

---

## 1. Stripe Dashboard Setup

### Products & Prices
The `.env` already has two price IDs:
```
STRIPE_PRICE_ID_MONTHLY="price_1TZ6PkEPpRmt8EJ4PG8gZU2V"
STRIPE_PRICE_ID_YEARLY="price_1TZ6afEPpRmt8EJ4mQSKXXqR"
```
Verify these exist in the Stripe Dashboard under Products → DevStash Pro.

### Webhook
1. Go to Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Events to subscribe:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret → set `STRIPE_WEBHOOK_SECRET` in `.env`

### Customer Portal
Go to Settings → Billing → Customer portal and enable it. This allows users to manage their subscription without custom UI.

---

## 2. Files to Create

### `src/lib/stripe.ts`

Stripe client singleton.

```typescript
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
})
```

---

### `src/actions/subscriptions.ts`

Two actions: create a checkout session and open the billing portal.

```typescript
"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (user?.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe.customers.create({ email, metadata: { userId } })

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

export async function createCheckoutSession(priceId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) redirect("/sign-in")

  const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email)

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.AUTH_URL}/billing?success=true`,
    cancel_url: `${process.env.AUTH_URL}/billing`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
  })

  redirect(checkout.url!)
}

export async function createBillingPortalSession(): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) redirect("/billing")

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.AUTH_URL}/billing`,
  })

  redirect(portal.url)
}
```

---

### `src/app/api/webhooks/stripe/route.ts`

Handles the four subscribed events.

```typescript
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription") break
        const userId = session.subscription_data?.metadata?.userId
        const subscriptionId = session.subscription as string
        if (!userId) break
        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: true,
            stripeSubscriptionId: subscriptionId,
          },
        })
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break
        const isActive = sub.status === "active" || sub.status === "trialing"
        await prisma.user.update({
          where: { id: userId },
          data: { isPro: isActive },
        })
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break
        await prisma.user.update({
          where: { id: userId },
          data: { isPro: false, stripeSubscriptionId: null },
        })
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
```

> **Note:** The webhook needs `req.text()` (raw body), not `req.json()`. Make sure this route does not go through any body-parsing middleware that would consume the stream first.

---

### `src/app/billing/page.tsx`

Displays plan status and pricing options. Uses Server Component with client action triggers.

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BillingContent } from "@/components/billing/BillingContent"

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isPro: true,
      stripeSubscriptionId: true,
      _count: { select: { items: true, collections: true } },
    },
  })

  return (
    <BillingContent
      isPro={user?.isPro ?? false}
      hasSubscription={!!user?.stripeSubscriptionId}
      itemCount={user?._count.items ?? 0}
      collectionCount={user?._count.collections ?? 0}
    />
  )
}
```

A `BillingContent` client component handles the form submissions that call `createCheckoutSession` and `createBillingPortalSession`.

---

## 3. Files to Modify

### `src/types/next-auth.d.ts`

Add `isPro` to the session user type.

**Current:**
```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}
```

**Change to:**
```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isPro: boolean
    } & DefaultSession["user"]
  }
}
```

---

### `src/auth.ts`

Update the JWT and session callbacks to always sync `isPro` from the database. This ensures that after a Stripe webhook updates `isPro`, a simple page reload picks up the new status without any client-side `update()` call.

**Current JWT callback:**
```typescript
jwt: async ({ token, user }) => {
  if (user) token.id = user.id
  return token
},
```

**Replace with:**
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
```

**Current session callback:**
```typescript
session: async ({ session, token }) => {
  session.user.id = token.id as string
  return session
},
```

**Replace with:**
```typescript
session: async ({ session, token }) => {
  session.user.id = token.id as string
  session.user.isPro = token.isPro as boolean
  return session
},
```

Add the `prisma` import at the top of `src/auth.ts` (it's already imported — no change needed there).

> **Performance note:** This adds one small `SELECT isPro` query on every session validation. JWTs are validated on every authenticated request, but Next.js caches sessions per request via `auth()`. The overhead is negligible for this scale.

---

### `src/lib/constants.ts`

Add free tier limits alongside existing pagination constants.

```typescript
export const ITEMS_PER_PAGE = 21
export const COLLECTIONS_PER_PAGE = 21
export const DASHBOARD_COLLECTIONS_LIMIT = 6
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10

// Free tier limits
export const FREE_ITEMS_LIMIT = 50
export const FREE_COLLECTIONS_LIMIT = 3
```

---

### `src/actions/items.ts` — `createItem`

Add a free tier check after auth, before the Zod parse. Insert after `if (!session?.user?.id)`:

```typescript
// Free tier limit check
const dbUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
})
if (!dbUser?.isPro) {
  const itemCount = await prisma.item.count({ where: { userId: session.user.id } })
  if (itemCount >= FREE_ITEMS_LIMIT) {
    return {
      success: false,
      error: `Free plan is limited to ${FREE_ITEMS_LIMIT} items. Upgrade to Pro for unlimited items.`,
    }
  }
}
```

Also add a Pro check for file/image types (belt-and-suspenders on top of the upload API check):

```typescript
// After the itemType is resolved and before createItemInDb
if (!dbUser?.isPro && (typeSlug === "file" || typeSlug === "image")) {
  return { success: false, error: "File and image uploads require a Pro subscription." }
}
```

Import `FREE_ITEMS_LIMIT` from `@/lib/constants`.

---

### `src/actions/collections.ts` — `createCollection`

Add after `if (!session?.user?.id)`:

```typescript
const dbUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
})
if (!dbUser?.isPro) {
  const collectionCount = await prisma.collection.count({ where: { userId: session.user.id } })
  if (collectionCount >= FREE_COLLECTIONS_LIMIT) {
    return {
      success: false,
      error: `Free plan is limited to ${FREE_COLLECTIONS_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
    }
  }
}
```

Import `FREE_COLLECTIONS_LIMIT` from `@/lib/constants`.

---

### `src/app/api/upload/route.ts`

Add a Pro check after the auth check:

```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// Pro gate — file/image upload is Pro only
const dbUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
})
if (!dbUser?.isPro) {
  return NextResponse.json(
    { error: "File uploads require a Pro subscription." },
    { status: 403 }
  )
}
```

Add `import { prisma } from "@/lib/prisma"` at the top.

---

## 4. Environment Variables

Variables already present in `.env`. Only `STRIPE_WEBHOOK_SECRET` needs to be filled in after Stripe Dashboard setup.

```
STRIPE_SECRET_KEY="sk_test_..."         # already set
STRIPE_PUBLISHABLE_KEY="pk_test_..."    # already set — pass to client as NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY if using Stripe.js
STRIPE_WEBHOOK_SECRET=""                # fill in after creating webhook endpoint
STRIPE_PRICE_ID_MONTHLY="price_1TZ6PkEPpRmt8EJ4PG8gZU2V"
STRIPE_PRICE_ID_YEARLY="price_1TZ6afEPpRmt8EJ4mQSKXXqR"
```

If the billing page will show a Stripe Pricing Table or use Stripe.js directly, expose the publishable key:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## 5. Webhook Metadata Note

The webhook handlers above use `sub.metadata?.userId` to look up the user. This requires that `userId` is embedded in subscription metadata at checkout creation time, which the `createCheckoutSession` action does via `subscription_data.metadata`.

If you ever need to look up a user from a Stripe customer ID instead (e.g., if metadata is missing), fall back to:
```typescript
const user = await prisma.user.findUnique({ where: { stripeCustomerId: sub.customer as string } })
```

---

## 6. Testing Checklist

### Stripe CLI (local)
- [ ] Install Stripe CLI: `stripe login`
- [ ] Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Note the local webhook secret and set `STRIPE_WEBHOOK_SECRET` in `.env`

### Free tier gating
- [ ] Create a test user (free, `isPro = false`)
- [ ] Create 50 items — 51st should return the limit error
- [ ] Create 3 collections — 4th should return the limit error
- [ ] Attempt to upload a file — should return 403

### Checkout flow
- [ ] Click upgrade → redirects to Stripe Checkout
- [ ] Complete checkout with Stripe test card `4242 4242 4242 4242`
- [ ] `customer.subscription.created` / `checkout.session.completed` fires
- [ ] User `isPro` is `true` in the database
- [ ] Reload any page → session reflects `isPro: true`
- [ ] File upload now succeeds
- [ ] Item/collection limits no longer apply

### Cancellation flow
- [ ] Open billing portal
- [ ] Cancel subscription
- [ ] `customer.subscription.deleted` fires
- [ ] User `isPro` is `false` in the database
- [ ] Session reflects `isPro: false` on next request

### Stripe test cards
| Scenario | Card |
|---|---|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| Requires auth | 4000 0025 0000 3155 |

---

## 7. Pro Feature Summary

| Feature | Gate location |
|---|---|
| Items > 50 | `src/actions/items.ts` → `createItem` |
| Collections > 3 | `src/actions/collections.ts` → `createCollection` |
| File / image upload | `src/app/api/upload/route.ts` + `src/actions/items.ts` |
| AI features (future) | Server action for AI endpoint |
| Export (future) | Export API route |

---

## 8. Post-Implementation

- Add a billing link in the settings page or user menu
- Show upgrade prompts in the UI when a limit error is returned (the error string is already descriptive)
- During development, `isPro` can be set to `true` directly in the database for the dev user to bypass all gates

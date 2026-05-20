"use client"

import { useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createCheckoutSession, createBillingPortalSession } from "@/actions/subscriptions"
import { FREE_ITEMS_LIMIT, FREE_COLLECTIONS_LIMIT } from "@/lib/constants"
import { CheckCircle2, Zap } from "lucide-react"

interface BillingContentProps {
  isPro: boolean
  hasSubscription: boolean
  itemCount: number
  collectionCount: number
  monthlyPriceId: string
  yearlyPriceId: string
}

function UsageBar({ label, count, limit }: { label: string; count: number; limit: number }) {
  const pct = Math.min((count / limit) * 100, 100)
  const near = pct >= 80
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={near ? "font-medium text-amber-400" : "text-foreground"}>
          {count} / {limit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-2 rounded-full transition-all ${near ? "bg-amber-400" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function PricingCard({
  label,
  price,
  period,
  note,
  priceId,
  pending,
  onUpgrade,
}: {
  label: string
  price: string
  period: string
  note?: string
  priceId: string
  pending: boolean
  onUpgrade: (priceId: string) => void
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end gap-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Unlimited items
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Unlimited collections
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            File &amp; image uploads
          </li>
        </ul>
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => onUpgrade(priceId)}
        >
          <Zap className="mr-2 h-4 w-4" />
          {pending ? "Redirecting…" : "Upgrade to Pro"}
        </Button>
      </CardContent>
    </Card>
  )
}

export function BillingContent({
  isPro,
  hasSubscription,
  itemCount,
  collectionCount,
  monthlyPriceId,
  yearlyPriceId,
}: BillingContentProps) {
  const [checkoutPending, startCheckout] = useTransition()
  const [portalPending, startPortal] = useTransition()

  function handleUpgrade(priceId: string) {
    startCheckout(async () => {
      const { url } = await createCheckoutSession(priceId)
      window.location.href = url
    })
  }

  function handleManageBilling() {
    startPortal(async () => {
      const { url } = await createBillingPortalSession()
      window.location.href = url
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and usage</p>
      </div>

      {isPro ? (
        <section className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Pro Plan Active</p>
                  <p className="text-sm text-muted-foreground">
                    You have unlimited access to all features
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-blue-500 text-blue-500">
                Pro
              </Badge>
            </CardContent>
          </Card>

          {hasSubscription && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={portalPending}
            >
              {portalPending ? "Opening portal…" : "Manage Billing"}
            </Button>
          )}
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Free Plan Usage</h2>
            <Card>
              <CardContent className="space-y-4 p-6">
                <UsageBar label="Items" count={itemCount} limit={FREE_ITEMS_LIMIT} />
                <UsageBar label="Collections" count={collectionCount} limit={FREE_COLLECTIONS_LIMIT} />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Upgrade to Pro</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <PricingCard
                label="Monthly"
                price="$8"
                period="/ month"
                priceId={monthlyPriceId}
                pending={checkoutPending}
                onUpgrade={handleUpgrade}
              />
              <PricingCard
                label="Annual"
                price="$72"
                period="/ year"
                note="Save 25% — just $6/mo"
                priceId={yearlyPriceId}
                pending={checkoutPending}
                onUpgrade={handleUpgrade}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

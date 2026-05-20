"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createCheckoutSession, createBillingPortalSession } from "@/actions/subscriptions"
import { CheckCircle2, Zap } from "lucide-react"

interface BillingCardProps {
  isPro: boolean
  hasSubscription: boolean
  monthlyPriceId: string
  yearlyPriceId: string
}

export function BillingCard({ isPro, hasSubscription, monthlyPriceId, yearlyPriceId }: BillingCardProps) {
  const [checkoutPending, startCheckout] = useTransition()
  const [portalPending, startPortal] = useTransition()

  if (isPro) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Pro Plan Active</p>
            <p className="text-xs text-muted-foreground">Unlimited items, collections, files &amp; images</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-blue-500 text-blue-500">Pro</Badge>
          {hasSubscription && (
            <Button
              variant="outline"
              size="sm"
              disabled={portalPending}
              onClick={() => startPortal(async () => {
                const result = await createBillingPortalSession()
                if ("error" in result) { toast.error(result.error); return }
                window.location.href = result.url
              })}
            >
              {portalPending ? "Opening…" : "Manage"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Free Plan</p>
          <p className="text-xs text-muted-foreground">Upgrade to unlock files, images, and unlimited usage</p>
        </div>
        <Badge variant="outline">Free</Badge>
      </div>

      <ul className="space-y-1.5 text-xs text-muted-foreground">
        {["Unlimited items", "Unlimited collections", "File & image uploads"].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            {f}
          </li>
        ))}
      </ul>

      <div className="flex gap-3">
        <Button
          size="sm"
          className="flex-1"
          disabled={checkoutPending}
          onClick={() => startCheckout(async () => {
            const result = await createCheckoutSession(monthlyPriceId)
            if ("error" in result) { toast.error(result.error); return }
            window.location.href = result.url
          })}
        >
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          {checkoutPending ? "Redirecting…" : "Monthly — $8/mo"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={checkoutPending}
          onClick={() => startCheckout(async () => {
            const result = await createCheckoutSession(yearlyPriceId)
            if ("error" in result) { toast.error(result.error); return }
            window.location.href = result.url
          })}
        >
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          {checkoutPending ? "Redirecting…" : "Annual — $72/yr"}
        </Button>
      </div>
    </div>
  )
}

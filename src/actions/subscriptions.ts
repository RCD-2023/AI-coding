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

export async function createCheckoutSession(
  priceId: string
): Promise<{ url: string } | { error: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) redirect("/sign-in")

    const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email)

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: session.user.id },
      success_url: `${process.env.AUTH_URL}/billing?success=true`,
      cancel_url: `${process.env.AUTH_URL}/billing`,
      subscription_data: {
        metadata: { userId: session.user.id },
      },
    })

    return { url: checkout.url! }
  } catch (err) {
    console.error("createCheckoutSession error:", err)
    const message = err instanceof Error ? err.message : "Failed to create checkout session"
    return { error: message }
  }
}

export async function createBillingPortalSession(): Promise<{ url: string } | { error: string }> {
  try {
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

    return { url: portal.url }
  } catch (err) {
    console.error("createBillingPortalSession error:", err)
    const message = err instanceof Error ? err.message : "Failed to open billing portal"
    return { error: message }
  }
}

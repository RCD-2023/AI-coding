import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { BillingContent } from "@/components/billing/BillingContent";

async function syncStripeStatus(userId: string, stripeCustomerId: string | null) {
  if (!stripeCustomerId) return;
  const subs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 1,
  });
  const active = subs.data[0];
  if (active) {
    await prisma.user.update({
      where: { id: userId },
      data: { isPro: true, stripeSubscriptionId: active.id },
    });
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { success } = await searchParams;

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      _count: { select: { items: true, collections: true } },
    },
  });

  if (success === "true" && !user?.isPro) {
    await syncStripeStatus(session.user.id, user?.stripeCustomerId ?? null);
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isPro: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        _count: { select: { items: true, collections: true } },
      },
    });
  }

  return (
    <BillingContent
      isPro={user?.isPro ?? false}
      hasSubscription={!!user?.stripeSubscriptionId}
      itemCount={user?._count.items ?? 0}
      collectionCount={user?._count.collections ?? 0}
      monthlyPriceId={process.env.STRIPE_PRICE_ID_MONTHLY ?? ""}
      yearlyPriceId={process.env.STRIPE_PRICE_ID_YEARLY ?? ""}
    />
  );
}

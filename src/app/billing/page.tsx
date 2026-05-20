import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BillingContent } from "@/components/billing/BillingContent";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isPro: true,
      stripeSubscriptionId: true,
      _count: { select: { items: true, collections: true } },
    },
  });

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

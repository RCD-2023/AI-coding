import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSettingsData } from "@/lib/db/profile";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import { BillingCard } from "@/components/settings/BillingCard";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const data = await getSettingsData(session.user.id);
  if (!data) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Editor Preferences</h2>
        <Card>
          <CardContent className="space-y-4 p-6">
            <EditorPreferencesForm />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Account</h2>
        <Card>
          <CardContent className="space-y-4 p-6">
            {!data.isOAuth && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Password</p>
                  <p className="text-xs text-muted-foreground">
                    Update your account password
                  </p>
                </div>
                <ChangePasswordDialog />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently remove your account and all data
                </p>
              </div>
              <DeleteAccountDialog />
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Billing</h2>
        <Card>
          <CardContent className="p-6">
            <BillingCard
              isPro={data.isPro}
              hasSubscription={!!data.stripeSubscriptionId}
              monthlyPriceId={process.env.STRIPE_PRICE_ID_MONTHLY ?? ""}
              yearlyPriceId={process.env.STRIPE_PRICE_ID_YEARLY ?? ""}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

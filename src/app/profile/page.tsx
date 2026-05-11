import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfileData } from "@/lib/db/profile";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { iconMap } from "@/lib/icon-map";
import { FolderOpen, Layers } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const data = await getProfileData(session.user.id);
  if (!data) redirect("/sign-in");

  const { user, stats } = data;

  const joinedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account information and stats
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <UserAvatar name={user.name} image={user.image} className="h-16 w-16 text-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-foreground">
              {user.name ?? "No name set"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Member since {joinedDate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Usage Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalCollections}</p>
                <p className="text-xs text-muted-foreground">Collections</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Item Type Breakdown */}
      {stats.itemsByType.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Items by Type</h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {stats.itemsByType.map(({ typeName, icon, color, count }) => {
                const Icon = iconMap[icon];
                return (
                  <div
                    key={typeName}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        {Icon && <Icon className="h-4 w-4" style={{ color }} />}
                      </div>
                      <span className="text-sm text-foreground">{typeName}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Account Actions */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Account</h2>
        <Card>
          <CardContent className="space-y-4 p-6">
            {!user.isOAuth && (
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
    </div>
  );
}

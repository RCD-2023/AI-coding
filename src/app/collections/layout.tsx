import { auth } from "@/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarData } from "@/lib/db/sidebar";

export default async function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const sidebarData = userId ? await getSidebarData(userId) : null;

  return (
    <DashboardShell sidebarData={sidebarData} user={session?.user ?? null}>
      {children}
    </DashboardShell>
  );
}

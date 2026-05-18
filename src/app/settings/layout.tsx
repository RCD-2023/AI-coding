import { auth } from "@/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarData } from "@/lib/db/sidebar";
import { getSearchData } from "@/lib/db/search";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [sidebarData, searchData] = userId
    ? await Promise.all([getSidebarData(userId), getSearchData(userId)])
    : [null, null];

  return (
    <DashboardShell sidebarData={sidebarData} searchData={searchData} user={session?.user ?? null}>
      {children}
    </DashboardShell>
  );
}

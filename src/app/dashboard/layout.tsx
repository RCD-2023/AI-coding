import { auth } from "@/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarData } from "@/lib/db/sidebar";
import { getSearchData } from "@/lib/db/search";
import { getEditorPreferences } from "@/lib/db/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [sidebarData, searchData, initialEditorPrefs] = userId
    ? await Promise.all([
        getSidebarData(userId),
        getSearchData(userId),
        getEditorPreferences(userId),
      ])
    : [null, null, undefined];

  return (
    <DashboardShell
      sidebarData={sidebarData}
      searchData={searchData}
      user={session?.user ?? null}
      initialEditorPrefs={initialEditorPrefs ?? undefined}
    >
      {children}
    </DashboardShell>
  );
}

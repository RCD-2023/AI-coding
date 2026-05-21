import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFavoritesData } from "@/lib/db/favorites";
import FavoritesContent from "@/components/dashboard/FavoritesContent";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { items, collections } = await getFavoritesData(session.user.id);

  return <FavoritesContent items={items} collections={collections} isPro={session.user.isPro ?? false} />;
}

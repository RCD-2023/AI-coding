import { prisma } from "@/lib/prisma";

export type CollectionForCard = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  types: { name: string; icon: string; color: string }[];
  dominantColor: string;
};

export type DashboardStats = {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
};

async function getCollectionsForUser(userId: string): Promise<CollectionForCard[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: {
          item: { include: { itemType: true } },
        },
      },
    },
  });

  return collections.map((col) => {
    const counts = new Map<
      string,
      { type: { name: string; icon: string; color: string }; count: number }
    >();

    for (const { item } of col.items) {
      const { name, icon, color } = item.itemType;
      const entry = counts.get(name);
      if (entry) {
        entry.count++;
      } else {
        counts.set(name, { type: { name, icon, color }, count: 1 });
      }
    }

    const sorted = [...counts.values()].sort((a, b) => b.count - a.count);

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      types: sorted.map((e) => e.type),
      dominantColor: sorted[0]?.type.color ?? "#6b7280",
    };
  });
}

async function getStatsForUser(userId: string): Promise<DashboardStats> {
  const [totalItems, totalCollections, favoriteItems, favoriteCollections] =
    await Promise.all([
      prisma.item.count({ where: { userId } }),
      prisma.collection.count({ where: { userId } }),
      prisma.item.count({ where: { userId, isFavorite: true } }),
      prisma.collection.count({ where: { userId, isFavorite: true } }),
    ]);

  return { totalItems, totalCollections, favoriteItems, favoriteCollections };
}

// Temporary: uses demo user until auth (NextAuth session) is wired up
export async function getDashboardData() {
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true },
  });

  if (!user) return null;

  const [collections, stats] = await Promise.all([
    getCollectionsForUser(user.id),
    getStatsForUser(user.id),
  ]);

  return { collections, stats };
}
import { prisma } from "@/lib/prisma";

export type FavoriteItem = {
  id: string;
  title: string;
  updatedAt: Date;
  itemType: { name: string; icon: string; color: string };
};

export type FavoriteCollection = {
  id: string;
  name: string;
  itemCount: number;
  dominantColor: string;
  updatedAt: Date;
};

export type FavoritesData = {
  items: FavoriteItem[];
  collections: FavoriteCollection[];
};

export async function getFavoritesData(userId: string): Promise<FavoritesData> {
  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId, isFavorite: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        itemType: { select: { name: true, icon: true, color: true } },
      },
    }),
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          include: {
            item: { include: { itemType: { select: { name: true, icon: true, color: true } } } },
          },
        },
      },
    }),
  ]);

  return {
    items,
    collections: collections.map((col) => {
      const counts = new Map<string, { color: string; count: number }>();
      for (const { item } of col.items) {
        const { name, color } = item.itemType;
        const entry = counts.get(name);
        if (entry) entry.count++;
        else counts.set(name, { color, count: 1 });
      }
      const dominant = [...counts.values()].sort((a, b) => b.count - a.count)[0];
      return {
        id: col.id,
        name: col.name,
        itemCount: col.items.length,
        dominantColor: dominant?.color ?? "#6b7280",
        updatedAt: col.updatedAt,
      };
    }),
  };
}

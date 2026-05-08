import { prisma } from "@/lib/prisma";

export type SidebarItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
  isPro: boolean;
};

export type SidebarCollection = {
  id: string;
  name: string;
  dominantColor: string;
  itemCount: number;
};

export type SidebarData = {
  itemTypes: SidebarItemType[];
  favorites: SidebarCollection[];
  recents: SidebarCollection[];
};

const PRO_TYPES = new Set(["file", "image"]);
const SIDEBAR_RECENT_LIMIT = 5;

async function getItemTypesForSidebar(userId: string): Promise<SidebarItemType[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: {
      items: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  return types.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    count: t.items.length,
    isPro: PRO_TYPES.has(t.name),
  }));
}

async function getCollectionsForSidebar(userId: string) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: { select: { name: true, color: true } } },
          },
        },
      },
    },
  });

  const favorites: SidebarCollection[] = [];
  const recents: SidebarCollection[] = [];

  for (const col of collections) {
    const counts = new Map<string, { color: string; count: number }>();
    for (const { item } of col.items) {
      const { name, color } = item.itemType;
      const entry = counts.get(name);
      if (entry) entry.count++;
      else counts.set(name, { color, count: 1 });
    }
    const sorted = [...counts.values()].sort((a, b) => b.count - a.count);
    const entry = {
      id: col.id,
      name: col.name,
      dominantColor: sorted[0]?.color ?? "#6b7280",
      itemCount: col.items.length,
    };

    if (col.isFavorite) {
      favorites.push(entry);
    } else if (recents.length < SIDEBAR_RECENT_LIMIT) {
      recents.push(entry);
    }
  }

  return { favorites, recents };
}

export async function getSidebarData(userId: string): Promise<SidebarData | null> {
  const [itemTypes, { favorites, recents }] = await Promise.all([
    getItemTypesForSidebar(userId),
    getCollectionsForSidebar(userId),
  ]);

  return { itemTypes, favorites, recents };
}
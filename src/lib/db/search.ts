import { prisma } from "@/lib/prisma";

export type SearchItem = {
  id: string;
  title: string;
  itemType: { name: string; icon: string; color: string };
};

export type SearchCollection = {
  id: string;
  name: string;
  itemCount: number;
};

export type SearchData = {
  items: SearchItem[];
  collections: SearchCollection[];
};

export async function getSearchData(userId: string): Promise<SearchData> {
  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        itemType: { select: { name: true, icon: true, color: true } },
      },
      orderBy: { title: "asc" },
    }),
    prisma.collection.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      itemType: item.itemType,
    })),
    collections: collections.map((col) => ({
      id: col.id,
      name: col.name,
      itemCount: col._count.items,
    })),
  };
}

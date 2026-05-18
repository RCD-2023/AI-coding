import { prisma } from "@/lib/prisma";
import type { ItemForCard } from "@/lib/db/items";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants";

export type CollectionForCard = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  types: { name: string; icon: string; color: string }[];
  dominantColor: string;
};

export type CollectionWithItems = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  dominantColor: string;
  itemCount: number;
  types: { name: string; icon: string; color: string }[];
  items: ItemForCard[];
};

export type DashboardStats = {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
};

function mapCollectionToCard(col: {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  items: { item: { itemType: { name: string; icon: string; color: string } } }[];
}): CollectionForCard {
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
}

export async function getCollectionsForUser(userId: string): Promise<CollectionForCard[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: { item: { include: { itemType: true } } },
      },
    },
  });

  return collections.map(mapCollectionToCard);
}

export type CollectionsPageResult = {
  collections: CollectionForCard[];
  total: number;
};

export async function getCollectionsForUserPaginated(
  userId: string,
  page: number = 1
): Promise<CollectionsPageResult> {
  const [total, collections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * COLLECTIONS_PER_PAGE,
      take: COLLECTIONS_PER_PAGE,
      include: {
        items: {
          include: { item: { include: { itemType: true } } },
        },
      },
    }),
  ]);

  return { total, collections: collections.map(mapCollectionToCard) };
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

export async function getCollectionsForSelector(
  userId: string
): Promise<{ id: string; name: string }[]> {
  return prisma.collection.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createCollectionInDb(
  userId: string,
  data: { name: string; description: string | null }
) {
  return prisma.collection.create({
    data: { userId, name: data.name, description: data.description },
  });
}

export async function updateCollectionInDb(
  collectionId: string,
  userId: string,
  data: { name: string; description: string | null }
) {
  return prisma.collection.update({
    where: { id: collectionId, userId },
    data: { name: data.name, description: data.description },
  });
}

export async function deleteCollectionInDb(collectionId: string, userId: string) {
  return prisma.collection.delete({ where: { id: collectionId, userId } });
}

export async function getDashboardData(userId: string) {
  const [collections, stats] = await Promise.all([
    getCollectionsForUser(userId),
    getStatsForUser(userId),
  ]);

  return { collections, stats };
}

export async function getCollectionWithItems(
  collectionId: string,
  userId: string,
  page: number = 1
): Promise<CollectionWithItems | null> {
  // Fetch collection + lightweight type data for all items (for dominant color / count)
  const col = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      items: {
        include: {
          item: {
            select: {
              itemType: { select: { name: true, icon: true, color: true } },
            },
          },
        },
      },
    },
  });

  if (!col) return null;

  // Fetch only the current page of items with full card data
  const paginatedConnections = await prisma.itemCollection.findMany({
    where: { collectionId },
    orderBy: { item: { createdAt: "desc" } },
    skip: (page - 1) * COLLECTIONS_PER_PAGE,
    take: COLLECTIONS_PER_PAGE,
    include: {
      item: { include: { itemType: true, tags: true } },
    },
  });

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
    dominantColor: sorted[0]?.type.color ?? "#6b7280",
    itemCount: col.items.length,
    types: sorted.map((e) => e.type),
    items: paginatedConnections.map(({ item }) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      content: item.content,
      url: item.url,
      isFavorite: item.isFavorite,
      isPinned: item.isPinned,
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      fileSize: item.fileSize,
      tags: item.tags.map((t) => t.name),
      createdAt: item.createdAt,
      itemType: {
        name: item.itemType.name,
        icon: item.itemType.icon,
        color: item.itemType.color,
      },
    })),
  };
}
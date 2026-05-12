import { prisma } from "@/lib/prisma";

export type ItemTypeInfo = { name: string; icon: string; color: string };

export type ItemDetail = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  contentType: string;
  language: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  itemType: ItemTypeInfo;
  tags: string[];
  collections: { id: string; name: string }[];
  createdAt: Date;
  updatedAt: Date;
};

export async function getItemDetail(
  itemId: string,
  userId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      itemType: true,
      tags: true,
      collections: { include: { collection: { select: { id: true, name: true } } } },
    },
  });

  if (!item) return null;

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    contentType: item.contentType,
    language: item.language,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    itemType: {
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
    tags: item.tags.map((t) => t.name),
    collections: item.collections.map((ic) => ({
      id: ic.collection.id,
      name: ic.collection.name,
    })),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export type ItemsByTypeResult = {
  items: ItemForCard[];
  itemType: ItemTypeInfo;
};

export type ItemForCard = {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
  itemType: { name: string; icon: string; color: string };
};

async function fetchItems(
  userId: string,
  options: { isPinned?: boolean; limit?: number } = {}
): Promise<ItemForCard[]> {
  const items = await prisma.item.findMany({
    where: {
      userId,
      ...(options.isPinned !== undefined ? { isPinned: options.isPinned } : {}),
    },
    orderBy: { createdAt: "desc" },
    ...(options.limit ? { take: options.limit } : {}),
    include: {
      itemType: true,
      tags: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    tags: item.tags.map((t) => t.name),
    createdAt: item.createdAt,
    itemType: {
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
  }));
}

export async function getItemsByTypeSlug(
  userId: string,
  typeSlug: string
): Promise<ItemsByTypeResult | null> {
  const allTypes = await prisma.itemType.findMany({ where: { isSystem: true } });
  const matched = allTypes.find(
    (t) => t.name.toLowerCase() + "s" === typeSlug.toLowerCase()
  );

  if (!matched) return null;

  const items = await prisma.item.findMany({
    where: { userId, itemTypeId: matched.id },
    orderBy: { createdAt: "desc" },
    include: { itemType: true, tags: true },
  });

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      isFavorite: item.isFavorite,
      tags: item.tags.map((t) => t.name),
      createdAt: item.createdAt,
      itemType: {
        name: item.itemType.name,
        icon: item.itemType.icon,
        color: item.itemType.color,
      },
    })),
    itemType: {
      name: matched.name,
      icon: matched.icon,
      color: matched.color,
    },
  };
}

export async function getDashboardItems(userId: string) {
  const [pinned, recent] = await Promise.all([
    fetchItems(userId, { isPinned: true }),
    fetchItems(userId, { isPinned: false, limit: 10 }),
  ]);

  return { pinned, recent };
}
import { prisma } from "@/lib/prisma";

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

// Temporary: uses demo user until auth (NextAuth session) is wired up
export async function getDashboardItems() {
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true },
  });

  if (!user) return null;

  const [pinned, recent] = await Promise.all([
    fetchItems(user.id, { isPinned: true }),
    fetchItems(user.id, { limit: 10 }),
  ]);

  return { pinned, recent };
}
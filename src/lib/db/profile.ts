import { prisma } from "@/lib/prisma";
import {
  parseEditorPreferences,
  type EditorPreferences,
} from "@/lib/editor-preferences";

export type ProfileStats = {
  totalItems: number;
  totalCollections: number;
  itemsByType: { typeName: string; icon: string; color: string; count: number }[];
};

export type ProfileUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  isOAuth: boolean;
};

export type ProfileData = {
  user: ProfileUser;
  stats: ProfileStats;
};

export async function getSettingsData(
  userId: string
): Promise<{ isOAuth: boolean; editorPreferences: EditorPreferences } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accounts: { select: { id: true }, take: 1 },
      editorPreferences: true,
    },
  });
  if (!user) return null;
  return {
    isOAuth: user.accounts.length > 0,
    editorPreferences: parseEditorPreferences(user.editorPreferences),
  };
}

export async function getEditorPreferences(
  userId: string
): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });
  return parseEditorPreferences(user?.editorPreferences);
}

export async function getProfileData(userId: string): Promise<ProfileData | null> {
  const [user, groupedItems, totalItems, totalCollections] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        accounts: { select: { id: true }, take: 1 },
      },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);

  if (!user) return null;

  const itemTypeIds = groupedItems.map((r) => r.itemTypeId);
  const itemTypes = await prisma.itemType.findMany({
    where: { id: { in: itemTypeIds } },
    select: { id: true, name: true, icon: true, color: true },
  });

  const typeMap = new Map(itemTypes.map((t) => [t.id, t]));
  const itemsByType = groupedItems
    .map((r) => {
      const type = typeMap.get(r.itemTypeId);
      if (!type) return null;
      return { typeName: type.name, icon: type.icon, color: type.color, count: r._count.id };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.count - a.count);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
      isOAuth: user.accounts.length > 0,
    },
    stats: { totalItems, totalCollections, itemsByType },
  };
}

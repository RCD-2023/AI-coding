import { prisma } from "@/lib/prisma"
import { FREE_ITEMS_LIMIT, FREE_COLLECTIONS_LIMIT } from "@/lib/constants"

export async function checkItemLimit(
  userId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const count = await prisma.item.count({ where: { userId } })
  return { allowed: count < FREE_ITEMS_LIMIT, count, limit: FREE_ITEMS_LIMIT }
}

export async function checkCollectionLimit(
  userId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const count = await prisma.collection.count({ where: { userId } })
  return { allowed: count < FREE_COLLECTIONS_LIMIT, count, limit: FREE_COLLECTIONS_LIMIT }
}

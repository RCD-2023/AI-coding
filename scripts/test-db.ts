import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to database...\n");

  // ── System Item Types ────────────────────────────────────────────────────────
  const itemTypes = await prisma.itemType.findMany({ orderBy: { name: "asc" } });
  console.log(`System item types (${itemTypes.length}):`);
  for (const t of itemTypes) {
    console.log(`  ${t.icon.padEnd(12)} ${t.name.padEnd(10)} ${t.color}`);
  }

  // ── Demo User ────────────────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  });

  if (!user) {
    console.log("\n✗ Demo user not found — run: npx prisma db seed");
    return;
  }

  console.log(`\nDemo user:`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Name:     ${user.name}`);
  console.log(`  Password: ${user.password ? "[hashed]" : "not set"}`);
  console.log(`  isPro:    ${user.isPro}`);

  // ── Collections & Items ──────────────────────────────────────────────────────
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        include: {
          item: { include: { itemType: true } },
        },
      },
    },
  });

  console.log(`\nCollections (${collections.length}):`);
  for (const col of collections) {
    console.log(`\n  ${col.name} — ${col.description}`);
    for (const { item } of col.items) {
      const label = `${item.itemType.name}`.padEnd(10);
      const title = item.title.length > 50 ? item.title.slice(0, 50) + "…" : item.title;
      console.log(`    [${label}] ${title}`);
    }
  }

  // ── Totals ───────────────────────────────────────────────────────────────────
  const [totalItems, totalCollections] = await Promise.all([
    prisma.item.count({ where: { userId: user.id } }),
    prisma.collection.count({ where: { userId: user.id } }),
  ]);

  console.log(`\nTotals — users: 1 | items: ${totalItems} | collections: ${totalCollections}`);
  console.log("\n✓ Database connection OK\n");
}

main()
  .catch((e) => {
    console.error("✗ Database error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
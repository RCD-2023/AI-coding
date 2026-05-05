import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to database...");

  const itemTypes = await prisma.itemType.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`\n✓ Connected. Found ${itemTypes.length} system item types:\n`);

  for (const t of itemTypes) {
    console.log(`  ${t.icon.padEnd(12)} ${t.name.padEnd(10)} ${t.color}`);
  }

  const userCount = await prisma.user.count();
  const itemCount = await prisma.item.count();
  const collectionCount = await prisma.collection.count();

  console.log(`\n  Users: ${userCount}`);
  console.log(`  Items: ${itemCount}`);
  console.log(`  Collections: ${collectionCount}`);
  console.log("\n✓ Database connection OK\n");
}

main()
  .catch((e) => {
    console.error("✗ Database connection failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
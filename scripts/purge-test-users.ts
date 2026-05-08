import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const KEEP_EMAIL = "demo@devstash.io";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const demoUser = await prisma.user.findUnique({ where: { email: KEEP_EMAIL } });

  if (!demoUser) {
    console.log(`✗ Demo user (${KEEP_EMAIL}) not found — aborting`);
    return;
  }

  const targets = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true },
  });

  if (targets.length === 0) {
    console.log("No users to delete.");
    return;
  }

  console.log(`Deleting ${targets.length} user(s):`);
  for (const u of targets) {
    console.log(`  ${u.email}`);
  }

  const ids = targets.map((u) => u.id);

  // Delete in dependency order. Cascade handles most relations,
  // but VerificationToken links by email (identifier), not userId.
  const emails = targets.map((u) => u.email).filter(Boolean) as string[];

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: { in: emails } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);

  console.log(`\n✓ Deleted ${targets.length} user(s) and their content.`);
  console.log(`  Kept: ${KEEP_EMAIL}`);
}

main()
  .catch((e) => {
    console.error("✗ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

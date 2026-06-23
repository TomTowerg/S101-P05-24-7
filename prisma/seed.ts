import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APARTMENT_NUMBERS = [
  "101", "102", "103",
  "201", "202", "203",
  "301", "302", "303",
  "401", "402", "403",
  "501", "502",
];

async function main() {
  console.log("=== seed.ts: Seeding apartments ===\n");

  for (const number of APARTMENT_NUMBERS) {
    const result = await prisma.apartment.upsert({
      where: { number_tower: { number, tower: "" } },
      update: {},
      create: { number, tower: "" },
    });
    console.log(`Apartment ${number}: id=${result.id}, tower="${result.tower ?? "null"}"`);
  }

  const total = await prisma.apartment.count();
  console.log(`\n=== seed.ts: Done. Total apartments in DB: ${total} ===`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

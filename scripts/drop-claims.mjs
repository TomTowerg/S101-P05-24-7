import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "Claim" CASCADE');
await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "ClaimStatus" CASCADE');
await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "ClaimType" CASCADE');
console.log("Dropped Claim table and enums");
await prisma.$disconnect();

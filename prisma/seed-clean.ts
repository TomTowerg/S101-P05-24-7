import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== seed-clean.ts: Starting cleanup ===\n");

  // 1. PackageEvent (FK → Package)
  const packageEventCountBefore = await prisma.packageEvent.count();
  console.log(`PackageEvent before: ${packageEventCountBefore}`);
  const deletedPackageEvents = await prisma.packageEvent.deleteMany();
  const packageEventCountAfter = await prisma.packageEvent.count();
  console.log(
    `PackageEvent deleted: ${deletedPackageEvents.count}, after: ${packageEventCountAfter}\n`
  );

  // 2. Claim (FK → Package, User)
  const claimCountBefore = await prisma.claim.count();
  console.log(`Claim before: ${claimCountBefore}`);
  const deletedClaims = await prisma.claim.deleteMany();
  const claimCountAfter = await prisma.claim.count();
  console.log(
    `Claim deleted: ${deletedClaims.count}, after: ${claimCountAfter}\n`
  );

  // 3. Package (FK → Apartment, User)
  const packageCountBefore = await prisma.package.count();
  console.log(`Package before: ${packageCountBefore}`);
  const deletedPackages = await prisma.package.deleteMany();
  const packageCountAfter = await prisma.package.count();
  console.log(
    `Package deleted: ${deletedPackages.count}, after: ${packageCountAfter}\n`
  );

  // 4. Apartment
  const apartmentCountBefore = await prisma.apartment.count();
  console.log(`Apartment before: ${apartmentCountBefore}`);
  const deletedApartments = await prisma.apartment.deleteMany();
  const apartmentCountAfter = await prisma.apartment.count();
  console.log(
    `Apartment deleted: ${deletedApartments.count}, after: ${apartmentCountAfter}\n`
  );

  console.log("=== seed-clean.ts: Cleanup complete ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());

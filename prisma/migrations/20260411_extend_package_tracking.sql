-- CreateEnum
CREATE TYPE "PackageEventType" AS ENUM ('RECEIVED', 'NOTIFIED', 'PICKED_UP', 'RETURNED', 'NOTE_ADDED');

-- AlterEnum
ALTER TYPE "PackageStatus" ADD VALUE 'NOTIFIED';

-- AlterTable
ALTER TABLE "Apartment" ADD COLUMN     "floor" TEXT;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "notifiedAt" TIMESTAMP(3),
ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "pickedUpById" TEXT,
ADD COLUMN     "recipientName" TEXT;

-- CreateTable
CREATE TABLE "PackageEvent" (
    "id" TEXT NOT NULL,
    "type" "PackageEventType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "packageId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "PackageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackageEvent_packageId_idx" ON "PackageEvent"("packageId");

-- CreateIndex
CREATE INDEX "PackageEvent_createdById_idx" ON "PackageEvent"("createdById");

-- CreateIndex
CREATE INDEX "Apartment_number_idx" ON "Apartment"("number");

-- CreateIndex
CREATE INDEX "Package_pickedUpById_idx" ON "Package"("pickedUpById");

-- CreateIndex
CREATE INDEX "Package_status_idx" ON "Package"("status");

-- CreateIndex
CREATE INDEX "Package_receivedAt_idx" ON "Package"("receivedAt");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_pickedUpById_fkey" FOREIGN KEY ("pickedUpById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageEvent" ADD CONSTRAINT "PackageEvent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageEvent" ADD CONSTRAINT "PackageEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

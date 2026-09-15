-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'UPDATE');

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "tenantId" TEXT,
    "type" "BannerType" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_productId_idx" ON "banners"("productId");

-- CreateIndex
CREATE INDEX "banners_tenantId_idx" ON "banners"("tenantId");

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

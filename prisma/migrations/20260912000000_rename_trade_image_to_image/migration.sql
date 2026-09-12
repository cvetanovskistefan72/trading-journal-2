-- DropForeignKey
ALTER TABLE "TradeImage" DROP CONSTRAINT IF EXISTS "TradeImage_tradeId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "TradeImage_imageKey_key";
DROP INDEX IF EXISTS "TradeImage_thumbnailKey_key";
DROP INDEX IF EXISTS "TradeImage_tradeId_idx";

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_imageKey_key" ON "Image"("imageKey");

-- CreateIndex
CREATE UNIQUE INDEX "Image_thumbnailKey_key" ON "Image"("thumbnailKey");

-- CreateIndex
CREATE INDEX "Image_entityType_entityId_idx" ON "Image"("entityType", "entityId");

-- MigrateData
INSERT INTO "Image" ("id", "entityType", "entityId", "imageKey", "thumbnailKey", "createdAt")
SELECT "id", 'trade', "tradeId", "imageKey", "thumbnailKey", "createdAt"
FROM "TradeImage";

-- DropTable
DROP TABLE "TradeImage";

-- CreateTable
CREATE TABLE "TradeImage" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TradeImage_imageKey_key" ON "TradeImage"("imageKey");

-- CreateIndex
CREATE UNIQUE INDEX "TradeImage_thumbnailKey_key" ON "TradeImage"("thumbnailKey");

-- CreateIndex
CREATE INDEX "TradeImage_tradeId_idx" ON "TradeImage"("tradeId");

-- AddForeignKey
ALTER TABLE "TradeImage" ADD CONSTRAINT "TradeImage_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Trade_userId_archived_idx" ON "Trade"("userId", "archived");

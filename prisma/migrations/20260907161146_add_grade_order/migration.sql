-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "gradeOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Trade_userId_date_idx" ON "Trade"("userId", "date");

-- CreateIndex
CREATE INDEX "Trade_userId_gradeOrder_idx" ON "Trade"("userId", "gradeOrder");

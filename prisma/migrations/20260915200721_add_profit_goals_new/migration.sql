/*
  Warnings:

  - You are about to drop the column `maxDrawdownLimit` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyProfitGoal` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyTradeGoal` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `winRateGoal` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('MONTHLY_PROFIT', 'MAX_DRAWDOWN', 'WIN_RATE', 'TRADE_COUNT');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "maxDrawdownLimit",
DROP COLUMN "monthlyProfitGoal",
DROP COLUMN "monthlyTradeGoal",
DROP COLUMN "winRateGoal";

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_userId_type_key" ON "Goal"("userId", "type");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

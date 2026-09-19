/*
  Warnings:

  - You are about to drop the column `userId` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Strategy` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `dailyEditCount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dailyTradeLimit` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `editCountDate` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId,type]` on the table `Goal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Strategy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_userId_fkey";

-- DropForeignKey
ALTER TABLE "Strategy" DROP CONSTRAINT "Strategy_userId_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_userId_fkey";

-- DropIndex
DROP INDEX "Goal_userId_idx";

-- DropIndex
DROP INDEX "Goal_userId_type_key";

-- DropIndex
DROP INDEX "Strategy_userId_idx";

-- DropIndex
DROP INDEX "Trade_userId_archived_idx";

-- DropIndex
DROP INDEX "Trade_userId_date_idx";

-- DropIndex
DROP INDEX "Trade_userId_gradeOrder_idx";

-- DropIndex
DROP INDEX "Trade_userId_idx";

-- DropIndex
DROP INDEX "Trade_userId_pnl_idx";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Strategy" DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "dailyEditCount",
DROP COLUMN "dailyTradeLimit",
DROP COLUMN "editCountDate";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dailyTradeLimit" INTEGER NOT NULL DEFAULT 50,
    "dailyEditCount" INTEGER NOT NULL DEFAULT 0,
    "editCountDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Goal_accountId_idx" ON "Goal"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_accountId_type_key" ON "Goal"("accountId", "type");

-- CreateIndex
CREATE INDEX "Strategy_accountId_idx" ON "Strategy"("accountId");

-- CreateIndex
CREATE INDEX "Trade_accountId_idx" ON "Trade"("accountId");

-- CreateIndex
CREATE INDEX "Trade_accountId_archived_idx" ON "Trade"("accountId", "archived");

-- CreateIndex
CREATE INDEX "Trade_accountId_date_idx" ON "Trade"("accountId", "date");

-- CreateIndex
CREATE INDEX "Trade_accountId_gradeOrder_idx" ON "Trade"("accountId", "gradeOrder");

-- CreateIndex
CREATE INDEX "Trade_accountId_pnl_idx" ON "Trade"("accountId", "pnl");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

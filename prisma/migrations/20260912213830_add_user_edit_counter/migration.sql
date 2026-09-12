-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyEditCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "editCountDate" TEXT;

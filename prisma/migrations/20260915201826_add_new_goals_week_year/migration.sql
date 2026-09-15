/*
  Warnings:

  - The values [TRADE_COUNT] on the enum `GoalType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GoalType_new" AS ENUM ('MONTHLY_PROFIT', 'WEEKLY_PROFIT', 'YEARLY_PROFIT', 'MAX_DRAWDOWN', 'WIN_RATE', 'MONTHLY_TRADE_COUNT', 'WEEKLY_TRADE_COUNT');
ALTER TABLE "Goal" ALTER COLUMN "type" TYPE "GoalType_new" USING ("type"::text::"GoalType_new");
ALTER TYPE "GoalType" RENAME TO "GoalType_old";
ALTER TYPE "GoalType_new" RENAME TO "GoalType";
DROP TYPE "public"."GoalType_old";
COMMIT;

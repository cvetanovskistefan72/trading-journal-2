-- AlterTable
ALTER TABLE "User" ADD COLUMN     "maxDrawdownLimit" DOUBLE PRECISION,
ADD COLUMN     "monthlyProfitGoal" DOUBLE PRECISION,
ADD COLUMN     "monthlyTradeGoal" INTEGER,
ADD COLUMN     "winRateGoal" DOUBLE PRECISION;

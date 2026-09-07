-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "instrument" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "entryTime" TEXT NOT NULL,
    "exitTime" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "pnl" DOUBLE PRECISION NOT NULL,
    "riskAmount" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "confluences" TEXT[],
    "answers" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");

-- CreateIndex
CREATE INDEX "Trade_strategyId_idx" ON "Trade"("strategyId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "EconomicEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impact" TEXT NOT NULL,
    "forecast" TEXT,
    "previous" TEXT,
    "actual" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomicEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EconomicEvent_date_country_idx" ON "EconomicEvent"("date", "country");

-- CreateIndex
CREATE INDEX "EconomicEvent_country_idx" ON "EconomicEvent"("country");

-- CreateIndex
CREATE INDEX "EconomicEvent_impact_idx" ON "EconomicEvent"("impact");

-- CreateIndex
CREATE INDEX "EconomicEvent_date_idx" ON "EconomicEvent"("date");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicEvent_date_title_country_key" ON "EconomicEvent"("date", "title", "country");

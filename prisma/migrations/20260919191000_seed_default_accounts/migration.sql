-- Manual: create a default account for every existing user that doesn't have one yet
INSERT INTO "Account" ("id", "userId", "name", "dailyTradeLimit", "dailyEditCount", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", 'Default', 50, 0, NOW(), NOW()
FROM "User"
WHERE "id" NOT IN (SELECT "userId" FROM "Account");

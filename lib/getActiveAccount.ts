import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the active accountId for the current user.
 * Reads the `activeAccountId` cookie; falls back to the user's first account.
 * Returns null if the user has no accounts.
 */
export async function getActiveAccount(userId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get("activeAccountId")?.value ?? null;

  if (cookieId) {
    const account = await prisma.account.findFirst({
      where: { id: cookieId, userId },
      select: { id: true },
    });
    if (account) return account.id;
  }

  const first = await prisma.account.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return first?.id ?? null;
}

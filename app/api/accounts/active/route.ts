import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId } = await req.json();
  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    select: { id: true },
  });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cookieStore = await cookies();
  cookieStore.set("activeAccountId", accountId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true },
  });

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("activeAccountId")?.value ?? null;
  const activeId = accounts.find((a) => a.id === cookieId)?.id ?? accounts[0]?.id ?? null;

  return NextResponse.json({ accounts, activeId });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const count = await prisma.account.count({ where: { userId: user.id } });
  if (count >= 3) {
    return NextResponse.json({ error: "Maximum 3 accounts allowed" }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: { userId: user.id, name: name.trim() },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json(account);
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name } = await req.json();
  if (!id || !name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({ where: { id, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.account.update({
    where: { id },
    data: { name: name.trim() },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const count = await prisma.account.count({ where: { userId: user.id } });
  if (count <= 1) return NextResponse.json({ error: "Cannot delete your only account" }, { status: 400 });

  const account = await prisma.account.findFirst({ where: { id, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.account.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

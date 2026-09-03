import crypto from "crypto";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendPasswordResetEmail } from "@/lib/email";

const INVITE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const users = await prisma.user.findMany({
    where: { role: Role.USER },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      password: true,
      resetTokenExpiry: true,
    },
  });

  const now = new Date();

  const mapped = users.map((u) => {
    const isActive = !!u.password;
    const isExpired =
      !u.password && u.resetTokenExpiry && new Date(u.resetTokenExpiry) < now;

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      isActive,
      canResend: !!isExpired,
    };
  });

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { email, name } = await req.json();

  if (!email || !name) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const token = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: "",
      role: Role.USER,
      resetToken: token,
      resetTokenExpiry: new Date(Date.now() + INVITE_TTL_MS),
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  await sendPasswordResetEmail(email, token);

  return NextResponse.json(user);
}

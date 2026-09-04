import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateResetToken } from "@/lib/tokens";

const INVITE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // Fetch two lightweight sets and merge, so password hashes never leave the DB.
  const now = new Date();

  const [rawUsers, activeIds, expiredIds] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.USER },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: Role.USER, NOT: { password: "" } },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: {
        role: Role.USER,
        password: "",
        resetTokenExpiry: { lt: now },
      },
      select: { id: true },
    }),
  ]);

  const activeSet = new Set(activeIds.map((u) => u.id));
  const expiredSet = new Set(expiredIds.map((u) => u.id));

  const mapped = rawUsers.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt,
    isActive: activeSet.has(u.id),
    canResend: expiredSet.has(u.id),
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { email, name } = await req.json();

  if (
    !email ||
    !name ||
    typeof email !== "string" ||
    typeof name !== "string"
  ) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_RX.test(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const { raw, hashed } = generateResetToken();

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim(),
      password: "",
      role: Role.USER,
      resetToken: hashed,
      resetTokenExpiry: new Date(Date.now() + INVITE_TTL_MS),
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  await sendPasswordResetEmail(normalizedEmail, raw);

  return NextResponse.json(user);
}

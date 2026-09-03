import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendPasswordResetEmail } from "@/lib/email";

type Params = Promise<{ userId: string }>;

const INVITE_TTL_MS = 1000 * 60 * 30;

export async function POST(_req: Request, context: { params: Params }) {
  const { userId } = await context.params;

  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const token = crypto.randomUUID();
  const expiry = new Date(Date.now() + INVITE_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  await sendPasswordResetEmail(user.email, token);

  return NextResponse.json({ success: true });
}

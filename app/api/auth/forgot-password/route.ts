import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateResetToken } from "@/lib/tokens";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function POST(req: Request) {
  // 5 requests per IP per 15 min — prevents email-send spam and enumeration flooding.
  const limit = rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.resetAt);

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success so we don't leak whether an email exists.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const { raw, hashed } = generateResetToken();
    const expiry = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashed, resetTokenExpiry: expiry },
    });

    await sendPasswordResetEmail(user.email, raw);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }
}

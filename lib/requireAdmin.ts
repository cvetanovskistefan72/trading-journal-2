import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getCurrentUser } from "./auth";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: "You don't have permission for this action" },
      { status: 403 }
    );
  }

  return user;
}

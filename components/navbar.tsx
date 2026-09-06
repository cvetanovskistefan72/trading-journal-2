"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LineChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { HIDDEN_ON } from "@/config/navigation";
import { routes } from "@/config/routes";

/** @deprecated Use Sidebar instead. Kept only for auth pages that need a minimal header. */
export function Navbar() {
  const pathname = usePathname();
  const { status } = useSession();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const authed = status === "authenticated";

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
        <Link
          href={authed ? routes.dashboard : routes.home}
          className="flex items-center gap-2"
        >
          <LineChart className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Trading Journal</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {authed ? (
            <UserMenu />
          ) : (
            <Button size="sm" asChild>
              <Link href={routes.login}>Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

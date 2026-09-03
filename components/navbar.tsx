"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LineChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn, isActive } from "@/lib/utils";
import { routes } from "@/config/routes";
import { HIDDEN_ON, navItemsForRole } from "@/config/navigation";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const authed = status === "authenticated";
  const items = navItemsForRole(session?.user.role);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-6">
          <Link
            href={authed ? routes.dashboard : routes.home}
            className="flex items-center gap-2"
          >
            <LineChart className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Trading Journal</span>
          </Link>

          {authed && (
            <nav className="hidden sm:flex items-center gap-4">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

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

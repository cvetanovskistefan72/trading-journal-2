"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LineChart, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { HIDDEN_ON, navItemsForRole } from "@/config/navigation";
import { SidebarContent } from "@/components/sidebar-content";

export function MobileTopBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  if (status !== "authenticated" || !session?.user) return null;

  const items = navItemsForRole(session.user.role);
  const email = session.user.email ?? "";

  return (
    <div className="md:hidden shrink-0 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 flex flex-col">
          <SidebarContent
            items={items}
            pathname={pathname}
            email={email}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <LineChart className="h-5 w-5 text-primary" />
      <span className="flex-1 font-semibold tracking-tight">Trading Journal</span>
      <ThemeToggle />
    </div>
  );
}

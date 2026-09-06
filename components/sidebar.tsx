"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { HIDDEN_ON, navItemsForRole } from "@/config/navigation";
import { SidebarContent } from "@/components/sidebar-content";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  if (status !== "authenticated" || !session?.user) return null;

  const items = navItemsForRole(session.user.role);
  const email = session.user.email ?? "";

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-background">
      <SidebarContent items={items} pathname={pathname} email={email} />
    </aside>
  );
}

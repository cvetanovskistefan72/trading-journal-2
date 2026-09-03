import { LayoutDashboard, Users } from "lucide-react";
import { Role } from "@prisma/client";
import { routes } from "@/config/routes";
import type { NavItem } from "@/types/navigation";

/** Routes where the global navbar is hidden (auth pages). */
export const HIDDEN_ON: string[] = [
  routes.login,
  routes.forgotPassword,
  routes.setPassword,
];

/** Top-level nav items shown when the user is signed in. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: routes.dashboard, icon: LayoutDashboard },
];

/** Admin-only nav items — merged in when the session role is ADMIN. */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Users", href: routes.adminUsers, icon: Users },
];

export function navItemsForRole(role: Role | undefined): NavItem[] {
  return role === Role.ADMIN ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;
}

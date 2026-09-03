import type { LucideIcon } from "lucide-react";
import type { Route } from "@/config/routes";

export type NavItem = {
  label: string;
  href: Route;
  icon: LucideIcon;
};

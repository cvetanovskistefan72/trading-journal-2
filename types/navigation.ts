import type { LucideIcon } from "lucide-react";
import type { Route } from "@/config/routes";

export type NavItem = {
  label: string;
  href?: Route;
  icon: LucideIcon;
  children?: NavLeafItem[];
};

export type NavLeafItem = {
  label: string;
  href: Route;
  icon: LucideIcon;
};

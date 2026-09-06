"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, KeyRound, LineChart, LogOut, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, isActive } from "@/lib/utils";
import { routes } from "@/config/routes";
import type { NavItem, NavLeafItem } from "@/types/navigation";

function NavLeaf({
  item,
  pathname,
  indent = false,
  onNavigate,
}: {
  item: NavLeafItem;
  pathname: string;
  indent?: boolean;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Button
      asChild
      variant="ghost"
      onClick={onNavigate}
      className={cn(
        "w-full justify-start gap-3 font-medium",
        indent && "ml-4 w-[calc(100%-1rem)]",
        active
          ? "bg-accent text-accent-foreground hover:bg-accent"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Link href={item.href}>
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    </Button>
  );
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const childActive = item.children?.some((c) => isActive(pathname, c.href));
  const [open, setOpen] = useState(childActive ?? false);
  const Icon = item.icon;

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full justify-start gap-3 font-medium",
          childActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </Button>

      {open && item.children && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <NavLeaf key={child.href} item={child} pathname={pathname} indent onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItems({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map((item) => {
        if (item.children) {
          return <NavGroup key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />;
        }
        return (
          <NavLeaf
            key={item.href}
            item={item as NavLeafItem & { href: NonNullable<NavItem["href"]> }}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

function UserFooter({ email }: { email: string }) {
  const router = useRouter();

  return (
    <div className="border-t border-border px-3 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-3 px-2">
            <div className="h-8 w-8 shrink-0 rounded-full bg-accent flex items-center justify-center">
              <UserRound className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="flex-1 truncate text-xs text-left text-muted-foreground">{email}</p>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(routes.changePassword)}>
            <KeyRound className="h-4 w-4" />
            Change password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: routes.login })}>
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SidebarContent({
  items,
  pathname,
  email,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  email: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <LineChart className="h-5 w-5 text-primary" />
        <span className="flex-1 font-semibold tracking-tight">Trading Journal</span>
        <ThemeToggle />
      </div>
      <NavItems items={items} pathname={pathname} onNavigate={onNavigate} />
      <UserFooter email={email} />
    </>
  );
}

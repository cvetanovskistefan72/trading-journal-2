"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, KeyRound, LineChart, LogOut, Settings, UserRound } from "lucide-react";
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
import { SettingsModal } from "@/components/SettingsModal";

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
        "w-full justify-start gap-3 h-9 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer",
        indent && "ml-4 w-[calc(100%-1rem)]",
        active
          ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
    >
      <Link href={item.href}>
        {indent && (
          <span className={cn("h-1 w-1 rounded-full shrink-0", active ? "bg-primary" : "bg-muted-foreground/40")} />
        )}
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "", indent && "hidden")} />
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
          "w-full justify-start gap-3 h-9 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer",
          childActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", childActive && "text-primary")} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-muted-foreground", open && "rotate-180")}
        />
      </Button>

      {open && item.children && (
        <div className="mt-0.5 space-y-0.5">
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
    <nav className="flex-1 space-y-0.5 px-3 py-4">
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className="border-t border-border px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2 h-11 hover:bg-accent/60 rounded-lg transition-all duration-150 cursor-pointer">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-[11px] font-bold text-primary">{initials}</span>
              </div>
              <p className="flex-1 truncate text-xs text-left text-muted-foreground">{email}</p>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
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
    </>
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
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
          <LineChart className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="flex-1 font-semibold tracking-tight text-sm">Trading Journal</span>
        <span className="hidden md:block"><ThemeToggle /></span>
      </div>
      <NavItems items={items} pathname={pathname} onNavigate={onNavigate} />
      <UserFooter email={email} />
    </>
  );
}

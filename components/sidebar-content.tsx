"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, KeyRound, LineChart, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "next-auth/react";

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
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 h-9 px-3 text-sm rounded-lg transition-all duration-150 cursor-pointer select-none",
        indent && "ml-5 w-[calc(100%-1.25rem)] pl-2 h-8",
        active
          ? "bg-primary/8 text-primary font-semibold"
          : "font-medium text-muted-foreground/70 hover:text-foreground hover:bg-white/4"
      )}
    >
      {active && !indent && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-primary" />
      )}
      {indent ? (
        <span className={cn("h-[5px] w-[5px] rounded-full shrink-0", active ? "bg-primary" : "bg-muted-foreground/25")} />
      ) : (
        <Icon className={cn("h-[15px] w-[15px] shrink-0", active ? "text-primary" : "text-muted-foreground/50")} />
      )}
      {item.label}
    </Link>
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
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-3 h-9 px-3 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer select-none",
          childActive ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground hover:bg-white/4"
        )}
      >
        <Icon className={cn("h-[15px] w-[15px] shrink-0", childActive ? "text-primary" : "text-muted-foreground/50")} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 transition-transform duration-200 text-muted-foreground/30", open && "rotate-180")}
        />
      </button>

      {open && item.children && (
        <div className="mt-0.5 space-y-0.5 mb-1">
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
    <nav className="flex-1 space-y-1 px-3 py-5">
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
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <>
      <div className="border-t border-border px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 h-11 hover:bg-white/5 rounded-lg transition-all duration-150 cursor-pointer">
              <div className="h-7 w-7 shrink-0 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">{initials}</span>
              </div>
              <p className="flex-1 truncate text-xs text-left text-muted-foreground/70">{email}</p>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/40" />
            </button>
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

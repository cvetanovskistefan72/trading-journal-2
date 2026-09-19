"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Check, ChevronsUpDown, KeyRound, LineChart, LogOut, Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "next-auth/react";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/confirm-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          : "font-medium text-foreground/70 hover:text-foreground hover:bg-white/4"
      )}
    >
      {active && !indent && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-primary" />
      )}
      {indent ? (
        <span className={cn("h-[5px] w-[5px] rounded-full shrink-0", active ? "bg-primary" : "bg-muted-foreground/25")} />
      ) : (
        <Icon className={cn("h-[15px] w-[15px] shrink-0", active ? "text-primary" : "text-foreground/50")} />
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
          childActive ? "text-foreground" : "text-foreground/70 hover:text-foreground hover:bg-white/4"
        )}
      >
        <Icon className={cn("h-[15px] w-[15px] shrink-0", childActive ? "text-primary" : "text-foreground/50")} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 transition-transform duration-200 text-muted-foreground/60", open && "rotate-180")}
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

function AccountSwitcher() {
  const { accounts, activeAccount, switchAccount, isSwitching } = useActiveAccount();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  if (accounts.length === 0) return null;

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["strategies"] });
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (res.ok) { invalidateAll(); setNewName(""); setDialogOpen(false); }
  }

  async function handleRename() {
    if (!renameTarget) return;
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const res = await fetch("/api/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: renameTarget.id, name }),
    });
    setSaving(false);
    if (res.ok) { invalidateAll(); setRenameTarget(null); setNewName(""); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    const res = await fetch("/api/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    setSaving(false);
    if (res.ok) { invalidateAll(); setDeleteTarget(null); }
  }

  return (
    <>
      <div className="px-3 pb-2">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isSwitching}
              className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-all duration-150 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span className="flex-1 truncate text-xs text-left font-medium text-foreground/80">
                {activeAccount?.name ?? "Select account"}
              </span>
              <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground/70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 [&_*[role=menuitem]]:cursor-pointer">
            <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Switch account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accounts.map((acc) => (
              <DropdownMenuItem
                key={acc.id}
                onClick={() => { switchAccount(acc.id); setDropdownOpen(false); }}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <Check className={cn("h-3.5 w-3.5 shrink-0", acc.id === activeAccount?.id ? "opacity-100 text-primary" : "opacity-0")} />
                <span className="flex-1 truncate">{acc.name}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); setRenameTarget(acc); setNewName(acc.name); }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); setDeleteTarget(acc); }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {accounts.length < 3 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => { setDropdownOpen(false); setDialogOpen(true); }}
                  className="flex items-center gap-2 text-muted-foreground cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New account</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setNewName(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create account</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Account name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || saving}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => { if (!o) { setRenameTarget(null); setNewName(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename account</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Account name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRenameTarget(null); setNewName(""); }}>Cancel</Button>
            <Button onClick={handleRename} disabled={!newName.trim() || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={saving}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently delete the account and all trades, strategies, and goals inside it. This action cannot be undone."
        confirmLabel="Delete account"
      />
    </>
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
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/70" />
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
      <AccountSwitcher />
      <UserFooter email={email} />
    </>
  );
}

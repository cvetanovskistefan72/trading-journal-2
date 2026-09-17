"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShieldOff, ShieldCheck, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { resendUserEmail, toggleUser, updateUserLimit, updateUserTestFlag } from "@/services/users.service";
import type { UserRow } from "@/types/user";

function ResendEmailButton({ row }: { row: UserRow }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => resendUserEmail(row.id),
    onSuccess: () => {
      toast.success("Invite email re-sent");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to resend";
      toast.error(message);
    },
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <RefreshCw
              size={16}
              className={cn("transition-all", mutation.isPending && "animate-spin")}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Resend invite email</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ToggleUserButton({ row }: { row: UserRow }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => toggleUser(row.id),
    onSuccess: () => {
      toast.success(row.disabled ? "User enabled" : "User disabled");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className={row.disabled ? "text-muted-foreground" : "text-destructive hover:text-destructive"}
          >
            {row.disabled ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{row.disabled ? "Enable user" : "Disable user"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function LimitEditor({ row }: { row: UserRow }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(row.dailyTradeLimit));

  const mutation = useMutation({
    mutationFn: (limit: number) => updateUserLimit(row.id, limit),
    onSuccess: () => {
      toast.success("Trade limit updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditing(false);
    },
    onError: () => toast.error("Failed to update limit"),
  });

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm tabular-nums text-foreground">{row.dailyTradeLimit}</span>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setValue(String(row.dailyTradeLimit)); setEditing(true); }}>
          <Pencil size={12} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={1}
        max={2000}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") mutation.mutate(Number(value));
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
        className="w-20 rounded border border-border bg-background px-2 py-0.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 text-emerald-500"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(Number(value))}
      >
        <Check size={12} />
      </Button>
    </div>
  );
}

function TestFlagToggle({ row }: { row: UserRow }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (val: boolean) => updateUserTestFlag(row.id, val),
    onSuccess: (_, val) => {
      toast.success(val ? "Test mode enabled" : "Test mode disabled");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Failed to update test mode"),
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => mutation.mutate(!row.testFlag)}
            disabled={mutation.isPending}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors border",
              row.testFlag
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
            )}
          >
            {row.testFlag ? "Test ON" : "Test OFF"}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {row.testFlag ? "Disable test mode (limit enforced)" : "Enable test mode (no daily limit)"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className={cn(row.original.disabled && "text-muted-foreground line-through")}>
        {row.original.name ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className={cn(row.original.disabled && "text-muted-foreground line-through")}>
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.disabled ? (
        <span className="text-xs text-muted-foreground">Disabled</span>
      ) : row.original.isActive ? (
        <span className="text-xs text-emerald-500">Active</span>
      ) : (
        <span className="text-xs text-amber-500">Pending</span>
      ),
  },
  {
    id: "testMode",
    header: "Test Mode",
    cell: ({ row }) => <TestFlagToggle row={row.original} />,
  },
  {
    id: "dailyLimit",
    header: "Daily Limit",
    cell: ({ row }) => <LimitEditor row={row.original} />,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        {row.original.canResend && <ResendEmailButton row={row.original} />}
        <ToggleUserButton row={row.original} />
      </div>
    ),
  },
];

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { resendUserEmail, toggleUser, type UserRow } from "@/services/users.service";

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

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { resendUserEmail, type UserRow } from "@/services/users.service";

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
              className={cn(
                "transition-all",
                mutation.isPending && "animate-spin"
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Resend invite email</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.original.name ?? "—",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => (
      <div className="flex items-center justify-end gap-1">
        {row.original.canResend && <ResendEmailButton row={row.original} />}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => table.options.meta?.onDelete?.(row.original)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    ),
  },
];

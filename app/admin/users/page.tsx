"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";

import { deleteUser, getUsers, type UserRow } from "@/services/users.service";
import { routes } from "@/config/routes";
import { columns } from "./columns";

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showActive, setShowActive] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [open, setOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setSelected(null);
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  const filtered = users.filter((u) => (showActive ? u.isActive : !u.isActive));

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Invite new users and manage existing ones.
            </p>
          </div>
          <Button onClick={() => router.push(routes.adminUsersCreate)}>
            <Plus className="w-4 h-4" />
            New user
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="active-filter"
            checked={showActive}
            onCheckedChange={setShowActive}
          />
          <Label htmlFor="active-filter" className="text-muted-foreground">
            {showActive ? "Showing active" : "Showing pending"}
          </Label>
        </div>

        {isLoading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage={
              showActive
                ? "No active users yet"
                : "No pending invites. Create one to get started."
            }
            meta={{
              onDelete: (row) => {
                setSelected(row);
                setOpen(true);
              },
            }}
          />
        )}

        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => selected && deleteMutation.mutate(selected.id)}
          loading={deleteMutation.isPending}
        />
      </div>
    </main>
  );
}

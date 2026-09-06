"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";

import { getUsers } from "@/services/users.service";
import { routes } from "@/config/routes";
import { columns } from "./columns";

export default function UsersPage() {
  const router = useRouter();
  const [showActive, setShowActive] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const filtered = users.filter((u) => (showActive ? u.isActive : !u.isActive));

  return (
    <main className="flex-1">
      <div className="px-4 py-6 sm:px-8 sm:py-8 space-y-6">
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
                ? "No active users yet."
                : "No pending invites. Create one to get started."
            }
          />
        )}
      </div>
    </main>
  );
}

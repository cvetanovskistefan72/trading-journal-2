"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { createUser } from "@/services/users.service";
import { routes } from "@/config/routes";

type FormData = {
  name: string;
  email: string;
};

export default function CreateUserPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: (data: FormData) => createUser(data.email, data.name),
    onSuccess: () => {
      toast.success("User created — invite email sent");
      router.push(routes.adminUsers);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create user";
      toast.error(message);
    },
  });

  const onSubmit = (data: FormData) => {
    if (!data.name) {
      toast.error("Name is required");
      return;
    }
    if (!data.email) {
      toast.error("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Invalid email");
      return;
    }
    mutation.mutate(data);
  };

  return (
    <main className="flex-1">
      <div className="px-8 py-8 max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>New user</CardTitle>
              <CardDescription>
                We&apos;ll email them a link to set their password.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  disabled={mutation.isPending}
                  {...register("name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  disabled={mutation.isPending}
                  {...register("email")}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(routes.adminUsers)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  <Plus className="w-4 h-4" />
                  {mutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  );
}

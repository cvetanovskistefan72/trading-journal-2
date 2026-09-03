"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/services/auth.service";
import { routes } from "@/config/routes";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password updated");
      reset();
      router.push(routes.dashboard);
    },
    onError: (err: unknown) => {
      const message =
        typeof err === "object" && err && "error" in err
          ? String((err as { error: string }).error)
          : "Something went wrong";
      toast.error(message);
    },
  });

  const onSubmit = (form: FormData) => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Fill in all fields");
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    mutation.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-6 py-10">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Update the password for your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <InputGroup
                  id="current"
                  icon={Lock}
                  type="password"
                  placeholder="Current password"
                  autoComplete="current-password"
                  {...register("currentPassword")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next">New password</Label>
                <InputGroup
                  id="next"
                  icon={Lock}
                  type="password"
                  placeholder="New password"
                  autoComplete="new-password"
                  {...register("newPassword")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <InputGroup
                  id="confirm"
                  icon={Lock}
                  type="password"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(routes.dashboard)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  );
}

"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { getSetPasswordUser, setPassword } from "@/services/auth.service";
import { routes } from "@/config/routes";

type FormData = { password: string; confirmPassword: string };

function SetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { register, handleSubmit } = useForm<FormData>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["set-password", token],
    queryFn: () => getSetPasswordUser(token!),
    retry: false,
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: ({ password }: { password: string }) => setPassword(token!, password),
    onSuccess: () => { toast.success("Password saved"); router.push(routes.login); },
    onError: (err: unknown) => {
      const message = typeof err === "object" && err && "error" in err
        ? String((err as { error: string }).error) : "Something went wrong";
      toast.error(message);
    },
  });

  const onSubmit = (form: FormData) => {
    if (!form.password || !form.confirmPassword) { toast.error("Enter a password"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords don't match"); return; }
    mutation.mutate({ password: form.password });
  };

  if (!token || error) {
    return (
      <AuthSplitLayout>
        <div className="py-4 text-center space-y-4">
          <h2 className="text-lg font-semibold">Invalid link</h2>
          <p className="text-sm text-muted-foreground">The link is expired or has already been used.</p>
          <Button onClick={() => router.push(routes.login)}>Back to sign in</Button>
        </div>
      </AuthSplitLayout>
    );
  }

  if (isLoading) {
    return (
      <AuthSplitLayout>
        <div className="flex justify-center py-8"><Spinner /></div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <div className="space-y-7">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Set password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={data?.email ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <InputGroup
              id="password"
              icon={Lock}
              type="password"
              placeholder="New password"
              autoComplete="new-password"
              {...register("password")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <InputGroup
              id="confirm"
              icon={Lock}
              type="password"
              placeholder="Repeat password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save password"}
          </Button>
        </form>
      </div>
    </AuthSplitLayout>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <AuthSplitLayout>
        <div className="flex justify-center py-8"><Spinner /></div>
      </AuthSplitLayout>
    }>
      <SetPasswordInner />
    </Suspense>
  );
}

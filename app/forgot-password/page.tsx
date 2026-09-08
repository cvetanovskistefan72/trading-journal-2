"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { forgotPassword } from "@/services/auth.service";
import { routes } from "@/config/routes";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: () => {
      toast.success("If an account exists, we've sent reset instructions");
      router.push(routes.login);
    },
    onError: () => {
      toast.error("Something went wrong. Try again.");
    },
  });

  const handleSubmit = () => {
    if (!email) { toast.error("Enter your email"); return; }
    mutation.mutate(email);
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-7">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <InputGroup
              id="email"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mutation.isPending}
              autoComplete="email"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending..." : "Send reset link"}
          </Button>

          <Button
            type="button"
            variant="link"
            className="w-full text-muted-foreground"
            onClick={() => router.push(routes.login)}
          >
            Back to sign in
          </Button>
        </form>
      </div>
    </AuthSplitLayout>
  );
}

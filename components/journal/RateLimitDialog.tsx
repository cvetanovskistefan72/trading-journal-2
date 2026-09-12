"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  type: "create" | "edit";
};

export function RateLimitDialog({ open, onClose }: Props) {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const resetLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <div className="flex flex-col items-center text-center px-6 py-8 gap-4">
          <div className="rounded-full bg-amber-500/10 p-4">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold">
              Daily limit reached
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You've reached the maximum of <span className="font-medium text-foreground">50 trade actions</span> for today.
              Your limit resets in <span className="font-medium text-foreground">{resetLabel}</span>.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Limits reset daily at midnight UTC.
          </p>
          <Button className="w-full" onClick={onClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative min-h-screen flex items-center justify-center overflow-hidden bg-background",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
      <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full bg-primary/15 blur-3xl top-1/3 left-1/2 -translate-x-1/2" />
      <div className="relative w-full flex items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}

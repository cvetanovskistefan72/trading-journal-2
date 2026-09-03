import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
}

export const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(
  function InputGroup({ icon: Icon, className, ...props }, ref) {
    return (
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input ref={ref} className={cn("pl-9", className)} {...props} />
      </div>
    );
  }
);

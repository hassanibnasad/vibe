import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-border/70 bg-surface/70 px-3.5 py-1.5 text-xs shadow-inner backdrop-blur-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-2 focus-visible:ring-primary/20 hover:border-border-strong disabled:cursor-not-allowed disabled:bg-muted/70 disabled:text-text-disabled disabled:opacity-60",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

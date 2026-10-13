import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
        outline: "text-foreground border-border bg-background",
        // Canonical 4.5:1 Status Color System
        draft:
          "border-border bg-muted/70 text-muted-foreground",
        scheduled:
          "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        published:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        failed:
          "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        review:
          "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        hot:
          "border-orange-500/30 bg-orange-500/10 text-orange-800 dark:text-orange-300",
        mql:
          "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        sql:
          "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

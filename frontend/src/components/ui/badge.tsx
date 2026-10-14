import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/15 text-primary-foreground",
        secondary:
          "border-border/80 bg-secondary/80 text-secondary-foreground",
        destructive:
          "border-rose-500/30 bg-rose-500/10 text-rose-400 dark:text-rose-300",
        outline: "text-foreground border-border/80 bg-background/50 backdrop-blur-sm",
        // Warm surrealist status system
        draft:
          "border-border/80 bg-muted/50 text-muted-foreground",
        scheduled:
          "border-amber-500/35 bg-amber-500/10 text-amber-400 dark:text-amber-300",
        published:
          "border-emerald-500/35 bg-emerald-500/10 text-emerald-400 dark:text-emerald-300",
        failed:
          "border-rose-500/35 bg-rose-500/10 text-rose-400 dark:text-rose-300",
        success:
          "border-emerald-500/35 bg-emerald-500/10 text-emerald-400 dark:text-emerald-300",
        warning:
          "border-amber-500/35 bg-amber-500/10 text-amber-400 dark:text-amber-300",
        review:
          "border-amber-500/35 bg-amber-500/10 text-amber-400 dark:text-amber-300",
        hot:
          "border-orange-500/40 bg-orange-500/15 text-orange-400 dark:text-orange-300 font-semibold shadow-sm shadow-orange-950/30",
        mql:
          "border-sky-500/30 bg-sky-500/10 text-sky-400 dark:text-sky-300",
        sql:
          "border-primary/40 bg-primary/15 text-primary font-semibold shadow-sm shadow-primary/20",
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

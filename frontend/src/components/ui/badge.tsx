import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-primary/40 bg-primary/10 text-primary",
        secondary:
          "border-border bg-surface text-foreground",
        destructive:
          "border-rose-500/30 bg-rose-500/10 text-rose-400",
        outline:
          "text-foreground border-border bg-card/60 backdrop-blur-sm",
        draft:
          "border-border/80 bg-muted/60 text-muted-foreground",
        scheduled:
          "border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono",
        published:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono",
        failed:
          "border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono",
        review:
          "border-sky-500/30 bg-sky-500/10 text-sky-400 font-mono",
        hot:
          "border-amber-500/40 bg-amber-500/15 text-amber-300 font-mono font-semibold",
        mql:
          "border-sky-500/30 bg-sky-500/10 text-sky-400 font-mono",
        sql:
          "border-primary/40 bg-primary/15 text-primary font-mono font-semibold",
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

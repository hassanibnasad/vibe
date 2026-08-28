import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        published:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        scheduled:
          "border-sky-500/30 bg-sky-500/10 text-sky-400",
        draft:
          "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
        review:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        failed:
          "border-rose-500/30 bg-rose-500/10 text-rose-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        hot:
          "border-orange-500/30 bg-orange-500/10 text-orange-400",
        mql:
          "border-blue-500/30 bg-blue-500/10 text-blue-400",
        sql:
          "border-purple-500/30 bg-purple-500/10 text-purple-300",
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

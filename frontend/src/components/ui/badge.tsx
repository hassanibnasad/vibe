import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-purple-500/30 bg-purple-500/15 text-purple-300",
        secondary:
          "border-slate-700 bg-slate-800 text-slate-300",
        destructive:
          "border-rose-500/40 bg-rose-500/20 text-rose-300",
        outline: "text-slate-300 border-slate-700",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-300",
        hot:
          "border-orange-500/40 bg-orange-500/20 text-orange-300 animate-pulse",
        mql:
          "border-cyan-500/40 bg-cyan-500/20 text-cyan-300",
        sql:
          "border-purple-500/50 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 shadow-md shadow-purple-950",
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

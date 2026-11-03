import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-foreground/90 shadow-subtle active:scale-[0.98]",
        editions:
          "bg-primary text-black font-semibold shadow-glow hover:opacity-90 active:scale-[0.98]",
        destructive:
          "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 active:scale-[0.98]",
        outline:
          "border border-border/80 bg-surface/60 backdrop-blur-sm shadow-subtle hover:border-border-strong hover:bg-surface hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-subtle hover:bg-secondary/80",
        ghost: "hover:bg-surface hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25",
      },
      size: {
        default: "h-8 px-3.5 text-xs",
        sm: "h-7 px-2.5 text-[11px]",
        lg: "h-9 px-5 text-xs font-semibold",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

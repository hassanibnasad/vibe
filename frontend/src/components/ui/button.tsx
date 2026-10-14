import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-terracotta-400 to-terracotta-500 text-white shadow-warm hover:from-terracotta-500 hover:to-terracotta-600 hover:shadow-warm-lg active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-subtle hover:from-red-600 hover:to-red-700",
        outline:
          "border border-border/60 bg-surface/50 backdrop-blur-sm shadow-subtle hover:border-border-strong hover:bg-accent/50 hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-subtle hover:bg-secondary/80",
        ghost: "hover:bg-accent/50 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-subtle hover:from-emerald-600 hover:to-emerald-700",
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

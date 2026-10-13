import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-subtle hover:bg-primary/90 active:scale-[0.99]",
        destructive:
          "bg-destructive text-primary-foreground shadow-subtle hover:bg-destructive/90",
        outline:
          "border border-border bg-background shadow-subtle hover:border-border-strong hover:bg-accent hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-subtle hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-emerald-600 text-white shadow-subtle hover:bg-emerald-700",
      },
      size: {
        default: "h-8 px-3 text-xs",
        sm: "h-7 px-2.5 text-[11px]",
        lg: "h-9 px-4 text-xs font-semibold",
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

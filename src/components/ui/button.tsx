"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui Button — new-york style, but the press feedback is a real
 * spring (framer-motion) instead of a CSS transform, so it feels native
 * on touch devices.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold " +
    "transition-[color,background-color,border-color,box-shadow,opacity] duration-200 outline-none " +
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "disabled:pointer-events-none disabled:opacity-100 disabled:bg-none disabled:shadow-none " +
    "disabled:bg-[var(--surface-sunken)] disabled:text-muted-foreground " +
    "disabled:ring-1 disabled:ring-inset disabled:ring-[var(--hairline)] active:opacity-95 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-gradient text-[#04191a] shadow-brand hover:brightness-110 dark:text-[#04191a]",
        primary:
          "bg-primary text-primary-foreground shadow-brand hover:brightness-110",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent border border-[var(--hairline)]",
        outline:
          "border border-[var(--hairline)] bg-transparent hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive/12 text-destructive border border-destructive/30 hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline rounded-md",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-9 px-4 text-[13px]",
        xs: "h-8 px-3 text-[12px]",
        lg: "h-[54px] px-7 text-[16px]",
        icon: "size-10 p-0",
        "icon-sm": "size-9 p-0",
        "icon-xs": "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button;
    return (
      <Comp
        ref={ref as never}
        className={cn(buttonVariants({ variant, size }), className)}
        whileTap={asChild ? undefined : { scale: 0.965 }}
        transition={{ type: "spring", stiffness: 520, damping: 30 }}
        {...(props as React.HTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

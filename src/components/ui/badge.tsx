import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold leading-none whitespace-nowrap transition-colors [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary/12 text-primary border-primary/25",
        secondary: "bg-secondary text-secondary-foreground border-[var(--hairline)]",
        outline: "border-[var(--hairline)] text-muted-foreground",
        success: "bg-[#68d391]/12 text-[#68d391] border-[#68d391]/25",
        warning: "bg-[#f6e05e]/12 text-[#f6e05e] border-[#f6e05e]/25",
        danger: "bg-destructive/12 text-destructive border-destructive/25",
        glass: "bg-white/6 text-foreground border-white/12 backdrop-blur-md",
        brand: "bg-brand-gradient text-[#04191a] border-transparent",
      },
      size: {
        default: "",
        sm: "px-2 py-0.5 text-[10.5px]",
        lg: "px-3 py-1.5 text-[12.5px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

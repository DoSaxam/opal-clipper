import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-2xl bg-[var(--surface-sunken)] px-4 py-2 text-[15px] text-foreground",
        "border border-[var(--hairline)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]",
        "placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] duration-200",
        "focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/70 aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-2xl bg-[var(--surface-sunken)] px-4 py-3 text-[15px] text-foreground",
        "border border-[var(--hairline)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]",
        "placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] duration-200",
        "focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  );
}

export { Input, Textarea };

import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-sm text-foreground shadow-2xs backdrop-blur-xs transition-all duration-200 outline-none",
        "placeholder:text-muted-foreground/70 selection:bg-primary/20 selection:text-primary",
        "hover:border-border",
        "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background/90 focus:shadow-[0_0_12px_rgba(37,99,235,0.12)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/80 aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

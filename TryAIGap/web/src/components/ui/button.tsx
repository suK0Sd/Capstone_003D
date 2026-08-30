import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-2xs hover:bg-primary/95 hover:shadow-xs",
        destructive:
          "bg-destructive text-white shadow-2xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/80",
        outline:
          "border border-border/80 bg-background/60 shadow-2xs hover:bg-muted/50 hover:border-border text-foreground backdrop-blur-xs",
        secondary:
          "bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80",
        ghost:
          "hover:bg-muted/50 hover:text-foreground text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9.5 px-4 py-2 has-[>svg]:px-3 text-xs sm:text-sm",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs font-medium",
        lg: "h-11 rounded-xl px-6 has-[>svg]:px-4 text-sm font-semibold",
        icon: "size-9.5 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

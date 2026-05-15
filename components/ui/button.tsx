import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[var(--border)]",
        outline:
          "bg-background text-foreground border border-foreground hover:bg-secondary",
        ghost:
          "bg-transparent text-foreground hover:bg-secondary",
        destructive:
          "bg-[var(--negative)] text-white hover:bg-[var(--negative-deep)]",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-6 py-2.5 rounded-[24px]",
        sm: "h-9 gap-1.5 px-4 py-2 rounded-[24px] text-xs",
        lg: "h-12 gap-2 px-8 py-3 rounded-[24px]",
        icon: "size-11 rounded-full",
        "icon-sm": "size-9 rounded-full",
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
  const Comp = asChild ? Slot.Root : "button"

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

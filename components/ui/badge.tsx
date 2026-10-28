import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[rgba(0,255,136,0.2)] bg-[var(--green-dim)] text-[var(--green)]",
        secondary: "border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)]",
        destructive: "border-[rgba(248,113,113,0.25)] bg-[var(--loss-dim)] text-[var(--loss)]",
        outline: "text-[var(--text-2)] border-[var(--border)]",
        success: "border-[rgba(52,211,153,0.25)] bg-[var(--gain-dim)] text-[var(--gain)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

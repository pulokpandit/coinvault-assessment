import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] [&>svg]:text-[var(--text-2)]",
        destructive:
          "bg-[var(--loss-dim)] border-[rgba(248,113,113,0.25)] text-[var(--loss)] [&>svg]:text-[var(--loss)]",
        warning:
          "bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.25)] text-[var(--amber)] [&>svg]:text-[var(--amber)]",
        success:
          "bg-[var(--gain-dim)] border-[rgba(52,211,153,0.25)] text-[var(--gain)] [&>svg]:text-[var(--gain)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight text-[var(--text)]", className)}
      {...props}
    />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-[var(--text-2)] [&_p]:leading-relaxed", className)}
      {...props}
    />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

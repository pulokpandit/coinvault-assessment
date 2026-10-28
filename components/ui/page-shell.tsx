import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageShellProps = {
  children: ReactNode
  className?: string
  narrow?: boolean
}

export function PageShell({ children, className, narrow }: PageShellProps) {
  return (
    <div
      className={cn(
        "container mx-auto w-full max-w-6xl px-3 sm:px-4 py-5 sm:py-8 animate-fade-in",
        narrow && "max-w-xl",
        className,
      )}
    >
      {children}
    </div>
  )
}

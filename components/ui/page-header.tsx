import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8",
        "sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 mono" style={{ color: "var(--green)" }}>
            {eyebrow}
          </p>
        )}
        <h1 className="page-title mb-1">{title}</h1>
        {description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:flex-shrink-0 sm:justify-end">
          {action}
        </div>
      )}
    </div>
  )
}

"use client"

import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

type RefreshButtonProps = {
  onClick: () => void | Promise<void>
  isRefreshing?: boolean
  label?: string
  className?: string
  disabled?: boolean
}

/** Shared refresh control — same look/copy everywhere. */
export function RefreshButton({
  onClick,
  isRefreshing = false,
  label = "Refresh",
  className,
  disabled,
}: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isRefreshing}
      className={cn("refresh-button", className)}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
      {label}
    </button>
  )
}

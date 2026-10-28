"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type TokenIconProps = {
  icon: LucideIcon
  color: string
  colorDim?: string
  border?: string
  size?: "sm" | "md"
  className?: string
}

/** Consistent bordered icon chip for balances / tokens. */
export function TokenIcon({
  icon: Icon,
  color,
  colorDim,
  border,
  size = "md",
  className,
}: TokenIconProps) {
  const dim = colorDim || `${color}18`
  const brd = border || `${color}28`
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9"
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"

  return (
    <div
      className={cn("rounded-xl flex items-center justify-center shrink-0", box, className)}
      style={{ background: dim, border: `1px solid ${brd}` }}
    >
      <Icon className={iconSize} style={{ color }} strokeWidth={2} />
    </div>
  )
}

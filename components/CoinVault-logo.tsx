import { cn } from "@/lib/utils"

interface CoinVaultLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  textColor?: string
}

export function CoinVaultLogo({
  className,
  showText = true,
  size = "md",
  textColor = "text-white",
}: CoinVaultLogoProps) {
  const sizes = {
    sm: { container: "h-8 w-8", text: "text-lg" },
    md: { container: "h-10 w-10", text: "text-xl" },
    lg: { container: "h-12 w-12", text: "text-2xl" },
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative rounded-full overflow-hidden flex-shrink-0", sizes[size].container)}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="CoinVault-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ff88" />
              <stop offset="100%" stopColor="#00cc6a" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill="url(#CoinVault-gradient)" />
          <path d="M50 20L30 50L50 40L70 50L50 20Z" fill="#080c12" fillOpacity="0.85" />
          <path d="M50 45L30 55L50 80L70 55L50 45Z" fill="#080c12" fillOpacity="0.85" />
          <path d="M50 20L50 40L70 50L50 20Z" fill="#080c12" fillOpacity="0.55" />
          <path d="M50 45L50 80L70 55L50 45Z" fill="#080c12" fillOpacity="0.55" />
        </svg>
      </div>
      {showText && (
        <span
          className={cn("font-semibold whitespace-nowrap", textColor, sizes[size].text)}
          style={{ fontFamily: "'Clash Display', 'DM Sans', sans-serif" }}
        >
          CoinVault
        </span>
      )}
    </div>
  )
}

export const TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    color: "#627EEA",
    colorDim: "rgba(98,126,234,0.12)",
    border: "rgba(98,126,234,0.28)",
  },
  dETH: {
    symbol: "dETH",
    name: "Liquid Staking Token",
    color: "#22D3EE",
    colorDim: "rgba(34,211,238,0.12)",
    border: "rgba(34,211,238,0.28)",
  },
  sETH: {
    symbol: "sETH",
    name: "Liquid Restaking Token",
    color: "#C084FC",
    colorDim: "rgba(192,132,252,0.12)",
    border: "rgba(192,132,252,0.28)",
  },
} as const

export const SEMANTIC = {
  brand: "#00FF88",
  brandDim: "rgba(0,255,136,0.12)",
  gain: "#34D399",
  gainDim: "rgba(52,211,153,0.12)",
  loss: "#F87171",
  lossDim: "rgba(248,113,113,0.12)",
  deposited: "#627EEA", // ETH deposited → ETH color
  staked: "#C084FC", // ETH staked → sETH color
  users: "#94A3B8",
  avg: "#FBBF24",
  rank1: "#FBBF24",
  text: "rgba(255,255,255,0.9)",
  text2: "rgba(255,255,255,0.55)",
  text3: "rgba(255,255,255,0.35)",
} as const

export function formatBalance(value: string | null | undefined, digits = 4): string {
  const n = Number.parseFloat(value || "0")
  if (!Number.isFinite(n)) return (0).toFixed(digits)
  return n.toFixed(digits)
}

export function safeParseFloat(value: string | null | undefined): number {
  const n = Number.parseFloat(value || "0")
  return Number.isFinite(n) ? n : 0
}

import { ethers } from "ethers"

export const SEPOLIA_CHAIN_ID = 11155111
export const ZERO_ADDRESS = ethers.ZeroAddress

export const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "Sepolia"
export const CHAIN_ID =
  Number(
    process.env.NEXT_PUBLIC_CHAIN_ID ||
      process.env.NEXT_PUBLIC_HOLESKY_CHAIN_ID
  ) || SEPOLIA_CHAIN_ID

export const EXPLORER_URL = (
  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.etherscan.io"
).replace(/\/$/, "")

export const RPC_CANDIDATES = [
  process.env.NEXT_PUBLIC_RPC_URL,
  process.env.NEXT_PUBLIC_HOLESKY_RPC_URL,
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://ethereum-sepolia.publicnode.com",
  "https://rpc.sepolia.org",
].filter(Boolean) as string[]

export const RPC_URL = RPC_CANDIDATES[0]

export const DETH_ADDRESS = process.env.NEXT_PUBLIC_DETH_ADDRESS || ""
export const SETH_ADDRESS = process.env.NEXT_PUBLIC_SETH_ADDRESS || ""
export const GOVERNANCE_ADDRESS = process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || ""
export const STAKING_DASHBOARD_ADDRESS =
  process.env.NEXT_PUBLIC_STAKING_DASHBOARD_ADDRESS || ""

export const isConfiguredAddress = (address?: string | null): address is string => {
  if (!address) return false
  try {
    return ethers.isAddress(address) && address.toLowerCase() !== ZERO_ADDRESS
  } catch {
    return false
  }
}

export const explorerAddressUrl = (address: string) => `${EXPLORER_URL}/address/${address}`
export const explorerTxUrl = (txHash: string) => `${EXPLORER_URL}/tx/${txHash}`

export const walletAddEthereumChainParams = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: `${NETWORK_NAME} Testnet`,
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [EXPLORER_URL],
}

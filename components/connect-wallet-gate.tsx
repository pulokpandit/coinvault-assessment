"use client"

import { Wallet } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"

export function ConnectWalletGate({ feature }: { feature: string }) {
  const { openConnectModal } = useWeb3()

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center max-w-md px-4">
        <h2 className="text-xl font-medium mb-2" style={{ color: "var(--text)" }}>
          Connect a wallet
        </h2>
        <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>
          {feature} works with the in-browser Demo wallet, or a browser wallet on Sepolia.
        </p>
        <button type="button" onClick={openConnectModal} className="connect-button inline-flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span>Connect wallet</span>
        </button>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Sparkles, Wallet, X } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"
import { rememberLastWallet, subscribeDiscoveredWallets, type DiscoveredWallet } from "@/lib/wallet"

export function WalletModal() {
  const { connectModalOpen, closeConnectModal, connectWallet, connectVirtualWallet, isConnecting } = useWeb3()
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([])

  useEffect(() => subscribeDiscoveredWallets(setWallets), [])

  if (!connectModalOpen) return null

  const connect = async (wallet: DiscoveredWallet) => {
    if (!wallet.detected || !wallet.provider) {
      if (wallet.installUrl) {
        window.open(wallet.installUrl, "_blank", "noopener,noreferrer")
      }
      return
    }
    rememberLastWallet(wallet.id)
    await connectWallet(wallet.provider)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="connect-wallet-title">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={closeConnectModal} />
      <div
        className="relative w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#131313", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 id="connect-wallet-title" className="text-lg font-semibold">
            Connect a wallet
          </h2>
          <button
            type="button"
            onClick={closeConnectModal}
            className="p-1.5 rounded-full"
            style={{ color: "rgba(255,255,255,0.55)" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => void connectVirtualWallet()}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-white/10 disabled:opacity-60"
            style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.18)" }}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">Demo wallet</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Simulated chain — no extension or test ETH
              </div>
            </div>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,255,136,0.12)", color: "#00ff88" }}
            >
              Instant
            </span>
          </button>

          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              disabled={isConnecting}
              onClick={() => void connect(wallet)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors hover:bg-white/10 disabled:opacity-60"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {wallet.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={wallet.icon} alt="" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,152,0,0.15)", color: "#F6851B" }}
                >
                  <Wallet className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{wallet.name}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {wallet.detected ? "Detected" : "Install to connect"}
                </div>
              </div>
              {wallet.detected ? (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(0,255,136,0.12)", color: "#00ff88" }}
                >
                  Installed
                </span>
              ) : (
                <ExternalLink className="h-4 w-4" style={{ color: "rgba(255,255,255,0.35)" }} />
              )}
            </button>
          ))}
        </div>

        <p className="px-5 py-4 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          Demo wallet runs entirely in the browser. A browser wallet must approve each on-chain action.
        </p>
      </div>
    </div>
  )
}

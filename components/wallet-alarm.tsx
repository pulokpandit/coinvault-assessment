"use client"

import { TriangleAlert } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"

const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/"

export function WalletAlarm() {
  const { walletAlarmOpen, closeWalletAlarm } = useWeb3()

  if (!walletAlarmOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" role="alertdialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        aria-label="Dismiss"
        onClick={closeWalletAlarm}
      />
      <div
        className="relative w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{ background: "#0d1320", border: "1px solid rgba(248,113,113,0.35)", color: "var(--text)" }}
      >
        <div className="flex items-center gap-2 mb-3" style={{ color: "#f87171" }}>
          <TriangleAlert className="h-5 w-5" />
          <h2 className="text-lg font-semibold">No wallet found</h2>
        </div>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-2)" }}>
          CoinVault does not create a wallet. Install MetaMask (or another injected wallet), then click Connect wallet
          again.
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={closeWalletAlarm}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          >
            Dismiss
          </button>
          <a
            href={METAMASK_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeWalletAlarm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-center"
            style={{ background: "#f87171", color: "#080c12" }}
          >
            Install MetaMask
          </a>
        </div>
      </div>
    </div>
  )
}

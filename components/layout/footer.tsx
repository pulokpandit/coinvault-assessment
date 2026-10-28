"use client"

import Link from "next/link"
import { CoinVaultLogo } from "@/components/CoinVault-logo"
import { NAV_ITEMS } from "@/lib/nav"
import { EXPLORER_URL, NETWORK_NAME } from "@/lib/network"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t" style={{ background: "rgba(8,12,18,0.98)", borderColor: "var(--border)" }}>
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <CoinVaultLogo size="sm" showText textColor="text-white" />
            <p className="text-sm mt-4 max-w-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              Deposit ETH for dETH, stake for sETH, and vote with staking weight.
            </p>
          </div>
          <nav aria-label="Footer">
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
              App
            </h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="footer-link">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div
          className="mt-8 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs mono" style={{ color: "var(--text-3)" }} suppressHydrationWarning>
            © {year} CoinVault
          </p>
          <a
            href={EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs mono hover:underline"
            style={{ color: "var(--text-3)" }}
          >
            {NETWORK_NAME}
          </a>
        </div>
      </div>
    </footer>
  )
}

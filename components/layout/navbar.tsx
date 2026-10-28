"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { Menu, X, Wallet, LogOut, ChevronDown, ExternalLink, Copy, Check, RefreshCw } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CoinVaultLogo } from "@/components/CoinVault-logo"
import { TOKENS, formatBalance } from "@/lib/design-tokens"
import { NAV_ITEMS } from "@/lib/nav"
import { explorerAddressUrl } from "@/lib/network"
import { shortenAddress } from "@/lib/wallet"

export function Navbar() {
  const pathname = usePathname()
  const { account, openConnectModal, disconnectWallet, isConnected, isHydrated, isVirtual, networkName, refreshBalances, ethBalance, dETHBalance, sETHBalance } = useWeb3()
  const showConnected = isHydrated && isConnected
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.classList.toggle("nav-locked", mobileMenuOpen)
    return () => document.body.classList.remove("nav-locked")
  }, [mobileMenuOpen])

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const shortAddr = account ? shortenAddress(account) : ""

  return (
    <>
      <nav className={`navbar fixed top-0 left-0 right-0 z-50 ${scrolled ? "scrolled" : ""}`}>
        <div className="container mx-auto max-w-6xl px-3 sm:px-4 py-3">
          {/* Desktop / large tablet */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 xl:gap-8 min-w-0">
              <Link href="/" className="shrink-0">
                <CoinVaultLogo size="sm" textColor="text-white" />
              </Link>
              <div className="flex items-center gap-0.5 xl:gap-1 flex-wrap">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`navbar-link ${pathname === item.href ? "active" : ""}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 xl:gap-3 shrink-0">
              {showConnected && networkName && (
                <div
                  className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mono"
                  style={{ background: "var(--green-dim)", border: "1px solid rgba(0,255,136,0.2)", color: "var(--green)" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  {networkName}
                </div>
              )}

              {showConnected ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                    >
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      <span className="mono text-xs">{shortAddr}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[min(18rem,calc(100vw-2rem))]"
                    style={{ background: "#0d1320", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    <DropdownMenuLabel className="flex items-center justify-between py-3">
                      <span className="font-semibold">Wallet</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full mono"
                        style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,255,136,0.2)" }}
                      >
                        {isVirtual ? "Demo" : "Connected"}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator style={{ background: "var(--border)" }} />
                    <div className="px-3 py-2">
                      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>Address</div>
                      <div
                        className="flex items-center justify-between p-2 rounded-lg mono text-xs gap-2"
                        style={{ background: "rgba(0,0,0,0.3)", color: "var(--text-2)" }}
                      >
                        <span className="truncate">{shortAddr}</span>
                        <div className="flex gap-1 shrink-0">
                          <button type="button" onClick={copyAddress} className="p-1 rounded hover:bg-white/10 transition-colors">
                            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 opacity-40" />}
                          </button>
                          {!isVirtual && (
                            <a
                              href={explorerAddressUrl(account)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5 opacity-40" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>Balances</div>
                      {[
                        { label: "ETH", val: formatBalance(ethBalance), color: TOKENS.ETH.color },
                        { label: "dETH", val: formatBalance(dETHBalance), color: TOKENS.dETH.color },
                        { label: "sETH", val: formatBalance(sETHBalance), color: TOKENS.sETH.color },
                      ].map((b) => (
                        <div
                          key={b.label}
                          className="flex justify-between items-center px-2 py-1.5 rounded-lg gap-2"
                          style={{ background: "rgba(255,255,255,0.03)" }}
                        >
                          <span className="text-xs" style={{ color: "var(--text-3)" }}>{b.label}</span>
                          <span className="mono text-sm font-semibold truncate" style={{ color: b.color }}>{b.val}</span>
                        </div>
                      ))}
                    </div>
                    <DropdownMenuSeparator style={{ background: "var(--border)" }} />
                    <div className="px-2 py-1 flex gap-2">
                      <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
                        style={{ background: "var(--surface)", color: "var(--text-2)" }}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={disconnectWallet}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium"
                        style={{ background: "rgba(248,113,113,0.08)", color: "#f87171" }}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Disconnect
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button type="button" onClick={openConnectModal} className="connect-button flex items-center gap-2" suppressHydrationWarning>
                  <Wallet className="h-4 w-4" />
                  <span>Connect</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile / tablet */}
          <div className="flex lg:hidden items-center justify-between gap-2">
            <Link href="/" className="min-w-0 shrink">
              <CoinVaultLogo size="sm" showText textColor="text-white" />
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              {showConnected ? (
                <span
                  className="mono text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg max-w-[7.5rem] truncate"
                  style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,255,136,0.2)" }}
                >
                  {shortAddr}
                </span>
              ) : (
                <button type="button" onClick={openConnectModal} className="connect-button text-sm px-3 sm:px-4 py-2" suppressHydrationWarning>
                  <span>Connect</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg transition-all"
                style={{ color: "var(--text-2)" }}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col animate-fade-in lg:hidden"
          style={{ background: "rgba(8,12,18,0.98)", backdropFilter: "blur(24px)" }}
        >
          <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <CoinVaultLogo size="sm" showText textColor="text-white" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg"
              style={{ color: "var(--text-2)" }}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col justify-center px-4 sm:px-6 gap-2 py-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl"
                style={{
                  background: pathname === item.href ? "var(--green-dim)" : "var(--surface)",
                  border: `1px solid ${pathname === item.href ? "rgba(0,255,136,0.2)" : "var(--border)"}`,
                  color: pathname === item.href ? "var(--green)" : "var(--text-2)",
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 500,
                  fontSize: "1.0625rem",
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="p-4 sm:p-6 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
            {showConnected ? (
              <button
                type="button"
                onClick={() => {
                  disconnectWallet()
                  setMobileMenuOpen(false)
                }}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  openConnectModal()
                }}
                className="connect-button w-full py-4 flex items-center justify-center gap-2 text-base"
              >
                <Wallet className="h-5 w-5" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      )}
      <div className="h-14" />
    </>
  )
}

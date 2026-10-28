"use client"

import { useCallback, useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { ethers } from "ethers"
import {
  Wallet, Layers, Users, ArrowDownToLine, ArrowUpFromLine,
  TrendingUp, Zap, Shield, LineChart, ChevronRight, Landmark,
} from "lucide-react"
import Link from "next/link"
import { RefreshButton } from "@/components/ui/refresh-button"
import { TokenIcon } from "@/components/ui/token-icon"
import { PageHeader } from "@/components/ui/page-header"
import { TOKENS, SEMANTIC, formatBalance } from "@/lib/design-tokens"

export function StakingDashboard() {
  const { stakingDashboardContract, isConnected, account, refreshBalances, ethBalance, dETHBalance, sETHBalance } = useWeb3()
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [overview, setOverview] = useState({
    totalETHDeposited: "0",
    totalETHStaked: "0",
    totalStakers: "0",
    averageStakeAmount: "0",
  })
  const [userStats, setUserStats] = useState({
    stakedAmount: "0",
    stakingTimestamp: "0",
    rank: "0",
    percentageOfTotal: "0",
  })

  const fetchData = useCallback(async () => {
    if (!stakingDashboardContract) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const overviewData = await stakingDashboardContract.getStakingOverview()
      setOverview({
        totalETHDeposited: ethers.formatEther(overviewData.totalETHDeposited),
        totalETHStaked: ethers.formatEther(overviewData.totalETHStaked),
        totalStakers: overviewData.totalStakers.toString(),
        averageStakeAmount: ethers.formatEther(overviewData.averageStakeAmount),
      })
      if (account) {
        const ud = await stakingDashboardContract.getStakerDetails(account)
        setUserStats({
          stakedAmount: ethers.formatEther(ud.stakedAmount),
          stakingTimestamp: new Date(Number(ud.stakingTimestamp) * 1000).toLocaleDateString(),
          rank: ud.rank.toString(),
          percentageOfTotal: (Number(ud.percentageOfTotal) / 100).toFixed(2),
        })
      }
    } catch {
      // Contracts may be unset on Sepolia until addresses are configured.
    } finally {
      setLoading(false)
    }
  }, [stakingDashboardContract, account])

  useEffect(() => {
    void fetchData()
  }, [fetchData, isConnected])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    await fetchData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const protocolStats = [
    { label: "Total Deposited", val: formatBalance(overview.totalETHDeposited, 2), unit: "ETH", icon: ArrowDownToLine, color: TOKENS.ETH.color },
    { label: "Total Staked", val: formatBalance(overview.totalETHStaked, 2), unit: "ETH", icon: Landmark, color: TOKENS.sETH.color },
    { label: "Total Stakers", val: overview.totalStakers, unit: "users", icon: Users, color: SEMANTIC.users },
    { label: "Avg Stake", val: formatBalance(overview.averageStakeAmount, 4), unit: "ETH", icon: TrendingUp, color: SEMANTIC.avg },
  ]

  const balances = [
    { label: "ETH Balance", sub: "Native", val: formatBalance(ethBalance), unit: "ETH", icon: Wallet, color: TOKENS.ETH.color, dim: TOKENS.ETH.colorDim, border: TOKENS.ETH.border },
    { label: "Available", sub: "Liquid Staking Token", val: formatBalance(dETHBalance), unit: "dETH", icon: Shield, color: TOKENS.dETH.color, dim: TOKENS.dETH.colorDim, border: TOKENS.dETH.border },
    { label: "Staked", sub: "Earning rewards", val: formatBalance(sETHBalance), unit: "sETH", icon: Zap, color: TOKENS.sETH.color, dim: TOKENS.sETH.colorDim, border: TOKENS.sETH.border },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Deposits, stakes, and wallet balances."
        action={<RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />}
      />

      <div
        className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 overflow-hidden"
        style={{
          background: "linear-gradient(135deg,rgba(0,255,136,0.04) 0%,rgba(98,126,234,0.06) 100%)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {protocolStats.map((item) => (
            <div key={item.label} className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="h-3.5 w-3.5 shrink-0" style={{ color: item.color }} />
                <span className="text-[11px] sm:text-xs truncate" style={{ color: "var(--text-3)" }}>{item.label}</span>
              </div>
              {loading ? (
                <div className="h-7 w-20 rounded bg-[var(--surface)] animate-pulse" />
              ) : (
                <>
                  <div className="mono text-lg sm:text-xl font-semibold truncate" style={{ color: "var(--text)" }}>{item.val}</div>
                  <div className="text-xs mt-0.5" style={{ color: item.color }}>{item.unit}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="section-title">Your Balances</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8 stagger">
        {balances.map((item) => (
          <div key={item.label} className="stat-card">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)" }}>
                  {item.label}
                </div>
                <div className="text-xs truncate" style={{ color: "var(--text-3)" }}>{item.sub}</div>
              </div>
              <TokenIcon icon={item.icon} color={item.color} colorDim={item.dim} border={item.border} />
            </div>
            <div className="mono text-2xl sm:text-3xl font-semibold tracking-tight truncate" style={{ color: item.color }}>{item.val}</div>
            <div className="text-sm font-semibold mt-1" style={{ color: "var(--text-3)" }}>{item.unit}</div>
          </div>
        ))}
      </div>

      {isConnected && parseFloat(userStats.stakedAmount) > 0 && (
        <div className="mb-8">
          <div className="section-title">Your Position</div>
          <div className="glass-card p-4 sm:p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Staked", val: `${formatBalance(userStats.stakedAmount)} ETH` },
                { label: "Rank", val: `#${userStats.rank}` },
                { label: "Pool Share", val: `${userStats.percentageOfTotal}%` },
                { label: "Since", val: userStats.stakingTimestamp },
              ].map((item) => (
                <div key={item.label} className="min-w-0">
                  <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: "var(--text-3)" }}>{item.label}</div>
                  <div className="mono text-base sm:text-lg font-semibold truncate" style={{ color: "var(--text)" }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="section-title">Quick Actions</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8">
        {[
          { label: "Deposit", href: "/deposit", icon: ArrowDownToLine, sub: "ETH → dETH" },
          { label: "Withdraw", href: "/deposit?tab=withdraw", icon: ArrowUpFromLine, sub: "dETH → ETH" },
          { label: "Stake", href: "/stake", icon: Layers, sub: "dETH → sETH" },
          { label: "Unstake", href: "/stake?tab=unstake", icon: ArrowUpFromLine, sub: "sETH → dETH" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="action-button flex-col gap-1.5 sm:gap-2 py-4 sm:py-5">
            <item.icon className="h-5 w-5" strokeWidth={2} />
            <div className="text-center min-w-0">
              <div className="font-semibold text-sm">{item.label}</div>
              <div className="text-[10px] sm:text-xs mt-0.5 mono truncate" style={{ color: "var(--text-3)" }}>{item.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="section-title">Market Data</div>
      <Link href="/markets" className="block glass-card p-4 sm:p-5 group">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <TokenIcon icon={LineChart} color={SEMANTIC.brand} colorDim={SEMANTIC.brandDim} border="rgba(0,255,136,0.2)" />
            <div className="min-w-0">
              <div className="font-medium" style={{ color: "var(--text)" }}>Markets</div>
              <div className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
                Simulated dETH / sETH price and volume
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "var(--green)" }} />
        </div>
      </Link>
    </div>
  )
}

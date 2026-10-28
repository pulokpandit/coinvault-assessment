"use client"

import { useCallback, useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { Trophy, Landmark, Users, Loader2 } from "lucide-react"
import { RefreshButton } from "@/components/ui/refresh-button"
import { TokenIcon } from "@/components/ui/token-icon"
import { PageHeader } from "@/components/ui/page-header"
import { ConnectWalletGate } from "@/components/connect-wallet-gate"
import { TOKENS, SEMANTIC, formatBalance } from "@/lib/design-tokens"
import { shortenAddress } from "@/lib/wallet"

export function Leaderboard() {
  const { stakingDashboardContract, sETHContract, signer, isConnected, account } = useWeb3()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<{
    addresses: string[]
    amounts: string[]
    percentages: string[]
  }>({ addresses: [], amounts: [], percentages: [] })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState({ totalStaked: "0", totalStakers: "0" })
  const { toast } = useToast()

  const fetchLeaderboard = useCallback(async () => {
    if (!stakingDashboardContract) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const overview = await stakingDashboardContract.getStakingOverview()
      setStats({
        totalStaked: ethers.formatEther(overview.totalETHStaked),
        totalStakers: overview.totalStakers.toString(),
      })
      const leaderboardData = await stakingDashboardContract.getLeaderboard(10)
      setLeaderboard({
        addresses: leaderboardData.stakerAddresses,
        amounts: leaderboardData.stakedAmounts.map((amount: bigint) => ethers.formatEther(amount)),
        percentages: leaderboardData.percentageOfTotal.map((percentage: bigint) =>
          (Number(percentage) / 100).toFixed(2),
        ),
      })
    } catch {
      setLeaderboard({ addresses: [], amounts: [], percentages: [] })
    } finally {
      setLoading(false)
    }
  }, [stakingDashboardContract])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchLeaderboard()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const updateLeaderboard = async () => {
    if (!sETHContract || !signer || !isConnected) return
    try {
      setIsUpdating(true)
      const tx = await sETHContract.connect(signer).updateLeaderboard()
      toast({ title: "Update submitted", description: tx.hash })
      await tx.wait()
      toast({ title: "Leaderboard updated" })
      fetchLeaderboard()
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Leaderboard update did not confirm.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const formatAddress = (address: string) => {
    const short = shortenAddress(address)
    return address === account ? `${short} (you)` : short
  }

  const RankCell = ({ index }: { index: number }) => {
    if (index === 0) {
      return (
        <div className="flex items-center gap-2">
          <span className="rank-badge rank-badge-1">1</span>
          <Trophy className="h-3.5 w-3.5" style={{ color: SEMANTIC.rank1 }} />
        </div>
      )
    }
    const cls = index === 1 ? "rank-badge rank-badge-2" : index === 2 ? "rank-badge rank-badge-3" : "rank-badge"
    return <span className={cls}>{index + 1}</span>
  }

  if (!isConnected) return <ConnectWalletGate feature="leaderboard" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Top stakers by sETH weight."
        action={
          <>
            <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
            <button
              type="button"
              onClick={updateLeaderboard}
              disabled={isUpdating}
              className="refresh-button"
              title="Submit on-chain leaderboard update"
            >
              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {isUpdating ? "Updating..." : "Sync On-chain"}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Total ETH Staked</span>
            <TokenIcon icon={Landmark} color={TOKENS.sETH.color} colorDim={TOKENS.sETH.colorDim} border={TOKENS.sETH.border} size="sm" />
          </div>
          {loading ? (
            <div className="h-8 w-32 rounded bg-[var(--surface)] animate-pulse" />
          ) : (
            <div className="mono text-xl sm:text-2xl font-semibold truncate" style={{ color: TOKENS.sETH.color }}>
              {formatBalance(stats.totalStaked)}{" "}
              <span className="text-sm font-medium" style={{ color: "var(--text-3)" }}>ETH</span>
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Total Stakers</span>
            <TokenIcon icon={Users} color={SEMANTIC.users} colorDim="rgba(148,163,184,0.12)" border="rgba(148,163,184,0.28)" size="sm" />
          </div>
          {loading ? (
            <div className="h-8 w-20 rounded bg-[var(--surface)] animate-pulse" />
          ) : (
            <div className="mono text-xl sm:text-2xl font-semibold" style={{ color: "var(--text)" }}>{stats.totalStakers}</div>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-4 sm:px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-medium" style={{ color: "var(--text)" }}>Top Stakers</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Ordered by staked amount</p>
        </div>

        {loading ? (
          <div className="p-4 sm:p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded-lg bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        ) : leaderboard.addresses.length > 0 ? (
          <div className="table-scroll">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Rank", "Address", "Amount Staked", "% of Total"].map((h) => (
                    <th
                      key={h}
                      className={`px-3 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${h !== "Rank" && h !== "Address" ? "text-right" : "text-left"}`}
                      style={{ color: "var(--text-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.addresses.map((address, index) => {
                  const isYou = address === account
                  return (
                    <tr
                      key={address}
                      style={{
                        borderBottom: index < leaderboard.addresses.length - 1 ? "1px solid var(--border)" : undefined,
                        background: isYou ? "rgba(0,255,136,0.06)" : undefined,
                      }}
                    >
                      <td className="px-3 sm:px-5 py-3 sm:py-3.5"><RankCell index={index} /></td>
                      <td className="px-3 sm:px-5 py-3 sm:py-3.5 mono text-xs sm:text-sm whitespace-nowrap" style={{ color: isYou ? "var(--green)" : "var(--text)" }}>
                        {formatAddress(address)}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-right mono text-xs sm:text-sm font-semibold whitespace-nowrap" style={{ color: "var(--text)" }}>
                        {formatBalance(leaderboard.amounts[index])} ETH
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-right">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-md text-xs mono font-semibold"
                          style={{
                            background: index === 0 ? "rgba(251,191,36,0.12)" : "var(--surface)",
                            color: index === 0 ? SEMANTIC.rank1 : "var(--text-2)",
                            border: `1px solid ${index === 0 ? "rgba(251,191,36,0.3)" : "var(--border)"}`,
                          }}
                        >
                          {leaderboard.percentages[index]}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 px-4">
            <Users className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--text-3)" }} />
            <p className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>No stakers found</p>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-2)" }}>
              Be the first to stake and appear on the leaderboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

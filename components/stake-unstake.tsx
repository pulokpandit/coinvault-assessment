"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { Input } from "@/components/ui/input"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { Layers, ArrowUpFromLine, Loader2, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { ConnectWalletGate } from "@/components/connect-wallet-gate"
import { formatBalance, safeParseFloat, TOKENS, SEMANTIC } from "@/lib/design-tokens"
import { getTxErrorMessage } from "@/lib/wallet"

export function StakeUnstake() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const initialTab = tabParam === "unstake" ? "unstake" : "stake"

  const { dETHContract, sETHContract, signer, isConnected, dETHBalance, sETHBalance, refreshBalances, account } = useWeb3()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [allowance, setAllowance] = useState("0")
  const [isApproving, setIsApproving] = useState(false)
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setActiveTab(tabParam === "unstake" ? "unstake" : "stake")
  }, [tabParam])

  const checkAllowance = useCallback(async () => {
    if (!dETHContract || !sETHContract || !isConnected || !account) return
    try {
      setIsCheckingAllowance(true)
      const sETHAddress = sETHContract.target || (sETHContract as any).address
      if (!sETHAddress) return
      const currentAllowance = await dETHContract.allowance(account, sETHAddress)
      setAllowance(ethers.formatEther(currentAllowance))
    } catch {
      setAllowance("0")
    } finally {
      setIsCheckingAllowance(false)
    }
  }, [dETHContract, sETHContract, isConnected, account])

  useEffect(() => {
    checkAllowance()
  }, [checkAllowance])

  const handleApprove = async () => {
    if (!dETHContract || !sETHContract || !signer) return
    try {
      setIsApproving(true)
      const sETHAddress = sETHContract.target || (sETHContract as any).address
      if (!sETHAddress) {
        toast({ title: "Error", description: "Cannot get sETH contract address", variant: "destructive" })
        return
      }
      const tx = await dETHContract.connect(signer).approve(sETHAddress, ethers.MaxUint256)
      toast({ title: "Approval submitted", description: tx.hash })
      await tx.wait()
      await checkAllowance()
      toast({ title: "Approved", description: "dETH can now be staked." })
    } catch (error) {
      toast({
        title: "Approval failed",
        description: getTxErrorMessage(error, "Approve did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleStake = async () => {
    if (!sETHContract || !signer || !stakeAmount) return
    try {
      setIsStaking(true)
      const amount = ethers.parseEther(stakeAmount)
      if (safeParseFloat(dETHBalance) < safeParseFloat(stakeAmount)) {
        toast({
          title: "Insufficient dETH Balance",
          description: "You don't have enough dETH to stake this amount.",
          variant: "destructive",
        })
        return
      }
      if (safeParseFloat(allowance) < safeParseFloat(stakeAmount)) {
        toast({
          title: "Insufficient Allowance",
          description: "Please approve dETH tokens before staking.",
          variant: "destructive",
        })
        return
      }
      const tx = await sETHContract.connect(signer).stake(amount)
      toast({ title: "Stake submitted", description: tx.hash })
      await tx.wait()
      toast({ title: "Stake confirmed", description: `${stakeAmount} dETH → sETH` })
      setStakeAmount("")
      refreshBalances()
      checkAllowance()
    } catch (error) {
      toast({
        title: "Stake failed",
        description: getTxErrorMessage(error, "Stake did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async () => {
    if (!sETHContract || !signer || !unstakeAmount) return
    try {
      setIsUnstaking(true)
      const amount = ethers.parseEther(unstakeAmount)
      if (safeParseFloat(sETHBalance) < safeParseFloat(unstakeAmount)) {
        toast({
          title: "Insufficient sETH Balance",
          description: "You don't have enough sETH to unstake this amount.",
          variant: "destructive",
        })
        return
      }
      const tx = await sETHContract.connect(signer).unstake(amount)
      toast({ title: "Unstake submitted", description: tx.hash })
      await tx.wait()
      toast({ title: "Unstake confirmed", description: `${unstakeAmount} sETH → dETH` })
      setUnstakeAmount("")
      refreshBalances()
      checkAllowance()
    } catch (error) {
      toast({
        title: "Unstake failed",
        description: getTxErrorMessage(error, "Unstake did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsUnstaking(false)
    }
  }

  if (!isConnected) return <ConnectWalletGate feature="staking" />

  return (
    <div className="w-full max-w-xl">
      <PageHeader
        title="Stake"
        description="Lock dETH for sETH. Unstake to redeem."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="animate-slide-in">
          <div className="action-card">
            <h2 className="text-lg font-medium mb-1 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Layers className="h-5 w-5" style={{ color: TOKENS.dETH.color }} strokeWidth={2} />
              Stake dETH
            </h2>
            <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>Stake dETH and receive sETH.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="input-amount pr-16 border-0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm font-semibold mono" style={{ color: TOKENS.dETH.color }}>dETH</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span style={{ color: "var(--text-3)" }}>
                    Available:{" "}
                    <span className="mono" style={{ color: TOKENS.dETH.color }}>
                      {formatBalance(dETHBalance)} dETH
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStakeAmount(dETHBalance || "0")}
                    className="font-semibold"
                    style={{ color: "var(--green)" }}
                  >
                    Max
                  </button>
                </div>
              </div>

              {safeParseFloat(allowance) <= 0 && (
                <div
                  className="flex items-start gap-3 p-3 rounded-lg text-sm"
                  style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.25)",
                    color: SEMANTIC.avg,
                  }}
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Approve dETH once before staking. This is a one-time approval.</span>
                </div>
              )}

              {safeParseFloat(allowance) <= 0 ? (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving || isCheckingAllowance}
                  className="primary-button"
                >
                  {isApproving || isCheckingAllowance ? (
                    <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />{isApproving ? "Approving..." : "Checking..."}</>
                  ) : (
                    "Approve dETH"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStake}
                  disabled={!stakeAmount || isStaking || safeParseFloat(stakeAmount) <= 0}
                  className="primary-button"
                >
                  {isStaking ? (
                    <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />Staking...</>
                  ) : (
                    <><Layers className="h-4 w-4" strokeWidth={2.5} />Stake dETH</>
                  )}
                </button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="unstake" className="animate-slide-in">
          <div className="action-card">
            <h2 className="text-lg font-medium mb-1 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <ArrowUpFromLine className="h-5 w-5" style={{ color: TOKENS.sETH.color }} strokeWidth={2} />
              Unstake sETH
            </h2>
            <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>Unstake sETH and receive dETH.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="input-amount pr-16 border-0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm font-semibold mono" style={{ color: TOKENS.sETH.color }}>sETH</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span style={{ color: "var(--text-3)" }}>
                    Available:{" "}
                    <span className="mono" style={{ color: TOKENS.sETH.color }}>
                      {formatBalance(sETHBalance)} sETH
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnstakeAmount(sETHBalance || "0")}
                    className="font-semibold"
                    style={{ color: "var(--green)" }}
                  >
                    Max
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUnstake}
                disabled={!unstakeAmount || isUnstaking || safeParseFloat(unstakeAmount) <= 0}
                className="primary-button"
              >
                {isUnstaking ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />Unstaking...</>
                ) : (
                  <><ArrowUpFromLine className="h-4 w-4" strokeWidth={2.5} />Unstake sETH</>
                )}
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

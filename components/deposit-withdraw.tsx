"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { Input } from "@/components/ui/input"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { ConnectWalletGate } from "@/components/connect-wallet-gate"
import { formatBalance, safeParseFloat, TOKENS } from "@/lib/design-tokens"
import { getTxErrorMessage } from "@/lib/wallet"

export function DepositWithdraw() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const initialTab = tabParam === "withdraw" ? "withdraw" : "deposit"

  const { dETHContract, signer, isConnected, ethBalance, dETHBalance, refreshBalances } = useWeb3()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setActiveTab(tabParam === "withdraw" ? "withdraw" : "deposit")
  }, [tabParam])

  useEffect(() => {
    if (isConnected) refreshBalances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  const setMaxDeposit = () => {
    const bal = safeParseFloat(ethBalance)
    if (bal > 0.01) setDepositAmount((bal - 0.01).toFixed(18))
    else setDepositAmount("0")
  }

  const handleDeposit = async () => {
    if (!dETHContract || !signer || !depositAmount) return
    try {
      setIsDepositing(true)
      const amount = ethers.parseEther(depositAmount)
      if (safeParseFloat(ethBalance) < safeParseFloat(depositAmount)) {
        toast({
          title: "Insufficient ETH Balance",
          description: "You don't have enough ETH to complete this deposit.",
          variant: "destructive",
        })
        return
      }
      const tx = await dETHContract.connect(signer).deposit({ value: amount })
      toast({ title: "Deposit submitted", description: tx.hash })
      await tx.wait()
      toast({ title: "Deposit confirmed", description: `${depositAmount} ETH → dETH` })
      setDepositAmount("")
      refreshBalances()
    } catch (error) {
      toast({
        title: "Deposit failed",
        description: getTxErrorMessage(error, "Deposit did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!dETHContract || !signer || !withdrawAmount) return
    try {
      setIsWithdrawing(true)
      const amount = ethers.parseEther(withdrawAmount)
      if (safeParseFloat(dETHBalance) < safeParseFloat(withdrawAmount)) {
        toast({
          title: "Insufficient dETH Balance",
          description: "You don't have enough dETH to complete this withdrawal.",
          variant: "destructive",
        })
        return
      }
      const tx = await dETHContract.connect(signer).withdraw(amount)
      toast({ title: "Withdraw submitted", description: tx.hash })
      await tx.wait()
      toast({ title: "Withdraw confirmed", description: `${withdrawAmount} dETH → ETH` })
      setWithdrawAmount("")
      refreshBalances()
    } catch (error) {
      toast({
        title: "Withdraw failed",
        description: getTxErrorMessage(error, "Withdraw did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (!isConnected) return <ConnectWalletGate feature="deposit and withdraw" />

  return (
    <div className="w-full max-w-xl">
      <PageHeader
        title="Deposit"
        description="Mint dETH 1:1, or burn it for ETH."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="animate-slide-in">
          <div className="action-card">
            <h2 className="text-lg font-medium mb-1 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <PlusCircle className="h-5 w-5" style={{ color: TOKENS.ETH.color }} strokeWidth={2} />
              Deposit ETH
            </h2>
            <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>Add ETH to mint dETH at a 1:1 ratio.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input-amount pr-16 border-0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm font-semibold mono" style={{ color: TOKENS.ETH.color }}>ETH</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span style={{ color: "var(--text-3)" }}>
                    Available:{" "}
                    <span className="mono" style={{ color: TOKENS.ETH.color }}>
                      {formatBalance(ethBalance)} ETH
                    </span>
                  </span>
                  <button type="button" onClick={setMaxDeposit} className="font-semibold" style={{ color: "var(--green)" }}>
                    Max
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeposit}
                disabled={!depositAmount || isDepositing || safeParseFloat(depositAmount) <= 0}
                className="primary-button"
              >
                {isDepositing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />Depositing...</>
                ) : (
                  <><PlusCircle className="h-4 w-4" strokeWidth={2.5} />Deposit ETH</>
                )}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="withdraw" className="animate-slide-in">
          <div className="action-card">
            <h2 className="text-lg font-medium mb-1 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <MinusCircle className="h-5 w-5" style={{ color: TOKENS.dETH.color }} strokeWidth={2} />
              Withdraw
            </h2>
            <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>Burn dETH to redeem native ETH.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
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
                    onClick={() => setWithdrawAmount(dETHBalance || "0")}
                    className="font-semibold"
                    style={{ color: "var(--green)" }}
                  >
                    Max
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || isWithdrawing || safeParseFloat(withdrawAmount) <= 0}
                className="primary-button"
              >
                {isWithdrawing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />Withdrawing...</>
                ) : (
                  <><MinusCircle className="h-4 w-4" strokeWidth={2.5} />Withdraw ETH</>
                )}
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

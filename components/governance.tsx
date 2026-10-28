"use client"

import { useCallback, useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Clock, Loader2, FileText, Vote, AlertCircle } from "lucide-react"
import { RefreshButton } from "@/components/ui/refresh-button"
import { PageHeader } from "@/components/ui/page-header"
import { ConnectWalletGate } from "@/components/connect-wallet-gate"
import { SEMANTIC, safeParseFloat } from "@/lib/design-tokens"
import { getTxErrorMessage } from "@/lib/wallet"

type Proposal = {
  id: number
  proposer: string
  description: string
  createdAt: number
  votesFor: string
  votesAgainst: string
  executed: boolean
  canceled: boolean
  state: number
}

const STATE_CHIPS: Record<number, { label: string; className: string }> = {
  0: { label: "Active", className: "status-chip status-chip-active" },
  1: { label: "Defeated", className: "status-chip status-chip-defeated" },
  2: { label: "Succeeded", className: "status-chip status-chip-succeeded" },
  3: { label: "Executed", className: "status-chip status-chip-executed" },
  4: { label: "Expired", className: "status-chip status-chip-expired" },
  5: { label: "Canceled", className: "status-chip status-chip-canceled" },
}

export function Governance() {
  const { governanceContract, signer, isConnected, account, sETHBalance } = useWeb3()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState("")
  const [target, setTarget] = useState("")
  const [callData, setCallData] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isVoting, setIsVoting] = useState<Record<number, boolean>>({})
  const [isExecuting, setIsExecuting] = useState<Record<number, boolean>>({})
  const [isCanceling, setIsCanceling] = useState<Record<number, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchProposals = useCallback(async () => {
    if (!governanceContract) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const count = await governanceContract.proposalCount()
      const proposalCount = Number(count)
      const proposalPromises = []
      for (let i = 0; i < proposalCount; i++) {
        proposalPromises.push(governanceContract.getProposalDetails(i))
      }
      const proposalData = await Promise.all(proposalPromises)
      setProposals(
        proposalData.map((proposal, index) => ({
          id: index,
          proposer: proposal.proposer,
          description: proposal.description,
          createdAt: Number(proposal.createdAt),
          votesFor: ethers.formatEther(proposal.votesFor),
          votesAgainst: ethers.formatEther(proposal.votesAgainst),
          executed: proposal.executed,
          canceled: proposal.canceled,
          state: proposal.state,
        })),
      )
    } catch {
      setProposals([])
    } finally {
      setLoading(false)
    }
  }, [governanceContract])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchProposals()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const refreshOne = async (proposalId: number) => {
    if (!governanceContract || !signer) return
    const proposalData = await governanceContract.getProposalDetails(proposalId)
    const updated: Proposal = {
      id: proposalId,
      proposer: proposalData.proposer,
      description: proposalData.description,
      createdAt: Number(proposalData.createdAt),
      votesFor: ethers.formatEther(proposalData.votesFor),
      votesAgainst: ethers.formatEther(proposalData.votesAgainst),
      executed: proposalData.executed,
      canceled: proposalData.canceled,
      state: proposalData.state,
    }
    setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)))
  }

  const createProposal = async () => {
    if (!governanceContract || !signer || !description || !target) return
    try {
      setIsCreating(true)
      if (safeParseFloat(sETHBalance) < 1) {
        toast({
          title: "Insufficient sETH Balance",
          description: "You need at least 1 sETH to create a proposal.",
          variant: "destructive",
        })
        return
      }
      const formattedCallData = callData ? ethers.hexlify(ethers.toUtf8Bytes(callData)) : "0x"
      const tx = await governanceContract.connect(signer).createProposal(description, target, formattedCallData)
      toast({ title: "Proposal submitted", description: tx.hash })
      await tx.wait()
      toast({ title: "Proposal created" })
      setDescription("")
      setTarget("")
      setCallData("")
      fetchProposals()
    } catch (error) {
      toast({
        title: "Proposal failed",
        description: getTxErrorMessage(error, "Proposal did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const voteOnProposal = async (proposalId: number, support: boolean) => {
    if (!governanceContract || !signer) return
    try {
      setIsVoting((prev) => ({ ...prev, [proposalId]: true }))
      if (safeParseFloat(sETHBalance) <= 0) {
        toast({ title: "No Voting Power", description: "You need sETH tokens to vote on proposals.", variant: "destructive" })
        return
      }
      const tx = await governanceContract.connect(signer).castVote(proposalId, support)
      toast({ title: "Vote submitted", description: tx.hash })
      await tx.wait()
      toast({ title: support ? "Voted for" : "Voted against" })
      await refreshOne(proposalId)
    } catch (error) {
      toast({
        title: "Vote failed",
        description: getTxErrorMessage(error, "Vote did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsVoting((prev) => ({ ...prev, [proposalId]: false }))
    }
  }

  const executeProposal = async (proposalId: number) => {
    if (!governanceContract || !signer) return
    try {
      setIsExecuting((prev) => ({ ...prev, [proposalId]: true }))
      const tx = await governanceContract.connect(signer).executeProposal(proposalId)
      toast({ title: "Execute submitted", description: tx.hash })
      await tx.wait()
      toast({ title: "Proposal executed" })
      await refreshOne(proposalId)
    } catch (error) {
      toast({
        title: "Execute failed",
        description: getTxErrorMessage(error, "Execute did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsExecuting((prev) => ({ ...prev, [proposalId]: false }))
    }
  }

  const cancelProposal = async (proposalId: number) => {
    if (!governanceContract || !signer) return
    try {
      setIsCanceling((prev) => ({ ...prev, [proposalId]: true }))
      const cancelTx = await governanceContract.connect(signer).cancelProposal(proposalId)
      toast({ title: "Cancel submitted", description: cancelTx.hash })
      await cancelTx.wait()
      toast({ title: "Proposal canceled" })
      await refreshOne(proposalId)
    } catch (error) {
      toast({
        title: "Cancel failed",
        description: getTxErrorMessage(error, "Cancel did not confirm."),
        variant: "destructive",
      })
    } finally {
      setIsCanceling((prev) => ({ ...prev, [proposalId]: false }))
    }
  }

  if (!isConnected) return <ConnectWalletGate feature="governance" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance"
        description="Create proposals and vote with sETH."
        action={<RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />}
      />

      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 w-full rounded-xl bg-[var(--surface)] animate-pulse" />
              ))}
            </div>
          ) : proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal) => {
                const chip = STATE_CHIPS[proposal.state] || { label: "Unknown", className: "status-chip status-chip-expired" }
                return (
                  <div key={proposal.id} className="glass-card p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <FileText className="h-4 w-4 shrink-0" style={{ color: "var(--text-2)" }} />
                          <h3 className="font-medium" style={{ color: "var(--text)" }}>Proposal #{proposal.id}</h3>
                        </div>
                        <p className="text-xs sm:text-sm break-all sm:break-normal" style={{ color: "var(--text-3)" }}>
                          {proposal.proposer.substring(0, 6)}...{proposal.proposer.substring(38)} ·{" "}
                          {new Date(proposal.createdAt * 1000).toLocaleDateString()}
                        </p>
                        {proposal.description && (
                          <p className="text-sm mt-2 break-words" style={{ color: "var(--text-2)" }}>{proposal.description}</p>
                        )}
                      </div>
                      <span className={`${chip.className} self-start shrink-0`}>{chip.label}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="rounded-lg p-3" style={{ background: SEMANTIC.gainDim, border: "1px solid rgba(52,211,153,0.2)" }}>
                        <div className="text-xs mb-1" style={{ color: SEMANTIC.gain }}>Votes For</div>
                        <div className="mono text-base sm:text-lg font-semibold truncate" style={{ color: SEMANTIC.gain }}>
                          {safeParseFloat(proposal.votesFor).toFixed(2)} sETH
                        </div>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: SEMANTIC.lossDim, border: "1px solid rgba(248,113,113,0.2)" }}>
                        <div className="text-xs mb-1" style={{ color: SEMANTIC.loss }}>Votes Against</div>
                        <div className="mono text-base sm:text-lg font-semibold truncate" style={{ color: SEMANTIC.loss }}>
                          {safeParseFloat(proposal.votesAgainst).toFixed(2)} sETH
                        </div>
                      </div>
                    </div>

                    {proposal.state === 0 && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          className="secondary-button flex-1 w-full"
                          style={{ borderColor: "rgba(52,211,153,0.35)", color: SEMANTIC.gain }}
                          onClick={() => voteOnProposal(proposal.id, true)}
                          disabled={isVoting[proposal.id]}
                        >
                          {isVoting[proposal.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Vote For
                        </button>
                        <button
                          type="button"
                          className="secondary-button flex-1 w-full"
                          style={{ borderColor: "rgba(248,113,113,0.35)", color: SEMANTIC.loss }}
                          onClick={() => voteOnProposal(proposal.id, false)}
                          disabled={isVoting[proposal.id]}
                        >
                          {isVoting[proposal.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Vote Against
                        </button>
                      </div>
                    )}

                    {proposal.state === 2 && (
                      <button
                        type="button"
                        onClick={() => executeProposal(proposal.id)}
                        disabled={isExecuting[proposal.id]}
                        className="primary-button mt-2 w-full sm:w-auto"
                      >
                        {isExecuting[proposal.id] ? (
                          <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />Executing...</>
                        ) : (
                          <><CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />Execute Proposal</>
                        )}
                      </button>
                    )}

                    {proposal.state === 0 && proposal.proposer === account && (
                      <button
                        type="button"
                        onClick={() => cancelProposal(proposal.id)}
                        disabled={isCanceling[proposal.id]}
                        className="secondary-button w-full mt-2"
                        style={{ borderColor: "rgba(251,191,36,0.35)", color: SEMANTIC.avg }}
                      >
                        {isCanceling[proposal.id] ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Canceling...</>
                        ) : (
                          <><XCircle className="h-4 w-4" />Cancel Proposal</>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass-card p-6 sm:p-10 text-center" style={{ borderStyle: "dashed" }}>
              <Clock className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--text-3)" }} />
              <h3 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>No proposals yet</h3>
              <p className="text-sm max-w-md mx-auto px-2" style={{ color: "var(--text-2)" }}>
                Be the first to create a governance proposal and help shape the protocol.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <div className="action-card w-full max-w-xl">
            <h2 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Create New Proposal</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>Requires at least 1 sETH voting power.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Description</label>
                <Textarea
                  placeholder="Describe your proposal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Target Address</label>
                <Input placeholder="0x..." value={target} onChange={(e) => setTarget(e.target.value)} className="input-amount border-0" />
                <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                  Contract address called if the proposal passes.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-2)" }}>Call Data (Optional)</label>
                <Input
                  placeholder="Function call data..."
                  value={callData}
                  onChange={(e) => setCallData(e.target.value)}
                  className="input-amount border-0"
                />
              </div>

              {safeParseFloat(sETHBalance) < 1 && (
                <div
                  className="flex items-start gap-3 p-3 rounded-lg text-sm"
                  style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.25)",
                    color: SEMANTIC.avg,
                  }}
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>You need at least 1 sETH to create a proposal. Stake dETH to receive sETH.</span>
                </div>
              )}

              <button
                type="button"
                onClick={createProposal}
                disabled={!description || !target || isCreating || safeParseFloat(sETHBalance) < 1}
                className="primary-button"
              >
                {isCreating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />Creating Proposal...</>
                ) : (
                  <><Vote className="h-4 w-4" strokeWidth={2.5} />Create Proposal</>
                )}
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Governance

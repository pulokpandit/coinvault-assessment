import { ethers } from "ethers"

export const VIRTUAL_ACCOUNT = "0x1111111111111111111111111111111111111111"
export const VIRTUAL_SETH = "0x2222222222222222222222222222222222222222"
export const VIRTUAL_DETH = "0x3333333333333333333333333333333333333333"
export const VIRTUAL_CHAIN_ID = 31337

const STORAGE_KEY = "coinvault.virtual.chain"

type Staker = { amount: string; timestamp: number }
type Proposal = {
  proposer: string
  description: string
  createdAt: number
  votesFor: string
  votesAgainst: string
  executed: boolean
  canceled: boolean
  state: number
}

type VirtualState = {
  eth: string
  dETH: string
  sETH: string
  allowance: string
  stakers: Record<string, Staker>
  proposals: Proposal[]
}

const ZERO = 0n
const seedStakers: Record<string, Staker> = {
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": { amount: ethers.parseEther("5").toString(), timestamp: 1_720_000_000 },
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb": { amount: ethers.parseEther("3").toString(), timestamp: 1_720_100_000 },
  "0xcccccccccccccccccccccccccccccccccccccccc": { amount: ethers.parseEther("1.5").toString(), timestamp: 1_720_200_000 },
}

const defaultState = (): VirtualState => ({
  eth: ethers.parseEther("10").toString(),
  dETH: "0",
  sETH: "0",
  allowance: "0",
  stakers: { ...seedStakers },
  proposals: [],
})

let state: VirtualState = defaultState()

function loadState() {
  if (typeof window === "undefined") return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) state = { ...defaultState(), ...JSON.parse(raw) }
  } catch {
    state = defaultState()
  }
}

function saveState() {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

if (typeof window !== "undefined") loadState()

const toWei = (value: bigint | string | number) => BigInt(value)
const sleep = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms))

function fakeTx() {
  const hash = ethers.hexlify(ethers.randomBytes(32))
  return {
    hash,
    wait: async () => {
      await sleep(200)
      return { status: 1, hash }
    },
  }
}

function rankedStakers() {
  return Object.entries(state.stakers)
    .filter(([, row]) => toWei(row.amount) > ZERO)
    .sort((a, b) => Number(toWei(b[1].amount) - toWei(a[1].amount)))
}

function totalStakedWei() {
  return rankedStakers().reduce((sum, [, row]) => sum + toWei(row.amount), ZERO)
}

function totalDepositedWei() {
  return toWei(state.dETH) + totalStakedWei()
}

export function getVirtualBalances() {
  return {
    eth: ethers.formatEther(state.eth),
    dETH: ethers.formatEther(state.dETH),
    sETH: ethers.formatEther(state.sETH),
  }
}

function withConnect<T extends object>(methods: T) {
  return Object.assign(methods, {
    connect: () => methods,
  })
}

export function createVirtualContracts(account: string) {
  const dETH = withConnect({
    target: VIRTUAL_DETH,
    address: VIRTUAL_DETH,
    balanceOf: async (owner: string) => (owner.toLowerCase() === account.toLowerCase() ? toWei(state.dETH) : ZERO),
    allowance: async () => toWei(state.allowance),
    approve: async () => {
      await sleep()
      state.allowance = ethers.MaxUint256.toString()
      saveState()
      return fakeTx()
    },
    deposit: async (overrides?: { value?: bigint }) => {
      await sleep()
      const amount = toWei(overrides?.value || 0)
      if (toWei(state.eth) < amount) throw new Error("Insufficient ETH")
      state.eth = (toWei(state.eth) - amount).toString()
      state.dETH = (toWei(state.dETH) + amount).toString()
      saveState()
      return fakeTx()
    },
    withdraw: async (amount: bigint) => {
      await sleep()
      const value = toWei(amount)
      if (toWei(state.dETH) < value) throw new Error("Insufficient dETH")
      state.dETH = (toWei(state.dETH) - value).toString()
      state.eth = (toWei(state.eth) + value).toString()
      saveState()
      return fakeTx()
    },
  })

  const sETH = withConnect({
    target: VIRTUAL_SETH,
    address: VIRTUAL_SETH,
    balanceOf: async (owner: string) => (owner.toLowerCase() === account.toLowerCase() ? toWei(state.sETH) : ZERO),
    totalStaked: async () => totalStakedWei(),
    stake: async (amount: bigint) => {
      await sleep()
      const value = toWei(amount)
      if (toWei(state.dETH) < value) throw new Error("Insufficient dETH")
      if (toWei(state.allowance) < value) throw new Error("Insufficient allowance")
      state.dETH = (toWei(state.dETH) - value).toString()
      state.sETH = (toWei(state.sETH) + value).toString()
      const current = state.stakers[account] || { amount: "0", timestamp: Math.floor(Date.now() / 1000) }
      state.stakers[account] = {
        amount: (toWei(current.amount) + value).toString(),
        timestamp: current.timestamp || Math.floor(Date.now() / 1000),
      }
      saveState()
      return fakeTx()
    },
    unstake: async (amount: bigint) => {
      await sleep()
      const value = toWei(amount)
      if (toWei(state.sETH) < value) throw new Error("Insufficient sETH")
      state.sETH = (toWei(state.sETH) - value).toString()
      state.dETH = (toWei(state.dETH) + value).toString()
      const current = state.stakers[account]
      if (current) {
        const next = toWei(current.amount) - value
        if (next <= ZERO) delete state.stakers[account]
        else state.stakers[account] = { ...current, amount: next.toString() }
      }
      saveState()
      return fakeTx()
    },
    updateLeaderboard: async () => {
      await sleep()
      return fakeTx()
    },
  })

  const governance = withConnect({
    proposalCount: async () => BigInt(state.proposals.length),
    getProposalDetails: async (id: number) => {
      const proposal = state.proposals[Number(id)]
      if (!proposal) throw new Error("Proposal not found")
      return {
        ...proposal,
        createdAt: BigInt(proposal.createdAt),
        votesFor: toWei(proposal.votesFor),
        votesAgainst: toWei(proposal.votesAgainst),
      }
    },
    createProposal: async (description: string, _target?: string, _callData?: string) => {
      await sleep()
      state.proposals.push({
        proposer: account,
        description,
        createdAt: Math.floor(Date.now() / 1000),
        votesFor: "0",
        votesAgainst: "0",
        executed: false,
        canceled: false,
        state: 0,
      })
      saveState()
      return fakeTx()
    },
    castVote: async (id: number, support: boolean) => {
      await sleep()
      const proposal = state.proposals[Number(id)]
      if (!proposal) throw new Error("Proposal not found")
      const weight = toWei(state.sETH)
      if (support) proposal.votesFor = (toWei(proposal.votesFor) + weight).toString()
      else proposal.votesAgainst = (toWei(proposal.votesAgainst) + weight).toString()
      saveState()
      return fakeTx()
    },
    executeProposal: async (id: number) => {
      await sleep()
      const proposal = state.proposals[Number(id)]
      if (!proposal) throw new Error("Proposal not found")
      proposal.executed = true
      proposal.state = 3
      saveState()
      return fakeTx()
    },
    cancelProposal: async (id: number) => {
      await sleep()
      const proposal = state.proposals[Number(id)]
      if (!proposal) throw new Error("Proposal not found")
      proposal.canceled = true
      proposal.state = 5
      saveState()
      return fakeTx()
    },
  })

  const stakingDashboard = withConnect({
    getStakingOverview: async () => {
      const staked = totalStakedWei()
      const stakers = rankedStakers()
      const average = stakers.length ? staked / BigInt(stakers.length) : ZERO
      return {
        totalETHDeposited: totalDepositedWei(),
        totalETHStaked: staked,
        totalStakers: BigInt(stakers.length),
        averageStakeAmount: average,
      }
    },
    getStakerDetails: async (owner: string) => {
      const ranked = rankedStakers()
      const index = ranked.findIndex(([address]) => address.toLowerCase() === owner.toLowerCase())
      const row = index >= 0 ? ranked[index][1] : { amount: "0", timestamp: 0 }
      const staked = totalStakedWei()
      const share = staked === ZERO ? 0n : (toWei(row.amount) * 10000n) / staked
      return {
        stakedAmount: toWei(row.amount),
        stakingTimestamp: BigInt(row.timestamp),
        rank: BigInt(index >= 0 ? index + 1 : 0),
        percentageOfTotal: share,
      }
    },
    getLeaderboard: async (count = 10) => {
      const ranked = rankedStakers().slice(0, Number(count))
      const staked = totalStakedWei()
      return {
        stakerAddresses: ranked.map(([address]) => address),
        stakedAmounts: ranked.map(([, row]) => toWei(row.amount)),
        percentageOfTotal: ranked.map(([, row]) => (staked === ZERO ? 0n : (toWei(row.amount) * 10000n) / staked)),
      }
    },
  })

  const provider = {
    getBalance: async (owner: string) =>
      owner.toLowerCase() === account.toLowerCase() ? toWei(state.eth) : ZERO,
  }

  return { dETH, sETH, governance, stakingDashboard, provider }
}

"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import dETHAbi from "@/lib/abis/dETH.json"
import sETHAbi from "@/lib/abis/sETH.json"
import governanceAbi from "@/lib/abis/governance.json"
import stakingDashboardAbi from "@/lib/abis/stakingDashboard.json"
import {
  CHAIN_ID,
  DETH_ADDRESS,
  GOVERNANCE_ADDRESS,
  NETWORK_NAME,
  RPC_CANDIDATES,
  RPC_URL,
  SETH_ADDRESS,
  STAKING_DASHBOARD_ADDRESS,
  isConfiguredAddress,
} from "@/lib/network"
import {
  ensureChain,
  findWalletById,
  forgetWalletSession,
  getInjectedEthereum,
  getLastWalletId,
  getTxErrorMessage,
  getWalletChainId,
  readEtherBalance,
  readTokenBalance,
  rememberLastWallet,
  rememberWalletSession,
  shouldReconnectWallet,
  shortenAddress,
  waitForInjectedEthereum,
  type InjectedEthereum,
} from "@/lib/wallet"
import { VIRTUAL_ACCOUNT, VIRTUAL_CHAIN_ID, createVirtualContracts, getVirtualBalances } from "@/lib/virtual-chain"

const BALANCE_POLL_MS = 15_000

const createPublicProvider = (url: string) =>
  new ethers.JsonRpcProvider(url, CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 })

async function resolveReadProvider(walletProvider?: ethers.BrowserProvider | null) {
  for (const url of RPC_CANDIDATES) {
    try {
      const candidate = createPublicProvider(url)
      await candidate.getBlockNumber()
      return candidate
    } catch {
      continue
    }
  }

  if (walletProvider) {
    try {
      const network = await walletProvider.getNetwork()
      if (Number(network.chainId) === CHAIN_ID) return walletProvider
    } catch {
      // Fall through to the first configured RPC.
    }
  }

  return walletProvider ?? createPublicProvider(RPC_URL)
}

type Web3ContextValue = {
  account: string | null
  provider: ethers.Provider | null
  signer: ethers.JsonRpcSigner | null
  dETHContract: ethers.Contract | null
  sETHContract: ethers.Contract | null
  governanceContract: ethers.Contract | null
  stakingDashboardContract: ethers.Contract | null
  connectWallet: (provider?: InjectedEthereum) => Promise<void>
  connectVirtualWallet: () => Promise<void>
  openConnectModal: () => void
  closeConnectModal: () => void
  connectModalOpen: boolean
  isConnecting: boolean
  disconnectWallet: () => void
  isConnected: boolean
  isVirtual: boolean
  isHydrated: boolean
  hasWallet: boolean
  walletAlarmOpen: boolean
  openWalletAlarm: () => void
  closeWalletAlarm: () => void
  chainId: number | null
  refreshBalances: () => Promise<void>
  networkName: string
  ethBalance: string
  dETHBalance: string
  sETHBalance: string
}

const Web3Context = createContext<Web3ContextValue | null>(null)

export function useWeb3() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error("useWeb3 must be used within Web3Provider")
  }
  return context
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.Provider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [dETHContract, setDETHContract] = useState<ethers.Contract | null>(null)
  const [sETHContract, setSETHContract] = useState<ethers.Contract | null>(null)
  const [governanceContract, setGovernanceContract] = useState<ethers.Contract | null>(null)
  const [stakingDashboardContract, setStakingDashboardContract] = useState<ethers.Contract | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasWallet, setHasWallet] = useState(false)
  const [walletAlarmOpen, setWalletAlarmOpen] = useState(false)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVirtual, setIsVirtual] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [networkName, setNetworkName] = useState("")
  const [ethBalance, setEthBalance] = useState("0")
  const [dETHBalance, setDETHBalance] = useState("0")
  const [sETHBalance, setSETHBalance] = useState("0")
  const { toast } = useToast()

  const resetSession = useCallback(() => {
    setAccount(null)
    setSigner(null)
    setIsConnected(false)
    setNetworkName("")
    setEthBalance("0")
    setDETHBalance("0")
    setSETHBalance("0")
    setDETHContract(null)
    setSETHContract(null)
    setGovernanceContract(null)
    setStakingDashboardContract(null)
    setIsVirtual(false)
    forgetWalletSession()
  }, [])

  const loadBalances = useCallback(async (address: string, readProvider: ethers.Provider, virtual = false) => {
    if (virtual) {
      const balances = getVirtualBalances()
      setEthBalance(balances.eth)
      setDETHBalance(balances.dETH)
      setSETHBalance(balances.sETH)
      return
    }

    try {
      setEthBalance(await readEtherBalance(readProvider, address))
    } catch {
      setEthBalance("0")
    }

    try {
      setDETHBalance(
        isConfiguredAddress(DETH_ADDRESS)
          ? await readTokenBalance(new ethers.Contract(DETH_ADDRESS, dETHAbi, readProvider), address)
          : "0"
      )
    } catch {
      setDETHBalance("0")
    }

    try {
      setSETHBalance(
        isConfiguredAddress(SETH_ADDRESS)
          ? await readTokenBalance(new ethers.Contract(SETH_ADDRESS, sETHAbi, readProvider), address)
          : "0"
      )
    } catch {
      setSETHBalance("0")
    }
  }, [])

  const attachContracts = useCallback((readProvider: ethers.Provider) => {
    setDETHContract(isConfiguredAddress(DETH_ADDRESS) ? new ethers.Contract(DETH_ADDRESS, dETHAbi, readProvider) : null)
    setSETHContract(isConfiguredAddress(SETH_ADDRESS) ? new ethers.Contract(SETH_ADDRESS, sETHAbi, readProvider) : null)
    setGovernanceContract(
      isConfiguredAddress(GOVERNANCE_ADDRESS) ? new ethers.Contract(GOVERNANCE_ADDRESS, governanceAbi, readProvider) : null
    )
    setStakingDashboardContract(
      isConfiguredAddress(STAKING_DASHBOARD_ADDRESS)
        ? new ethers.Contract(STAKING_DASHBOARD_ADDRESS, stakingDashboardAbi, readProvider)
        : null
    )
  }, [])

  const connectWallet = useCallback(async (options?: { silent?: boolean; provider?: InjectedEthereum; walletId?: string }) => {
    const ethereum =
      options?.provider ||
      findWalletById(options?.walletId || getLastWalletId())?.provider ||
      (options?.silent ? getInjectedEthereum() : await waitForInjectedEthereum())

    if (!ethereum) {
      if (!options?.silent) setWalletAlarmOpen(true)
      return
    }

    if (!options?.silent) setIsConnecting(true)

    try {
      const accounts = (await ethereum.request({
        method: options?.silent ? "eth_accounts" : "eth_requestAccounts",
        params: [],
      })) as string[]
      if (!accounts.length) {
        if (options?.silent) forgetWalletSession()
        return
      }

      const userAddress = accounts[0]
      rememberWalletSession()
      if (options?.walletId) rememberLastWallet(options.walletId)

      try {
        await ensureChain(ethereum)
      } catch (switchError) {
        if (!options?.silent) {
          toast({
            title: "Switch network",
            description: getTxErrorMessage(switchError, `Approve the switch to ${NETWORK_NAME} in your wallet.`),
            variant: "destructive",
          })
        }
      }

      const browserProvider = new ethers.BrowserProvider(ethereum)
      const readProvider = await resolveReadProvider(browserProvider)
      const web3Signer = await browserProvider.getSigner()
      const walletChainId = await getWalletChainId(ethereum)

      setAccount(userAddress)
      setProvider(readProvider)
      setSigner(web3Signer)
      setIsConnected(true)
      setIsVirtual(false)
      setChainId(walletChainId)
      setNetworkName(walletChainId === CHAIN_ID ? NETWORK_NAME : `Chain ${walletChainId}`)
      setConnectModalOpen(false)
      attachContracts(readProvider)
      await loadBalances(userAddress, readProvider)

      if (!options?.silent) {
        toast({
          title: "Connected",
          description: shortenAddress(userAddress),
        })
      }
    } catch (error) {
      if (options?.silent) return
      toast({
        title: "Connection failed",
        description: getTxErrorMessage(error, "Wallet request was rejected or failed."),
        variant: "destructive",
      })
    } finally {
      if (!options?.silent) setIsConnecting(false)
    }
  }, [attachContracts, loadBalances, toast])

  const connectVirtualWallet = useCallback(async (options?: { silent?: boolean }) => {
    const contracts = createVirtualContracts(VIRTUAL_ACCOUNT)
    setAccount(VIRTUAL_ACCOUNT)
    setProvider(contracts.provider as unknown as ethers.Provider)
    setSigner({ getAddress: async () => VIRTUAL_ACCOUNT } as ethers.JsonRpcSigner)
    setDETHContract(contracts.dETH as unknown as ethers.Contract)
    setSETHContract(contracts.sETH as unknown as ethers.Contract)
    setGovernanceContract(contracts.governance as unknown as ethers.Contract)
    setStakingDashboardContract(contracts.stakingDashboard as unknown as ethers.Contract)
    setIsConnected(true)
    setIsVirtual(true)
    setChainId(VIRTUAL_CHAIN_ID)
    setNetworkName("Demo")
    setConnectModalOpen(false)
    rememberWalletSession()
    rememberLastWallet("virtual")
    await loadBalances(VIRTUAL_ACCOUNT, contracts.provider as unknown as ethers.Provider, true)
    if (!options?.silent) {
      toast({
        title: "Demo wallet connected",
        description: "Frontend simulation — no MetaMask or testnet required.",
      })
    }
  }, [loadBalances, toast])

  const disconnectWallet = useCallback(() => {
    resetSession()
  }, [resetSession])

  const refreshBalances = useCallback(async () => {
    if (!account) return
    if (isVirtual) {
      await loadBalances(account, provider as ethers.Provider, true)
      return
    }
    const readProvider = provider ?? (await resolveReadProvider(getInjectedEthereum() ? new ethers.BrowserProvider(getInjectedEthereum()!) : null))
    await loadBalances(account, readProvider)
  }, [account, isVirtual, loadBalances, provider])

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      const ethereum = await waitForInjectedEthereum()
      if (cancelled) return
      setIsHydrated(true)
      setHasWallet(Boolean(ethereum))
      if (getLastWalletId() === "virtual" && shouldReconnectWallet()) {
        void connectVirtualWallet({ silent: true })
        return
      }
      if (ethereum && shouldReconnectWallet()) {
        void connectWallet({ silent: true })
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
    // Reconnect only on first mount. connectWallet is stable enough for this call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isVirtual) return
    const ethereum = getInjectedEthereum()
    if (!ethereum) return

    const onAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? accounts : []
      if (!list.length) {
        resetSession()
        return
      }
      if (isConnected) void connectWallet({ silent: true })
    }

    const onChainChanged = (nextChainId: unknown) => {
      const parsed = Number.parseInt(String(nextChainId), 16)
      setChainId(parsed)
      if (!isConnected) return
      if (parsed !== CHAIN_ID) {
        toast({
          title: "Wrong network",
          description: `Switch to ${NETWORK_NAME} (${CHAIN_ID}).`,
          variant: "destructive",
        })
        resetSession()
        return
      }
      void connectWallet({ silent: true })
    }

    ethereum.on("accountsChanged", onAccountsChanged)
    ethereum.on("chainChanged", onChainChanged)
    return () => {
      ethereum.removeListener("accountsChanged", onAccountsChanged)
      ethereum.removeListener("chainChanged", onChainChanged)
    }
  }, [connectWallet, isConnected, isVirtual, resetSession, toast])

  useEffect(() => {
    if (!isConnected || !account) return
    const id = window.setInterval(() => {
      void refreshBalances()
    }, BALANCE_POLL_MS)
    return () => window.clearInterval(id)
  }, [account, isConnected, refreshBalances])

  const value = useMemo<Web3ContextValue>(
    () => ({
      account,
      provider,
      signer,
      dETHContract,
      sETHContract,
      governanceContract,
      stakingDashboardContract,
      connectWallet: (provider?: InjectedEthereum) => connectWallet({ provider }),
      connectVirtualWallet: () => connectVirtualWallet(),
      openConnectModal: () => setConnectModalOpen(true),
      closeConnectModal: () => setConnectModalOpen(false),
      connectModalOpen,
      isConnecting,
      disconnectWallet,
      isConnected,
      isVirtual,
      isHydrated,
      hasWallet,
      walletAlarmOpen,
      openWalletAlarm: () => setWalletAlarmOpen(true),
      closeWalletAlarm: () => setWalletAlarmOpen(false),
      chainId,
      refreshBalances,
      networkName,
      ethBalance,
      dETHBalance,
      sETHBalance,
    }),
    [
      account,
      chainId,
      connectModalOpen,
      connectVirtualWallet,
      connectWallet,
      dETHBalance,
      dETHContract,
      disconnectWallet,
      ethBalance,
      governanceContract,
      hasWallet,
      isConnected,
      isConnecting,
      isHydrated,
      isVirtual,
      networkName,
      provider,
      refreshBalances,
      sETHBalance,
      sETHContract,
      signer,
      stakingDashboardContract,
      walletAlarmOpen,
    ]
  )

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

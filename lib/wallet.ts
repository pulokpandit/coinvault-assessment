import { ethers } from "ethers"
import { CHAIN_ID, walletAddEthereumChainParams } from "@/lib/network"

const RECONNECT_KEY = "coinvault.wallet.reconnect"
const LAST_WALLET_KEY = "coinvault.wallet.last"

export function shouldReconnectWallet() {
  try {
    return window.localStorage.getItem(RECONNECT_KEY) === "1"
  } catch {
    return false
  }
}

export function rememberWalletSession() {
  try {
    window.localStorage.setItem(RECONNECT_KEY, "1")
  } catch {
    // Private mode can block storage; reconnect is optional.
  }
}

export function forgetWalletSession() {
  try {
    window.localStorage.removeItem(RECONNECT_KEY)
    window.localStorage.removeItem(LAST_WALLET_KEY)
  } catch {
    // Ignore storage failures.
  }
}

export function rememberLastWallet(id: string) {
  try {
    window.localStorage.setItem(LAST_WALLET_KEY, id)
  } catch {
    // Ignore storage failures.
  }
}

export function getLastWalletId() {
  try {
    return window.localStorage.getItem(LAST_WALLET_KEY)
  } catch {
    return null
  }
}

export function findWalletById(id?: string | null) {
  if (!id) return undefined
  return listDiscoveredWallets().find((wallet) => wallet.id === id || wallet.rdns === id)
}

export type InjectedEthereum = {
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  isRabby?: boolean
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void
  providers?: InjectedEthereum[]
}

export type Eip6963ProviderInfo = {
  uuid: string
  name: string
  icon: string
  rdns: string
}

export type DiscoveredWallet = {
  id: string
  name: string
  icon?: string
  rdns?: string
  detected: boolean
  provider?: InjectedEthereum
  installUrl?: string
}

declare global {
  interface Window {
    ethereum?: InjectedEthereum
  }
}

const announced = new Map<string, DiscoveredWallet>()
const walletListeners = new Set<(wallets: DiscoveredWallet[]) => void>()

const METAMASK_INSTALL_URL = "https://metamask.io/download/"

function notifyWalletListeners() {
  const wallets = listDiscoveredWallets()
  walletListeners.forEach((listener) => listener(wallets))
}

function upsertAnnounced(info: Eip6963ProviderInfo, provider: InjectedEthereum) {
  announced.set(info.uuid, {
    id: info.uuid,
    name: info.name,
    icon: info.icon,
    rdns: info.rdns,
    detected: true,
    provider,
  })
  notifyWalletListeners()
}

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", ((event: CustomEvent<{ info: Eip6963ProviderInfo; provider: InjectedEthereum }>) => {
    if (event.detail?.info && event.detail.provider) {
      upsertAnnounced(event.detail.info, event.detail.provider)
    }
  }) as EventListener)
  window.dispatchEvent(new Event("eip6963:requestProvider"))
}

export function listDiscoveredWallets(): DiscoveredWallet[] {
  const wallets = [...announced.values()].sort((a, b) => a.name.localeCompare(b.name))
  const hasMetaMask = wallets.some((wallet) => /metamask/i.test(wallet.name) || wallet.rdns?.includes("metamask"))
  if (!hasMetaMask) {
    const injected = typeof window !== "undefined" ? window.ethereum : undefined
    const metamask = injected?.isMetaMask
      ? injected
      : injected?.providers?.find((provider) => provider.isMetaMask)
    wallets.unshift({
      id: "metamask",
      name: "MetaMask",
      detected: Boolean(metamask),
      provider: metamask,
      installUrl: METAMASK_INSTALL_URL,
    })
  }

  const injected = typeof window !== "undefined" ? window.ethereum : undefined
  if (injected && !wallets.some((wallet) => wallet.provider === injected)) {
    wallets.push({
      id: "injected",
      name: "Browser Wallet",
      detected: true,
      provider: injected,
    })
  }

  return wallets
}

export function subscribeDiscoveredWallets(listener: (wallets: DiscoveredWallet[]) => void) {
  walletListeners.add(listener)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("eip6963:requestProvider"))
  }
  listener(listDiscoveredWallets())
  return () => {
    walletListeners.delete(listener)
  }
}

export function getInjectedEthereum(): InjectedEthereum | undefined {
  if (typeof window === "undefined") return undefined

  const announcedMetaMask = [...announced.values()].find(
    (wallet) => wallet.provider && (/metamask/i.test(wallet.name) || wallet.rdns?.includes("metamask"))
  )
  if (announcedMetaMask?.provider) return announcedMetaMask.provider

  const firstAnnounced = [...announced.values()][0]?.provider
  if (firstAnnounced) return firstAnnounced

  const injected = window.ethereum
  if (!injected) return undefined
  if (Array.isArray(injected.providers) && injected.providers.length) {
    return injected.providers.find((provider) => provider.isMetaMask) || injected.providers[0]
  }
  return injected
}

export async function waitForInjectedEthereum(timeoutMs = 2000) {
  const existing = getInjectedEthereum()
  if (existing) return existing

  return new Promise<InjectedEthereum | undefined>((resolve) => {
    const finish = () => {
      window.removeEventListener("ethereum#initialized", onReady)
      window.removeEventListener("eip6963:announceProvider", onReady)
      resolve(getInjectedEthereum())
    }
    const onReady = () => {
      window.clearTimeout(timer)
      finish()
    }
    const timer = window.setTimeout(finish, timeoutMs)
    window.addEventListener("ethereum#initialized", onReady, { once: true })
    window.addEventListener("eip6963:announceProvider", onReady, { once: true })
    window.dispatchEvent(new Event("eip6963:requestProvider"))
  })
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export async function getWalletChainId(ethereum: InjectedEthereum) {
  const hex = String(await ethereum.request({ method: "eth_chainId" }))
  return Number.parseInt(hex, 16)
}

export async function ensureChain(ethereum: InjectedEthereum) {
  const currentId = await getWalletChainId(ethereum)
  if (currentId === CHAIN_ID) return

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: walletAddEthereumChainParams.chainId }],
    })
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? Number(error.code) : 0
    if (code !== 4902) throw error
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [walletAddEthereumChainParams],
    })
  }
}

export async function readEtherBalance(provider: ethers.Provider, address: string) {
  return ethers.formatEther(await provider.getBalance(address))
}

export async function readTokenBalance(contract: ethers.Contract, address: string) {
  return ethers.formatEther(await contract.balanceOf(address))
}

export function getTxErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    if ("shortMessage" in error && typeof error.shortMessage === "string") {
      return error.shortMessage
    }
    if ("code" in error && (error.code === 4001 || error.code === "ACTION_REJECTED")) {
      return "Transaction rejected in wallet."
    }
    if ("code" in error && error.code === -32002) {
      return "A wallet request is already open. Check the extension popup."
    }
  }
  if (error instanceof Error && /user rejected/i.test(error.message)) {
    return "Transaction rejected in wallet."
  }
  return fallback
}

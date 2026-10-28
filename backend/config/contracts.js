const SEPOLIA_CHAIN_ID = 11155111;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const CHAIN_ID =
  Number(
    process.env.CHAIN_ID ||
      process.env.NEXT_PUBLIC_CHAIN_ID ||
      process.env.HOLESKY_CHAIN_ID ||
      process.env.NEXT_PUBLIC_HOLESKY_CHAIN_ID
  ) || SEPOLIA_CHAIN_ID;

const RPC_URLS = [
  process.env.RPC_URL,
  process.env.HOLESKY_RPC_URL,
  process.env.NEXT_PUBLIC_RPC_URL,
  process.env.NEXT_PUBLIC_HOLESKY_RPC_URL,
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://ethereum-sepolia.publicnode.com",
  "https://rpc.sepolia.org",
].filter(Boolean);

const RPC_URL = RPC_URLS[0];

const ADDRESSES = {
  dETH: process.env.DETH_ADDRESS || process.env.NEXT_PUBLIC_DETH_ADDRESS || "",
  sETH: process.env.SETH_ADDRESS || process.env.NEXT_PUBLIC_SETH_ADDRESS || "",
  governance: process.env.GOVERNANCE_ADDRESS || process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || "",
  stakingDashboard:
    process.env.STAKING_DASHBOARD_ADDRESS || process.env.NEXT_PUBLIC_STAKING_DASHBOARD_ADDRESS || "",
};

const VAULTS = [
  {
    _id: "deth",
    name: "Deposit ETH (dETH)",
    description: "Deposit ETH and receive dETH at a 1:1 ratio.",
    category: "vault",
    tokenSymbol: "dETH",
    vaultType: "deposit",
    defaultAction: "deposit",
    contractAddress: ADDRESSES.dETH,
    chainId: CHAIN_ID,
    price: 0,
    cuttedPrice: 0,
    stock: 0,
    highlights: ["ETH deposit", "1:1 dETH mint", "Sepolia"],
  },
  {
    _id: "seth",
    name: "Staked ETH (sETH)",
    description: "Stake dETH to receive sETH and appear on the leaderboard.",
    category: "vault",
    tokenSymbol: "sETH",
    vaultType: "stake",
    defaultAction: "stake",
    contractAddress: ADDRESSES.sETH,
    chainId: CHAIN_ID,
    price: 0,
    cuttedPrice: 0,
    stock: 0,
    highlights: ["dETH staking", "sETH receipt", "Leaderboard rank"],
  },
  {
    _id: "governance",
    name: "Governance",
    description: "Create and vote on proposals using sETH voting weight.",
    category: "governance",
    tokenSymbol: "sETH",
    vaultType: "governance",
    defaultAction: "vote",
    contractAddress: ADDRESSES.governance,
    chainId: CHAIN_ID,
    price: 0,
    cuttedPrice: 0,
    stock: 0,
    highlights: ["Proposal creation", "sETH voting", "Timelock execution"],
  },
  {
    _id: "dashboard",
    name: "Staking Dashboard",
    description: "Protocol TVL, staker count, and leaderboard views.",
    category: "stats",
    tokenSymbol: "ETH",
    vaultType: "dashboard",
    defaultAction: "view",
    contractAddress: ADDRESSES.stakingDashboard,
    chainId: CHAIN_ID,
    price: 0,
    cuttedPrice: 0,
    stock: 0,
    highlights: ["TVL", "Staker stats", "Leaderboard"],
  },
];

const getVaultCatalog = () => VAULTS.map((vault) => ({ ...vault }));

const getVaultById = (id) => {
  if (!id) return null;
  return VAULTS.find((vault) => vault._id.toLowerCase() === String(id).toLowerCase()) || null;
};

const getVaultByAddress = (address) => {
  if (!address) return null;
  return (
    VAULTS.find((vault) => vault.contractAddress.toLowerCase() === String(address).toLowerCase()) ||
    null
  );
};

const knownAddresses = () =>
  Object.values(ADDRESSES)
    .filter(Boolean)
    .map((address) => address.toLowerCase());

module.exports = {
  CHAIN_ID,
  HOLESKY_CHAIN_ID: CHAIN_ID,
  RPC_URL,
  HOLESKY_RPC_URL: RPC_URL,
  RPC_URLS,
  HOLESKY_RPC_URLS: RPC_URLS,
  ADDRESSES,
  VAULTS,
  ZERO_ADDRESS,
  getVaultCatalog,
  getVaultById,
  getVaultByAddress,
  knownAddresses,
};

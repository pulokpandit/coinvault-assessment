const path = require("path");
const { ethers } = require("ethers");
const {
  CHAIN_ID,
  HOLESKY_RPC_URLS,
  ADDRESSES,
  ZERO_ADDRESS,
  getVaultById,
  getVaultByAddress,
} = require("../config/contracts");

const abiDir = path.join(__dirname, "../../lib/abis");

let provider;
let contracts;

const createProvider = (url) =>
  new ethers.JsonRpcProvider(url, CHAIN_ID, {
    staticNetwork: true,
    batchMaxCount: 1,
  });

const getProvider = () => {
  if (!provider) {
    provider = createProvider(HOLESKY_RPC_URLS[0]);
  }
  return provider;
};

const loadAbi = (fileName) => require(path.join(abiDir, fileName));

const getContracts = () => {
  if (!contracts) {
    const readProvider = getProvider();
    contracts = {
      dETH: new ethers.Contract(ADDRESSES.dETH || ZERO_ADDRESS, loadAbi("dETH.json"), readProvider),
      sETH: new ethers.Contract(ADDRESSES.sETH || ZERO_ADDRESS, loadAbi("sETH.json"), readProvider),
      governance: new ethers.Contract(
        ADDRESSES.governance || ZERO_ADDRESS,
        loadAbi("governance.json"),
        readProvider
      ),
      stakingDashboard: new ethers.Contract(
        ADDRESSES.stakingDashboard || ZERO_ADDRESS,
        loadAbi("stakingDashboard.json"),
        readProvider
      ),
    };
  }
  return contracts;
};

const formatEth = (value) => {
  try {
    return ethers.formatEther(value || 0);
  } catch (error) {
    return "0";
  }
};

const getProtocolStats = async () => {
  try {
    const { stakingDashboard, governance } = getContracts();
    const overview = await stakingDashboard.getStakingOverview();
    const proposalCount = await governance.proposalCount();
    return {
      chainId: CHAIN_ID,
      totalETHDeposited: formatEth(overview.totalETHDeposited),
      totalETHStaked: formatEth(overview.totalETHStaked),
      totalStakers: overview.totalStakers.toString(),
      averageStakeAmount: formatEth(overview.averageStakeAmount),
      proposalCount: proposalCount.toString(),
    };
  } catch (error) {
    return {
      chainId: CHAIN_ID,
      error: error.message || "Unable to read protocol stats",
    };
  }
};

const getVaultOnchain = async (vaultOrId, walletAddress) => {
  const vault = typeof vaultOrId === "string" ? getVaultById(vaultOrId) : vaultOrId;
  if (!vault) return null;

  const onchain = {
    contractAddress: vault.contractAddress,
    vaultType: vault.vaultType,
    tokenSymbol: vault.tokenSymbol,
  };

  try {
    const instances = getContracts();
    if (vault._id === "deth") {
      onchain.totalSupply = formatEth(await instances.dETH.totalSupply());
      onchain.contractEth = formatEth(await instances.dETH.getContractETHBalance());
      if (walletAddress) {
        onchain.walletBalance = formatEth(await instances.dETH.balanceOf(walletAddress));
      }
    } else if (vault._id === "seth") {
      onchain.totalSupply = formatEth(await instances.sETH.totalSupply());
      onchain.totalStaked = formatEth(await instances.sETH.totalStaked());
      if (walletAddress) {
        onchain.walletBalance = formatEth(await instances.sETH.balanceOf(walletAddress));
      }
    } else if (vault._id === "governance") {
      onchain.proposalCount = (await instances.governance.proposalCount()).toString();
    } else if (vault._id === "dashboard") {
      const overview = await instances.stakingDashboard.getStakingOverview();
      onchain.totalETHDeposited = formatEth(overview.totalETHDeposited);
      onchain.totalETHStaked = formatEth(overview.totalETHStaked);
      onchain.totalStakers = overview.totalStakers.toString();
      onchain.averageStakeAmount = formatEth(overview.averageStakeAmount);
    }
  } catch (error) {
    onchain.error = error.message || "Unable to read contract state";
  }

  return onchain;
};

const getWalletBalances = async (walletAddress) => {
  if (!walletAddress) return null;
  try {
    const readProvider = getProvider();
    const { dETH, sETH } = getContracts();
    const [ethBalance, dETHBalance, sETHBalance] = await Promise.all([
      readProvider.getBalance(walletAddress),
      dETH.balanceOf(walletAddress),
      sETH.balanceOf(walletAddress),
    ]);
    return {
      address: walletAddress,
      chainId: CHAIN_ID,
      ethBalance: formatEth(ethBalance),
      dETHBalance: formatEth(dETHBalance),
      sETHBalance: formatEth(sETHBalance),
    };
  } catch (error) {
    return {
      address: walletAddress,
      chainId: CHAIN_ID,
      error: error.message || "Unable to read wallet balances",
    };
  }
};

const verifyTransaction = async (txHash, { action, walletAddress } = {}) => {
  if (!txHash || !/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
    return { ok: false, error: "Invalid transaction hash" };
  }

  try {
    const readProvider = getProvider();
    const tx = await readProvider.getTransaction(txHash);
    if (!tx) {
      return { ok: false, error: "Transaction not found on the configured chain" };
    }

    const receipt = await readProvider.getTransactionReceipt(txHash);
    const currentBlock = await readProvider.getBlockNumber();
    const vault = getVaultByAddress(tx.to);
    const confirmations = receipt ? currentBlock - receipt.blockNumber + 1 : 0;

    if (walletAddress && tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
      return { ok: false, error: "Transaction sender does not match wallet" };
    }

    return {
      ok: true,
      status: receipt ? (Number(receipt.status) === 1 ? "success" : "failed") : "pending",
      txHash,
      from: tx.from,
      to: tx.to,
      value: formatEth(tx.value || 0),
      blockNumber: receipt ? receipt.blockNumber : null,
      confirmations,
      chainId: CHAIN_ID,
      vault: vault ? vault._id : null,
      action: action || (vault ? vault.defaultAction : null),
    };
  } catch (error) {
    return { ok: false, error: error.message || "Transaction verification failed" };
  }
};

const getLeaderboard = async (count = 10) => {
  try {
    const { stakingDashboard } = getContracts();
    const data = await stakingDashboard.getLeaderboard(count);
    return {
      addresses: data.stakerAddresses,
      amounts: data.stakedAmounts.map((amount) => formatEth(amount)),
      percentages: data.percentageOfTotal.map((value) => Number(value) / 100),
    };
  } catch (error) {
    return { error: error.message || "Unable to read leaderboard" };
  }
};

const PROPOSAL_STATES = ["Active", "Defeated", "Succeeded", "Executed", "Expired", "Canceled"];

const mapProposal = (id, details) => ({
  id: String(id),
  proposer: details.proposer,
  description: details.description,
  createdAt: Number(details.createdAt),
  votesFor: formatEth(details.votesFor),
  votesAgainst: formatEth(details.votesAgainst),
  executed: details.executed,
  canceled: details.canceled,
  state: PROPOSAL_STATES[Number(details.state)] || String(details.state),
});

const getProposal = async (proposalId) => {
  try {
    const { governance } = getContracts();
    const details = await governance.getProposalDetails(proposalId);
    return mapProposal(proposalId, details);
  } catch (error) {
    return { error: error.message || "Unable to read proposal" };
  }
};

const getProposals = async (limit = 10) => {
  try {
    const { governance } = getContracts();
    const count = Number(await governance.proposalCount());
    const start = Math.max(1, count - limit + 1);
    const proposals = [];
    for (let id = count; id >= start; id--) {
      const proposal = await getProposal(id);
      if (!proposal.error) proposals.push(proposal);
    }
    return { proposalCount: count, proposals };
  } catch (error) {
    return { proposalCount: 0, proposals: [], error: error.message || "Unable to read proposals" };
  }
};

module.exports = {
  getProvider,
  getContracts,
  getProtocolStats,
  getVaultOnchain,
  getWalletBalances,
  verifyTransaction,
  getLeaderboard,
  getProposal,
  getProposals,
};

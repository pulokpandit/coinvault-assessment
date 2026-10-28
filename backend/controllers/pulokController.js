const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");
const { getContracts, getProvider } = require("../utils/web3");
const { ethers } = require("ethers");
const { CHAIN_ID, ADDRESSES, ZERO_ADDRESS } = require("../config/contracts");

// Standard ERC-20 ABI for public contract reads
const ERC20_PUBLIC_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
];

// Verified public contracts on Sepolia (Chain ID 11155111)
const PUBLIC_CONTRACTS = {
  WETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  LINK: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
};

const formatEth = (value) => {
  try {
    return ethers.formatEther(value || 0);
  } catch {
    return "0";
  }
};

const isConfiguredAddress = (addr) => {
  return addr && ethers.isAddress(addr) && addr.toLowerCase() !== ZERO_ADDRESS.toLowerCase();
};

/**
 * GET /api/pulok (or /api/pulok/public-contract)
 * Main API: PulokApitest
 * Reads live on-chain data from a public verified smart contract on Sepolia.
 * Supports optional ?token=WETH|USDC|LINK or ?address=0x...
 */
exports.pulokApitest = asyncErrorHandler(async (req, res, next) => {
  const provider = getProvider();

  // Determine contract address to query
  let targetAddress = req.query.address;
  if (!targetAddress) {
    const tokenKey = (req.query.token || "WETH").toUpperCase();
    targetAddress = PUBLIC_CONTRACTS[tokenKey] || PUBLIC_CONTRACTS.WETH;
  }

  if (!ethers.isAddress(targetAddress)) {
    return next(new ErrorHandler("Invalid Ethereum contract address", 400));
  }

  const contract = new ethers.Contract(targetAddress, ERC20_PUBLIC_ABI, provider);

  try {
    const [name, symbol, decimals, totalSupply, latestBlock] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      provider.getBlockNumber(),
    ]);

    const formattedSupply = ethers.formatUnits(totalSupply, decimals);

    console.log(
      `[PulokApitest] Fetched on-chain data for ${name} (${symbol}) at ${targetAddress}. Total Supply: ${formattedSupply}`
    );

    res.status(200).json({
      success: true,
      api: "PulokApitest",
      description: "Reads live on-chain smart contract data using ethers.js",
      network: {
        chainId: CHAIN_ID,
        name: "Sepolia Testnet",
        latestBlock,
      },
      contract: {
        address: targetAddress,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupplyRaw: totalSupply.toString(),
        totalSupply: formattedSupply,
      },
      availablePublicTokens: PUBLIC_CONTRACTS,
    });
  } catch (error) {
    return next(
      new ErrorHandler(`Failed to read contract at ${targetAddress}: ${error.message}`, 502)
    );
  }
});

/**
 * GET /api/pulok/balance/:address
 * Reads public on-chain token balance and native ETH balance for a given wallet address.
 */
exports.getPublicTokenBalance = asyncErrorHandler(async (req, res, next) => {
  const { address } = req.params;

  if (!ethers.isAddress(address)) {
    return next(new ErrorHandler("Invalid Ethereum wallet address", 400));
  }

  const provider = getProvider();
  const tokenKey = (req.query.token || "WETH").toUpperCase();
  const tokenAddress = req.query.contract || PUBLIC_CONTRACTS[tokenKey] || PUBLIC_CONTRACTS.WETH;

  const contract = new ethers.Contract(tokenAddress, ERC20_PUBLIC_ABI, provider);

  try {
    const [symbol, decimals, tokenBalance, ethBalance] = await Promise.all([
      contract.symbol(),
      contract.decimals(),
      contract.balanceOf(address),
      provider.getBalance(address),
    ]);

    res.status(200).json({
      success: true,
      api: "PulokApitest",
      walletAddress: address,
      token: {
        address: tokenAddress,
        symbol,
        balance: ethers.formatUnits(tokenBalance, decimals),
      },
      nativeEthBalance: ethers.formatEther(ethBalance),
    });
  } catch (error) {
    return next(new ErrorHandler(`Failed to read balance: ${error.message}`, 502));
  }
});

/**
 * GET /api/pulok/stats
 * Protocol overview for CoinVault custom contracts (safeguarded if addresses not yet deployed)
 */
exports.getProtocolSummary = asyncErrorHandler(async (req, res) => {
  const { stakingDashboard, governance, dETH, sETH } = getContracts();
  const isDashboardConfigured = isConfiguredAddress(ADDRESSES.stakingDashboard);
  const isGovConfigured = isConfiguredAddress(ADDRESSES.governance);
  const isDethConfigured = isConfiguredAddress(ADDRESSES.dETH);
  const isSethConfigured = isConfiguredAddress(ADDRESSES.sETH);

  const [overview, proposalCount, dETHTotalSupply, sETHTotalSupply] =
    await Promise.allSettled([
      isDashboardConfigured ? stakingDashboard.getStakingOverview() : Promise.reject(new Error("STAKING_DASHBOARD_ADDRESS not configured")),
      isGovConfigured ? governance.proposalCount() : Promise.reject(new Error("GOVERNANCE_ADDRESS not configured")),
      isDethConfigured ? dETH.totalSupply() : Promise.reject(new Error("DETH_ADDRESS not configured")),
      isSethConfigured ? sETH.totalSupply() : Promise.reject(new Error("SETH_ADDRESS not configured")),
    ]);

  const resolve = (settled, fallback = null) =>
    settled.status === "fulfilled" ? settled.value : fallback;

  const ov = resolve(overview);

  res.status(200).json({
    success: true,
    api: "PulokApitest",
    chainId: CHAIN_ID,
    staking: ov
      ? {
          totalETHDeposited: formatEth(ov.totalETHDeposited),
          totalETHStaked: formatEth(ov.totalETHStaked),
          totalStakers: ov.totalStakers.toString(),
          averageStakeAmount: formatEth(ov.averageStakeAmount),
        }
      : { status: "not_configured", note: overview.reason?.message },
    governance: {
      proposalCount:
        resolve(proposalCount) !== null ? resolve(proposalCount).toString() : null,
      status: resolve(proposalCount) !== null ? "active" : "not_configured",
      note: proposalCount.status === "rejected" ? proposalCount.reason?.message : undefined,
    },
    tokens: {
      dETH: {
        totalSupply: resolve(dETHTotalSupply) !== null ? formatEth(resolve(dETHTotalSupply)) : null,
        status: resolve(dETHTotalSupply) !== null ? "active" : "not_configured",
      },
      sETH: {
        totalSupply: resolve(sETHTotalSupply) !== null ? formatEth(resolve(sETHTotalSupply)) : null,
        status: resolve(sETHTotalSupply) !== null ? "active" : "not_configured",
      },
    },
  });
});

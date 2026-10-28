const express = require("express");
const router = express.Router();
const {
  pulokApitest,
  getPublicTokenBalance,
  getProtocolSummary,
} = require("../controllers/pulokController");

// Primary Requirement API: [YourName]Apitest -> PulokApitest
// GET /api/pulok — reads live public verified smart contract data (WETH, USDC, LINK)
router.get("/", pulokApitest);

// GET /api/pulok/balance/:address — reads live public token balance for any wallet
router.get("/balance/:address", getPublicTokenBalance);

// GET /api/pulok/stats — protocol summary for custom contracts
router.get("/stats", getProtocolSummary);

module.exports = router;

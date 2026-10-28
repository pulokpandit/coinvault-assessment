const express = require("express");
const {
  recordDeposit,
  recordWithdraw,
  recordStake,
  recordUnstake,
  getStakePositions,
  getStakingStats,
} = require("../controllers/stakeController");
const { isAuthenticatedStaker } = require("../middlewares/user_actions/auth");

const router = express.Router();

router.route("/stats").get(getStakingStats);
router.route("/positions").get(isAuthenticatedStaker, getStakePositions);
router.route("/deposit").post(isAuthenticatedStaker, recordDeposit);
router.route("/withdraw").post(isAuthenticatedStaker, recordWithdraw);
router.route("/stake").post(isAuthenticatedStaker, recordStake);
router.route("/unstake").post(isAuthenticatedStaker, recordUnstake);

module.exports = router;

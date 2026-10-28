const activityController = require("./activityController");
const vaultController = require("./vaultController");
const { withAliases } = require("../utils/responseAlias");

const withAction = (action, handler) => (req, res, next) => {
  req.body = { ...req.body, action: req.body.action || action };
  return handler(req, res, next);
};

const asPosition = withAliases(activityController.recordStakeActivity, {
  activity: "position",
});

exports.recordDeposit = withAction("deposit", asPosition);
exports.recordWithdraw = withAction("withdraw", asPosition);
exports.recordStake = withAction("stake", asPosition);
exports.recordUnstake = withAction("unstake", asPosition);
exports.getStakePositions = withAliases(activityController.myActivity, {
  activity: "positions",
});
exports.getStakingStats = vaultController.getProtocolOverview;

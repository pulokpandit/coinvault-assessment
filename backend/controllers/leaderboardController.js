const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const { getLeaderboard, getProtocolStats } = require("../utils/web3");

exports.getStakingLeaderboard = asyncErrorHandler(async (req, res) => {
  const count = Number(req.query.count) || 10;
  const [leaderboard, stats] = await Promise.all([
    getLeaderboard(count),
    getProtocolStats(),
  ]);

  res.status(200).json({
    success: !leaderboard.error,
    leaderboard,
    stats,
  });
});

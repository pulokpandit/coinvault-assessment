const PendingStake = require("../../models/pendingStakeModel");
const VaultComment = require("../../models/vaultCommentModel");
const StakeRequest = require("../../models/stakeRequest");
const Watchlist = require("../../models/watchlistModel");

module.exports = async (vault, staker, type) => {
  let hasPendingStake = null;
  let hasStaked = null;
  let hasOnWatchlist = null;
  let hasReviewed = null;
  if (staker) {
    if (type !== "pending") {
      hasPendingStake = await PendingStake.findOne({
        user: staker._id,
        product: vault._id,
        isDeleted: null,
      });
      if (!hasPendingStake) hasPendingStake = false;
    }

    if (type !== "watchlists") {
      hasOnWatchlist = await Watchlist.findOne({
        user: staker._id,
        product: vault._id,
        isDeleted: null,
      });
      if (!hasOnWatchlist) hasOnWatchlist = false;
    }

    if (type === "vault") {
      hasStaked = await StakeRequest.findOne({
        user: staker,
        $or: [
          { "status.currentStatus": "complete" },
          { "status.currentStatus": "tobereturned", "status.currentStatus": "return" },
        ],
      });
      hasStaked = !!hasStaked;

      hasReviewed = await VaultComment.findOne({ user: staker, product: vault._id }).select(
        "comment star user"
      );
      if (!hasReviewed) hasReviewed = false;
    }
  }

  return { hasStaked, hasPendingStake, hasOnWatchlist, hasReviewed };
};

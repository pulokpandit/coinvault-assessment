const express = require("express");
const { getStakingLeaderboard } = require("../controllers/leaderboardController");

const router = express.Router();

router.route("/").get(getStakingLeaderboard);

module.exports = router;

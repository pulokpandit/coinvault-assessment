const express = require("express");
const { listProposals, getProposalById } = require("../controllers/governanceController");

const router = express.Router();

router.route("/proposals").get(listProposals);
router.route("/proposals/:id").get(getProposalById);

module.exports = router;

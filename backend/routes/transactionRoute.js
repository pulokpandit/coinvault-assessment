const express = require("express");
const {
  verifyOnchainTx,
  processTransaction,
  getTransactionStatus,
  fiatCallback,
} = require("../controllers/transactionController");
const { isAuthenticatedStaker } = require("../middlewares/user_actions/auth");

const router = express.Router();

router.route("/verify").post(verifyOnchainTx);
router.route("/process").post(processTransaction);
router.route("/callback").post(fiatCallback);
router.route("/status/:id").get(isAuthenticatedStaker, getTransactionStatus);

module.exports = router;

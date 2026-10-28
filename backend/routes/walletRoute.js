const express = require("express");
const {
  registerStaker,
  loginStaker,
  logoutStaker,
  getStakerDetails,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateStakerProfile,
  getAllStakers,
  getSingleStaker,
  updateStakerRole,
  deleteStaker,
  getWalletNonce,
  connectWallet,
} = require("../controllers/walletController");
const {
  isAuthenticatedStaker,
  authorizeOperators,
} = require("../middlewares/user_actions/auth");

const router = express.Router();

router.route("/register").post(registerStaker);
router.route("/login").post(loginStaker);
router.route("/logout").get(logoutStaker);
router.route("/nonce").get(getWalletNonce);
router.route("/connect").post(connectWallet);
router.route("/me").get(isAuthenticatedStaker, getStakerDetails);
router.route("/me/update").put(isAuthenticatedStaker, updateStakerProfile);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/password/update").put(isAuthenticatedStaker, updatePassword);
router
  .route("/stakers")
  .get(isAuthenticatedStaker, authorizeOperators("admin"), getAllStakers);
router
  .route("/stakers/:id")
  .get(isAuthenticatedStaker, authorizeOperators("admin"), getSingleStaker)
  .put(isAuthenticatedStaker, authorizeOperators("admin"), updateStakerRole)
  .delete(isAuthenticatedStaker, authorizeOperators("admin"), deleteStaker);

module.exports = router;

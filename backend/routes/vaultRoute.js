const express = require("express");
const {
  getAllVaults,
  getVaults,
  getVaultDetails,
  getProtocolOverview,
  getOperatorVaults,
  createVault,
  updateVault,
  deleteVault,
  createVaultReview,
  getVaultReviews,
  deleteVaultReview,
} = require("../controllers/vaultController");
const {
  isAuthenticatedStaker,
  authorizeOperators,
} = require("../middlewares/user_actions/auth");

const router = express.Router();

router.route("/").get(getAllVaults);
router.route("/all").get(getVaults);
router.route("/stats").get(getProtocolOverview);
router
  .route("/operator")
  .get(isAuthenticatedStaker, authorizeOperators("admin"), getOperatorVaults);
router
  .route("/operator/new")
  .post(isAuthenticatedStaker, authorizeOperators("admin"), createVault);
router
  .route("/operator/:id")
  .put(isAuthenticatedStaker, authorizeOperators("admin"), updateVault)
  .delete(isAuthenticatedStaker, authorizeOperators("admin"), deleteVault);
router.route("/review").put(isAuthenticatedStaker, createVaultReview);
router
  .route("/operator/reviews")
  .get(getVaultReviews)
  .delete(isAuthenticatedStaker, deleteVaultReview);
router.route("/:id").get(getVaultDetails);

module.exports = router;

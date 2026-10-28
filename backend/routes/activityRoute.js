const express = require("express");
const {
  recordStakeActivity,
  getActivityDetails,
  myActivity,
  getAllActivity,
  updateActivity,
  deleteActivity,
} = require("../controllers/activityController");
const {
  isAuthenticatedStaker,
  authorizeOperators,
} = require("../middlewares/user_actions/auth");

const router = express.Router();

router.route("/").get(isAuthenticatedStaker, myActivity).post(isAuthenticatedStaker, recordStakeActivity);
router.route("/me").get(isAuthenticatedStaker, myActivity);
router
  .route("/operator")
  .get(isAuthenticatedStaker, authorizeOperators("admin"), getAllActivity);
router
  .route("/operator/:id")
  .put(isAuthenticatedStaker, authorizeOperators("admin"), updateActivity)
  .delete(isAuthenticatedStaker, authorizeOperators("admin"), deleteActivity);
router.route("/:id").get(isAuthenticatedStaker, getActivityDetails);

module.exports = router;

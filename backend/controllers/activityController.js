const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const StakeActivity = require("../models/stakeActivityModel");
const Vault = require("../models/vaultModel");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendEmail");
const { verifyTransaction } = require("../utils/web3");

exports.recordStakeActivity = asyncErrorHandler(async (req, res, next) => {
  if (req.body.txHash) {
    const walletAddress = req.body.walletAddress || req.staker.walletAddress;
    const verification = await verifyTransaction(req.body.txHash, {
      action: req.body.action,
      walletAddress,
    });

    if (!verification.ok) {
      return next(new ErrorHandler(verification.error, 400));
    }

    let activity = null;
    try {
      const existing = await StakeActivity.findOne({ txHash: req.body.txHash.toLowerCase() });
      if (existing) {
        return next(new ErrorHandler("Transaction already recorded", 400));
      }

      activity = await StakeActivity.create({
        staker: req.staker._id,
        txHash: req.body.txHash,
        action: verification.action,
        walletAddress: verification.from,
        blockNumber: verification.blockNumber,
        txInfo: {
          id: req.body.txHash,
          status: verification.status,
        },
        amount: Number(verification.value) || 0,
        confirmedAt: Date.now(),
        status: verification.status === "success" ? "Confirmed" : "Processing",
      });
    } catch (error) {
      // Verification still succeeds if Mongo is unavailable
    }

    return res.status(201).json({
      success: true,
      activity,
      verification,
    });
  }

  const { metadata, actionItems, txInfo, amount } = req.body;

  const activityExist = await StakeActivity.findOne({ txInfo });

  if (activityExist) {
    return next(new ErrorHandler("Activity Already Recorded", 400));
  }

  const activity = await StakeActivity.create({
    metadata,
    actionItems,
    txInfo,
    amount,
    confirmedAt: Date.now(),
    staker: req.staker._id,
  });

  await sendEmail({
    email: req.staker.email,
    templateId: process.env.SENDGRID_ORDER_TEMPLATEID,
    data: {
      name: req.staker.name,
      metadata,
      actionItems,
      amount,
      oid: activity._id,
    },
  });
  res.status(201).json({
    success: true,
    activity,
  });
});

exports.getActivityDetails = asyncErrorHandler(async (req, res, next) => {
  const activity = await StakeActivity.findById(req.params.id).populate(
    "staker",
    "name email walletAddress"
  );

  if (!activity) {
    return next(new ErrorHandler("Activity Not Found", 404));
  }

  res.status(200).json({
    success: true,
    activity,
  });
});

exports.myActivity = asyncErrorHandler(async (req, res, next) => {
  const query = req.staker.walletAddress
    ? { $or: [{ staker: req.staker._id }, { walletAddress: req.staker.walletAddress }] }
    : { staker: req.staker._id };

  const activity = await StakeActivity.find(query);
  if (!activity) {
    return next(new ErrorHandler("Activity Not Found", 404));
  }
  res.status(200).json({
    success: true,
    activity,
  });
});

exports.getAllActivity = asyncErrorHandler(async (req, res, next) => {
  const activity = await StakeActivity.find();
  if (!activity) {
    return next(new ErrorHandler("Activity Not Found", 404));
  }

  let totalValue = 0;
  activity.forEach((entry) => {
    totalValue += entry.amount;
  });
  res.status(200).json({
    success: true,
    activity,
    totalValue,
  });
});

exports.updateActivity = asyncErrorHandler(async (req, res, next) => {
  const activity = await StakeActivity.findById(req.params.id);
  if (!activity) {
    return next(new ErrorHandler("Activity Not Found", 404));
  }
  if (activity.status === "Finalized") {
    return next(new ErrorHandler("Already Finalized", 400));
  }
  if (req.body.status === "Submitted") {
    activity.submittedAt = Date.now();
    activity.actionItems.forEach(async (item) => {
      await updateVaultSupply(item.vault, item.quantity);
    });
  }
  activity.status = req.body.status;
  if (req.body.status === "Finalized") {
    activity.finalizedAt = Date.now();
  }
  await activity.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

async function updateVaultSupply(id, quantity) {
  const vault = await Vault.findById(id);
  vault.supply -= quantity;
  await vault.save({ validateBeforeSave: false });
}

exports.deleteActivity = asyncErrorHandler(async (req, res, next) => {
  const activity = await StakeActivity.findById(req.params.id);
  if (!activity) {
    return next(new ErrorHandler("Activity Not Found", 404));
  }
  await activity.remove();
  res.status(200).json({
    success: true,
  });
});

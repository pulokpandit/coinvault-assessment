const Staker = require("../models/stakerModel");
const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const sendToken = require("../utils/sendToken");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const { verifyWalletSignature } = require("../middlewares/user_actions/walletAuth");
const { getWalletBalances } = require("../utils/web3");
const { HOLESKY_CHAIN_ID } = require("../config/contracts");

const normalizeAddress = (address) => (address ? String(address).toLowerCase() : undefined);

exports.registerStaker = asyncErrorHandler(async (req, res, next) => {
  const { name, email, gender, password, walletAddress } = req.body;
  let avatar = {
    public_id: "",
    url: "",
  };

  if (req.body.avatar) {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
    avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  const staker = await Staker.create({
    name,
    email,
    gender,
    password,
    avatar,
    walletAddress: normalizeAddress(walletAddress),
    chainId: HOLESKY_CHAIN_ID,
  });

  sendToken(staker, 201, res);
});

exports.getWalletNonce = asyncErrorHandler(async (req, res, next) => {
  const address = normalizeAddress(req.query.address);
  if (!address || !/^0x[a-f0-9]{40}$/.test(address)) {
    return next(new ErrorHandler("Valid wallet address required", 400));
  }

  const nonce = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  const message = `Login to CoinVault\nAddress: ${address}\nNonce: ${nonce}`;

  res.status(200).json({
    success: true,
    address,
    nonce,
    message,
  });
});

exports.connectWallet = asyncErrorHandler(async (req, res, next) => {
  const { walletAddress, address, signature, message } = req.body;
  const claimedAddress = normalizeAddress(walletAddress || address);

  if (!claimedAddress || !signature || !message) {
    return next(new ErrorHandler("walletAddress, message and signature are required", 400));
  }

  const recovered = verifyWalletSignature(claimedAddress, message, signature);
  if (!recovered) {
    return next(new ErrorHandler("Invalid wallet signature", 401));
  }

  const recoveredAddress = recovered.toLowerCase();
  let staker = await Staker.findOne({ walletAddress: recoveredAddress });

  if (!staker) {
    staker = await Staker.create({
      name: `Wallet ${recoveredAddress.slice(0, 6)}`,
      email: `${recoveredAddress}@wallet.coinvault`,
      gender: "other",
      password: `${crypto.randomBytes(16).toString("hex")}Aa1!`,
      walletAddress: recoveredAddress,
      chainId: HOLESKY_CHAIN_ID,
    });
  }

  sendToken(staker, 200, res);
});

exports.loginStaker = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email And Password", 400));
  }

  const staker = await Staker.findOne({ email }).select("+password");

  if (!staker) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const isPasswordMatched = await staker.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  sendToken(staker, 201, res);
});

exports.logoutStaker = asyncErrorHandler(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

exports.getStakerDetails = asyncErrorHandler(async (req, res, next) => {
  const staker = await Staker.findById(req.staker.id);
  const balances = staker.walletAddress ? await getWalletBalances(staker.walletAddress) : null;

  res.status(200).json({
    success: true,
    staker,
    balances,
  });
});

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const staker = await Staker.findOne({ email: req.body.email });

  if (!staker) {
    return next(new ErrorHandler("Staker Not Found", 404));
  }

  const resetToken = await staker.getResetPasswordToken();
  await staker.save({ validateBeforeSave: false });

  const resetPasswordUrl = `https://${req.get("host")}/password/reset/${resetToken}`;

  try {
    await sendEmail({
      email: staker.email,
      templateId: process.env.SENDGRID_RESET_TEMPLATEID,
      data: {
        reset_url: resetPasswordUrl,
      },
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${staker.email} successfully`,
    });
  } catch (error) {
    staker.resetPasswordToken = undefined;
    staker.resetPasswordExpire = undefined;

    await staker.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const staker = await Staker.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!staker) {
    return next(new ErrorHandler("Invalid reset password token", 404));
  }

  staker.password = req.body.password;
  staker.resetPasswordToken = undefined;
  staker.resetPasswordExpire = undefined;

  await staker.save();
  sendToken(staker, 200, res);
});

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  const staker = await Staker.findById(req.staker.id).select("+password");

  const isPasswordMatched = await staker.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old Password is Invalid", 400));
  }

  staker.password = req.body.newPassword;
  await staker.save();
  sendToken(staker, 201, res);
});

exports.updateStakerProfile = asyncErrorHandler(async (req, res, next) => {
  const newStakerData = {
    name: req.body.name,
    email: req.body.email,
  };

  if (req.body.walletAddress) {
    newStakerData.walletAddress = normalizeAddress(req.body.walletAddress);
    newStakerData.chainId = HOLESKY_CHAIN_ID;
  }

  if (req.body.avatar !== "") {
    const staker = await Staker.findById(req.staker.id);

    const imageId = staker.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newStakerData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  await Staker.findByIdAndUpdate(req.staker.id, newStakerData, {
    new: true,
    runValidators: true,
    useFindAndModify: true,
  });

  res.status(200).json({
    success: true,
  });
});

exports.getAllStakers = asyncErrorHandler(async (req, res, next) => {
  const stakers = await Staker.find();

  res.status(200).json({
    success: true,
    stakers,
  });
});

exports.getSingleStaker = asyncErrorHandler(async (req, res, next) => {
  const staker = await Staker.findById(req.params.id);

  if (!staker) {
    return next(new ErrorHandler(`Staker doesn't exist with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    success: true,
    staker,
  });
});

exports.updateStakerRole = asyncErrorHandler(async (req, res, next) => {
  const newStakerData = {
    name: req.body.name,
    email: req.body.email,
    gender: req.body.gender,
    role: req.body.role,
  };
  await Staker.findByIdAndUpdate(req.params.id, newStakerData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

exports.deleteStaker = asyncErrorHandler(async (req, res, next) => {
  const staker = await Staker.findById(req.params.id);
  if (!staker) {
    return next(new ErrorHandler(`Staker doesn't exist with id: ${req.params.id}`, 404));
  }
  await staker.remove();

  res.status(200).json({
    success: true,
  });
});

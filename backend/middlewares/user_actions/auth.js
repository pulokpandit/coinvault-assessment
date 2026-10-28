const jwt = require("jsonwebtoken");
const Staker = require("../../models/stakerModel");
const ErrorHandler = require("../../utils/errorHandler");
const asyncErrorHandler = require("../helpers/asyncErrorHandler");

exports.isAuthenticatedStaker = asyncErrorHandler(async (req, res, next) => {
  const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const token = req.cookies.token || bearer;

  if (!token) {
    return next(new ErrorHandler("Please connect a wallet to access", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.staker = await Staker.findById(decodedData.id);
  next();
});

exports.authorizeOperators = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.staker.role)) {
      return next(new ErrorHandler(`Role: ${req.staker.role} is not allowed`, 403));
    }
    next();
  };
};

exports.isAuthenticatedWallet = exports.isAuthenticatedStaker;

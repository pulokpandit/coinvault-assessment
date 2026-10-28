const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const stakerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter staker name"],
  },
  email: {
    type: String,
    required: function () {
      return !this.walletAddress;
    },
    unique: true,
    sparse: true,
  },
  gender: {
    type: String,
    required: function () {
      return !this.walletAddress;
    },
  },
  password: {
    type: String,
    required: function () {
      return !this.walletAddress;
    },
    minLength: [8, "Password should have atleast 8 chars"],
    select: false,
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  chainId: {
    type: Number,
    default: 11155111,
  },
  avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  role: {
    type: String,
    default: "staker",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

stakerSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

stakerSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

stakerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

stakerSchema.methods.getResetPasswordToken = async function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("Staker", stakerSchema);

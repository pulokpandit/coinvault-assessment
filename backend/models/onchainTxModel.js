const mongoose = require("mongoose");

const onchainTxSchema = new mongoose.Schema({
  resultInfo: {
    resultStatus: {
      type: String,
    },
    resultCode: {
      type: String,
    },
    resultMsg: {
      type: String,
    },
  },
  txnId: {
    type: String,
  },
  networkTxnId: {
    type: String,
  },
  activityId: {
    type: String,
  },
  txnAmount: {
    type: String,
  },
  txnType: {
    type: String,
  },
  gatewayName: {
    type: String,
  },
  networkName: {
    type: String,
  },
  merchantId: {
    type: String,
  },
  txMode: {
    type: String,
  },
  refundAmount: {
    type: String,
  },
  txnDate: {
    type: String,
  },
  txHash: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  chainId: {
    type: Number,
  },
  fromAddress: {
    type: String,
    lowercase: true,
    trim: true,
  },
  toAddress: {
    type: String,
    lowercase: true,
    trim: true,
  },
  confirmations: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OnchainTx", onchainTxSchema);

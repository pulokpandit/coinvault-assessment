const mongoose = require("mongoose");

const stakeActivitySchema = new mongoose.Schema({
  metadata: {
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    pincode: {
      type: Number,
    },
    phoneNo: {
      type: Number,
    },
  },
  actionItems: [
    {
      name: {
        type: String,
      },
      amount: {
        type: Number,
      },
      quantity: {
        type: Number,
      },
      image: {
        type: String,
      },
      vault: {
        type: mongoose.Schema.ObjectId,
        ref: "Vault",
      },
    },
  ],
  staker: {
    type: mongoose.Schema.ObjectId,
    ref: "Staker",
    required: true,
  },
  txHash: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  action: {
    type: String,
    trim: true,
  },
  walletAddress: {
    type: String,
    lowercase: true,
    trim: true,
  },
  blockNumber: {
    type: Number,
  },
  txInfo: {
    id: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  confirmedAt: {
    type: Date,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    default: "Processing",
  },
  finalizedAt: Date,
  submittedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("StakeActivity", stakeActivitySchema);

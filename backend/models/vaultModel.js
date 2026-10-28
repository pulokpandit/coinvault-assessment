const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter vault name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please enter vault description"],
  },
  highlights: [
    {
      type: String,
      required: true,
    },
  ],
  specifications: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    },
  ],
  tvl: {
    type: Number,
    required: [true, "Please enter vault TVL"],
  },
  apr: {
    type: Number,
    required: [true, "Please enter vault APR"],
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  token: {
    name: {
      type: String,
      required: true,
    },
    logo: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  vaultCategory: {
    type: String,
    required: [true, "Please enter vault category"],
  },
  supply: {
    type: Number,
    required: [true, "Please enter vault supply"],
    maxlength: [4, "Supply cannot exceed limit"],
    default: 1,
  },
  lockPeriod: {
    type: Number,
    default: 1,
  },
  score: {
    type: Number,
    default: 0,
  },
  numOfComments: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      staker: {
        type: mongoose.Schema.ObjectId,
        ref: "Staker",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  staker: {
    type: mongoose.Schema.ObjectId,
    ref: "Staker",
    required: true,
  },
  contractAddress: {
    type: String,
    trim: true,
  },
  tokenSymbol: {
    type: String,
    trim: true,
  },
  vaultType: {
    type: String,
    trim: true,
  },
  chainId: {
    type: Number,
    default: 11155111,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vault", vaultSchema);

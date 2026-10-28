const Vault = require("../models/vaultModel");
const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const SearchFeatures = require("../utils/searchFeatures");
const ErrorHandler = require("../utils/errorHandler");
const cloudinary = require("cloudinary");
const { getVaultCatalog, getVaultById } = require("../config/contracts");
const { getProtocolStats, getVaultOnchain } = require("../utils/web3");

const withVaultState = async (vault, walletAddress) => {
  const catalogVault = getVaultById(vault._id) || getVaultById(vault.vaultType);
  if (!catalogVault && !vault.contractAddress) {
    return vault;
  }

  const onchain = await getVaultOnchain(catalogVault || vault._id, walletAddress);
  if (vault.toObject) {
    return { ...vault.toObject(), onchain };
  }
  return { ...vault, onchain };
};

const loadStoredVaults = async (req) => {
  const resultPerPage = 12;
  const vaultCount = await Vault.countDocuments();
  if (!vaultCount) {
    return null;
  }

  const searchFeature = new SearchFeatures(Vault.find(), req.query).search().filter();

  let vaults = await searchFeature.query;
  const filteredVaultCount = vaults.length;

  searchFeature.pagination(resultPerPage);
  vaults = await searchFeature.query.clone();

  return {
    vaults,
    vaultCount,
    resultPerPage,
    filteredVaultCount,
  };
};

exports.getAllVaults = asyncErrorHandler(async (req, res, next) => {
  const stats = await getProtocolStats();
  const walletAddress = req.query.address;

  try {
    const stored = await loadStoredVaults(req);
    if (stored) {
      const vaults = await Promise.all(
        stored.vaults.map((vault) => withVaultState(vault, walletAddress))
      );
      return res.status(200).json({
        success: true,
        vaults,
        vaultCount: stored.vaultCount,
        resultPerPage: stored.resultPerPage,
        filteredVaultCount: stored.filteredVaultCount,
        stats,
      });
    }
  } catch (error) {
    // Mongo may be unset — fall through to the on-chain vault catalog
  }

  const vaults = await Promise.all(
    getVaultCatalog().map((vault) => withVaultState(vault, walletAddress))
  );

  res.status(200).json({
    success: true,
    vaults,
    vaultCount: vaults.length,
    resultPerPage: vaults.length,
    filteredVaultCount: vaults.length,
    stats,
  });
});

exports.getVaults = asyncErrorHandler(async (req, res, next) => {
  let vaults = [];
  try {
    vaults = await Vault.find();
  } catch (error) {
    vaults = [];
  }

  if (!vaults.length) {
    vaults = getVaultCatalog();
  }

  const stats = await getProtocolStats();
  res.status(200).json({
    success: true,
    vaults,
    stats,
  });
});

exports.getProtocolOverview = asyncErrorHandler(async (req, res, next) => {
  const stats = await getProtocolStats();
  res.status(200).json({
    success: true,
    stats,
  });
});

exports.getVaultDetails = asyncErrorHandler(async (req, res, next) => {
  const catalogVault = getVaultById(req.params.id);
  if (catalogVault) {
    const vault = await withVaultState(catalogVault, req.query.address);
    return res.status(200).json({
      success: true,
      vault,
    });
  }

  const vault = await Vault.findById(req.params.id);
  if (!vault) {
    return next(new ErrorHandler("Vault Not Found", 404));
  }
  res.status(200).json({
    success: true,
    vault: await withVaultState(vault, req.query.address),
  });
});

exports.getOperatorVaults = asyncErrorHandler(async (req, res, next) => {
  const vaults = await Vault.find();
  res.status(200).json({
    success: true,
    vaults,
  });
});

exports.createVault = asyncErrorHandler(async (req, res, next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }
  const imagesLink = [];
  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "vaults",
    });

    imagesLink.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  const result = await cloudinary.v2.uploader.upload(req.body.logo, {
    folder: "tokens",
  });
  const tokenLogo = {
    public_id: result.public_id,
    url: result.secure_url,
  };
  req.body.token = {
    name: req.body.tokenName,
    logo: tokenLogo,
  };
  req.body.images = imagesLink;
  req.body.staker = req.staker.id;
  req.body.tvl = req.body.tvl ?? req.body.price;
  req.body.apr = req.body.apr ?? req.body.cuttedPrice;
  req.body.supply = req.body.supply ?? req.body.stock;
  req.body.vaultCategory = req.body.vaultCategory ?? req.body.category;

  let specs = [];
  req.body.specifications.forEach((s) => {
    specs.push(JSON.parse(s));
  });
  req.body.specifications = specs;

  const vault = await Vault.create(req.body);
  res.status(201).json({
    success: true,
    vault,
  });
});

exports.updateVault = asyncErrorHandler(async (req, res, next) => {
  let vault = await Vault.findById(req.params.id);
  if (!vault) {
    return next(new ErrorHandler("Vault Not Found", 404));
  }

  if (req.body.images !== undefined) {
    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
    for (let i = 0; i < vault.images.length; i++) {
      await cloudinary.v2.uploader.destroy(vault.images[i].public_id);
    }

    const imagesLink = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "vaults",
      });

      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
    req.body.images = imagesLink;
  }

  if (req.body.logo && req.body.logo.length > 0) {
    await cloudinary.v2.uploader.destroy(vault.token.logo.public_id);
    const result = await cloudinary.v2.uploader.upload(req.body.logo, {
      folder: "tokens",
    });
    const tokenLogo = {
      public_id: result.public_id,
      url: result.secure_url,
    };
    req.body.token = {
      name: req.body.tokenName,
      logo: tokenLogo,
    };
  }
  let specs = [];
  req.body.specifications.forEach((s) => {
    specs.push(JSON.parse(s));
  });
  req.body.specifications = specs;
  req.body.staker = req.staker.id;

  vault = await Vault.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(201).json({
    success: true,
    vault,
  });
});

exports.deleteVault = asyncErrorHandler(async (req, res, next) => {
  const vault = await Vault.findById(req.params.id);

  if (!vault) {
    return next(new ErrorHandler("Vault Not Found", 404));
  }

  for (let i = 0; i < vault.images.length; i++) {
    await cloudinary.v2.uploader.destroy(vault.images[i].public_id);
  }
  await vault.remove();
  res.status(201).json({
    success: true,
  });
});

exports.createVaultReview = asyncErrorHandler(async (req, res, next) => {
  const { rating, comment, vaultId } = req.body;
  const review = {
    staker: req.staker._id,
    name: req.staker.name,
    rating: Number(rating),
    comment,
  };
  const vault = await Vault.findById(vaultId);
  if (!vault) {
    return next(new ErrorHandler("Vault Not Found", 404));
  }
  const isReviewed = vault.comments.find(
    (entry) => entry.staker.toString() === req.staker._id.toString()
  );

  if (isReviewed) {
    vault.comments.forEach((rev) => {
      if (rev.staker.toString() === req.staker._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    vault.comments.push(review);
    vault.numOfComments = vault.comments.length;
  }
  let avg = 0;
  vault.comments.forEach((rev) => {
    avg += rev.rating;
  });
  vault.score = avg / vault.comments.length;

  await vault.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

exports.getVaultReviews = asyncErrorHandler(async (req, res, next) => {
  const vault = await Vault.findById(req.query.id);
  if (!vault) {
    return next(new ErrorHandler("Vault Not Found", 404));
  }
  res.status(200).json({
    success: true,
    comments: vault.comments,
  });
});

exports.deleteVaultReview = asyncErrorHandler(async (req, res, next) => {
  const vault = await Vault.findById(req.query.vaultId);

  if (!vault) {
    return next(new ErrorHandler("Vault Not Found", 404));
  }
  const comments = vault.comments.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );
  let avg = 0;

  comments.forEach((rev) => {
    avg += rev.rating;
  });
  let score = 0;
  if (comments.length === 0) {
    score = 0;
  } else {
    score = avg / comments.length;
  }
  const numOfComments = comments.length;

  await Vault.findByIdAndUpdate(
    req.query.vaultId,
    {
      comments,
      score: Number(score),
      numOfComments,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
  });
});

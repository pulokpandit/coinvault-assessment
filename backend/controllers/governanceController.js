const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");
const { getProposals, getProposal } = require("../utils/web3");

exports.listProposals = asyncErrorHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const result = await getProposals(limit);
  res.status(200).json({
    success: !result.error,
    ...result,
  });
});

exports.getProposalById = asyncErrorHandler(async (req, res, next) => {
  const proposal = await getProposal(req.params.id);
  if (proposal.error) {
    return next(new ErrorHandler(proposal.error, 404));
  }
  res.status(200).json({
    success: true,
    proposal,
  });
});

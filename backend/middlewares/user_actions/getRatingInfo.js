const VaultComment = require("../../models/vaultCommentModel");

module.exports = async (vault, newStar) => {
  let stars = await VaultComment.find({ product: vault._id }).select("star");
  let fiveStars = 0,
    fourStars = 0,
    threeStars = 0,
    twoStars = 0,
    oneStars = 0;
  stars.forEach((s) => {
    if (s.star === 5) fiveStars += 1;
    if (s.star === 4) fourStars += 1;
    if (s.star === 3) threeStars += 1;
    if (s.star === 2) twoStars += 1;
    if (s.star === 1) oneStars += 1;
  });
  if (newStar === 5) fiveStars += 1;
  if (newStar === 4) fourStars += 1;
  if (newStar === 3) threeStars += 1;
  if (newStar === 2) twoStars += 1;
  if (newStar === 1) oneStars += 1;

  let totalRatingUsers = fiveStars + fourStars + threeStars + twoStars + oneStars;
  let averageStar =
    (5 * fiveStars + 4 * fourStars + 3 * threeStars + 2 * twoStars + oneStars) /
    totalRatingUsers;

  return {
    fiveStars,
    fourStars,
    threeStars,
    twoStars,
    oneStars,
    averageStar,
    totalRatingUsers,
  };
};

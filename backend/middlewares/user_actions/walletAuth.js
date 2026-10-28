const { ethers } = require("ethers");

const verifyWalletSignature = (address, message, signature) => {
  if (!address || !message || !signature) return null;

  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch (error) {
    return null;
  }

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return null;
  }

  const normalizedMessage = message.toLowerCase();
  if (!message.includes("CoinVault") || !normalizedMessage.includes(address.toLowerCase())) {
    return null;
  }

  return recovered;
};

module.exports = { verifyWalletSignature };

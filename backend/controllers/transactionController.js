const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const { checkObjectId } = require("../middlewares/helpers/price");
const paytm = require("paytmchecksum");
const https = require("https");
const OnchainTx = require("../models/onchainTxModel");
const ErrorHandler = require("../utils/errorHandler");
const { v4: uuidv4 } = require("uuid");
const { verifyTransaction } = require("../utils/web3");

const recordOnchainTx = async (req, res, next) => {
  const { txHash, walletAddress, action, activityId } = req.body;
  const verification = await verifyTransaction(txHash, { action, walletAddress });

  if (!verification.ok) {
    return next(new ErrorHandler(verification.error, 400));
  }

  let transaction = null;
  try {
    const existing = await OnchainTx.findOne({ txHash: txHash.toLowerCase() });
    if (existing) {
      return res.status(200).json({
        success: true,
        transaction: existing,
        verification,
      });
    }

    transaction = await OnchainTx.create({
      txHash,
      chainId: verification.chainId,
      fromAddress: verification.from,
      toAddress: verification.to,
      confirmations: verification.confirmations,
      txnId: txHash,
      activityId: activityId || txHash,
      txnAmount: verification.value,
      txnType: verification.action || "crypto",
      gatewayName: "sepolia",
      txMode: "crypto",
      resultInfo: {
        resultStatus: verification.status,
        resultCode: verification.status === "success" ? "01" : "02",
        resultMsg: verification.vault || "on-chain",
      },
    });
  } catch (error) {
    // Verification still succeeds if Mongo is unavailable
  }

  res.status(200).json({
    success: true,
    transaction,
    verification,
  });
};

exports.verifyOnchainTx = asyncErrorHandler(recordOnchainTx);

exports.processTransaction = asyncErrorHandler(async (req, res, next) => {
  if (req.body.paymentType === "crypto" || req.body.txHash) {
    return recordOnchainTx(req, res, next);
  }

  const { amount, email, phoneNo } = req.body;
  var params = {};
  params["MID"] = process.env.PAYTM_MID;
  params["WEBSITE"] = process.env.PAYTM_WEBSITE;
  params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID;
  params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE;
  params["ORDER_ID"] = "oid" + uuidv4();
  params["CUST_ID"] = process.env.PAYTM_CUST_ID;
  params["TXN_AMOUNT"] = JSON.stringify(amount);
  params["CALLBACK_URL"] = `https://${req.get("host")}/api/v1/callback`;
  params["EMAIL"] = email;
  params["MOBILE_NO"] = phoneNo;

  let paytmChecksum = paytm.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
  paytmChecksum
    .then(function (checksum) {
      let checkoutParams = {
        ...params,
        CHECKSUMHASH: checksum,
      };

      res.status(200).json({
        checkoutParams,
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});

exports.fiatCallback = (req, res, next) => {
  let paytmChecksum = req.body.CHECKSUMHASH;
  delete req.body.CHECKSUMHASH;
  let isVerifySignature = paytm.verifySignature(
    req.body,
    process.env.PAYTM_MERCHANT_KEY,
    paytmChecksum
  );
  if (isVerifySignature) {
    var paytmParams = {};
    checkObjectId(req.body.MID);
    paytmParams.body = {
      mid: req.body.MID,
      orderId: req.body.ORDERID,
    };
    paytm
      .generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY)
      .then(function (checksum) {
        paytmParams.head = {
          signature: checksum,
        };

        var post_data = JSON.stringify(paytmParams);

        var options = {
          hostname: "securegw-stage.paytm.in",
          port: 443,
          path: "/v3/order/status",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": post_data.length,
          },
        };
        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", function () {
            let { body } = JSON.parse(response);
            addTransaction(body);
            res.redirect(`https://${req.get("host")}/activity/${body.orderId}`);
          });
        });

        post_req.write(post_data);
        post_req.end();
      });
  } else {
    console.log("Checksum Mismatched");
  }
};

const addTransaction = async (data) => {
  try {
    await OnchainTx.create({
      activityId: data.orderId,
      txnId: data.txnId,
      networkTxnId: data.bankTxnId,
      txnAmount: data.txnAmount,
      txnType: data.txnType,
      gatewayName: data.gatewayName,
      networkName: data.bankName,
      merchantId: data.mid,
      txMode: data.paymentMode,
      refundAmount: data.refundAmt,
      txnDate: data.txnDate,
      resultInfo: data.resultInfo,
    });
  } catch (error) {
    console.log("Transaction persist failed");
  }
};

exports.getTransactionStatus = asyncErrorHandler(async (req, res, next) => {
  const transaction = await OnchainTx.findOne({
    $or: [
      { activityId: req.params.id },
      { txHash: String(req.params.id).toLowerCase() },
      { txnId: req.params.id },
    ],
  });
  if (!transaction) {
    return next(new ErrorHandler("Transaction Details Not Found", 404));
  }
  const txn = {
    id: transaction.txnId || transaction.txHash,
    status: (transaction.resultInfo && transaction.resultInfo.resultStatus) || transaction.txMode,
    txHash: transaction.txHash,
    confirmations: transaction.confirmations,
  };
  res.status(200).json({
    success: true,
    txn,
    transaction,
  });
});

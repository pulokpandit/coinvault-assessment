const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");

const app = express();

// config
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

const wallet = require("./routes/walletRoute");
const vaults = require("./routes/vaultRoute");
const activity = require("./routes/activityRoute");
const stake = require("./routes/stakeRoute");
const tx = require("./routes/transactionRoute");
const governance = require("./routes/governanceRoute");
const leaderboard = require("./routes/leaderboardRoute");

app.use("/api/wallet", wallet);
app.use("/api/vaults", vaults);
app.use("/api/activity", activity);
app.use("/api/stake", stake);
app.use("/api/tx", tx);
app.use("/api/governance", governance);
app.use("/api/leaderboard", leaderboard);

// deployment
__dirname = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "CoinVault API is running",
      routes: {
        wallet: "/api/wallet",
        vaults: "/api/vaults",
        stake: "/api/stake",
        activity: "/api/activity",
        tx: "/api/tx",
        governance: "/api/governance",
        leaderboard: "/api/leaderboard",
      },
    });
  });
}

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

module.exports = app;

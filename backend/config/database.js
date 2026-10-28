const mongoose = require("mongoose");

const connectDatabase = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.log("MONGO_URI not set — vault catalog and chain reads still work");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Mongoose Connected");
  } catch (error) {
    console.log(`Mongoose connection failed: ${error.message}`);
  }
};

module.exports = connectDatabase;

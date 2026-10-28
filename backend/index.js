const app = require("./app");
const connectDatabase = require("./config/database");
const cloudinary = require("cloudinary");
const getPort = require("get-port").default;

const parsedPort = parseInt(process.env.PORT, 10);
const PORT = parsedPort || 4000;

process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

const startServer = async () => {
  await connectDatabase();

  if (process.env.CLOUDINARY_NAME) {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // getPort finds the first available port starting from PORT
  const final_port = await getPort({ port: PORT });

  app.listen(final_port, () => {
    console.log(`Server running on port ${final_port}`);
  });
};

startServer();
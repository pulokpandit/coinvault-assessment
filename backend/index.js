const app = require("./app");
const connectDatabase = require("./config/database");
const cloudinary = require("cloudinary");
const killPort = require("kill-port");
const getPort = require("get-port").default;

const parsedPort = parseInt(process.env.PORT, 10);
const PORT = parsedPort || 4000;

const checkPort = async (port, maxPort = 65535) => {
  if (port > maxPort) {
    throw new Error("No available ports found");
  }

  try {
    await killPort(port, "tcp");
    await killPort(port, "udp");
    return port;
  } catch (err) {
    return checkPort(port + 1, maxPort);
  }
};

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

  const safePort = await checkPort(PORT);
  const final_port = await getPort({ port: safePort });

  app.listen(final_port, () => {
    console.log(`Server running on port ${final_port}`);
  });
};

startServer();
require("dotenv").config();
const dns = require("node:dns");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const net = require("node:net");
const path = require("node:path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);

const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"));
});

const startServer = async () => {
  const port = Number(process.env.PORT || 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port between 1 and 65535.");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required.");
  }

  const dnsServers = process.env.DNS_SERVERS
    ?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers?.length) {
    if (dnsServers.some((server) => net.isIP(server) === 0)) {
      throw new Error("DNS_SERVERS must be a comma-separated list of IP addresses.");
    }
    dns.setServers(dnsServers);
  }

  await connectDB();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((err) => {
  console.error(`Backend startup failed: ${err.message}`);
  process.exitCode = 1;
});
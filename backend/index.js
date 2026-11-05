require("dotenv").config();
const dns = require("node:dns");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const net = require("node:net");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const mediaRoutes = require("./routes/media");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://ab-sniper.vercel.app",
      "https://ab-sniper-fkn2.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "AB-Sniper API",
    auth: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
    },
    media: {
      list: "GET /api/media",
      upload: "POST /api/media",
      delete: "DELETE /api/media/:id",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);

const QUOTES = {
  XAUUSD: "OANDA:XAU_USD",
  NAS100: "OANDA:NAS100_USD",
  EURUSD: "OANDA:EUR_USD",
  GBPUSD: "OANDA:GBP_USD",
  DXY: "TVC:DXY",
};

app.get("/api/quotes", async (req, res) => {
  const key = process.env.FINNHUB_KEY;
  if (!key) return res.status(500).json({ message: "FINNHUB_KEY missing" });

  try {
    const quotes = await Promise.all(
      Object.entries(QUOTES).map(async ([symbol, vendor]) => {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(vendor)}&token=${key}`
        );
        if (!response.ok) {
          throw new Error(`Finnhub quote request failed with status ${response.status}`);
        }
        const quote = await response.json();
        return {
          symbol,
          changePct: Number.isFinite(quote.dp) ? quote.dp : null,
        };
      })
    );
    res.json(quotes);
  } catch (err) {
    console.error(`Quote request failed: ${err.message}`);
    res.status(502).json({ message: "Quote provider request failed" });
  }
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

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((err) => {
  console.error(`Backend startup failed: ${err.message}`);
  process.exit(1);
});
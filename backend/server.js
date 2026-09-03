const usersRouter = require("./routes/users");
const portfoliosRouter = require("./routes/portfolios");
const holdingsRouter = require("./routes/holdings");
const watchlistRouter = require("./routes/watchlist");
const marketRouter = require("./routes/market");
const sectorRouter = require("./routes/sector");
const analyticsRouter = require("./routes/analytics");
const riskRouter = require("./routes/risk");
const recommendationsRouter = require("./routes/recommendations");
const intelligenceRouter = require("./routes/intelligence");
const aiRouter = require("./routes/ai");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use("/api/users", usersRouter);
app.use("/api/portfolios", portfoliosRouter);
app.use("/api/holdings", holdingsRouter);
app.use("/api/watchlist", watchlistRouter);
app.use("/api/market", marketRouter);
app.use("/api/sector", sectorRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/risk", riskRouter);
app.use(
  "/api/recommendations",
  recommendationsRouter
);
app.use("/api/intelligence", intelligenceRouter);
app.use("/api/ai", aiRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FinPilot API is running 🚀"
  });
});

app.listen(PORT, () => {
  console.log(`FinPilot API running on http://localhost:${PORT}`);
});
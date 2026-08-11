const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FinPilot API is running 🚀"
  });
});

app.listen(PORT, () => {
  console.log(`FinPilot API running on http://localhost:${PORT}`);
});
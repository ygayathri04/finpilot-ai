const express = require("express");
const router = express.Router();

const {
  getStockIntelligence,
} = require("../services/intelligenceService");

router.get("/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol;

    const intelligence = await getStockIntelligence(symbol);

    res.json(intelligence);
  } catch (error) {
    console.error(
      "Intelligence route error:",
      error.message
    );

    res.status(500).json({
      error: "Failed to get stock intelligence",
    });
  }
});

module.exports = router;

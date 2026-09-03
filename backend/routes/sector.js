const express = require("express");

const router = express.Router();

const {
  getSectorComparison,
} = require("../services/sectorService");

router.get("/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol;

    const comparison =
      await getSectorComparison(symbol);

    res.json(comparison);
  } catch (error) {
    console.error(
      "Sector comparison error:",
      error.message
    );

    res.status(500).json({
      error: "Failed to get sector comparison",
    });
  }
});

module.exports = router;
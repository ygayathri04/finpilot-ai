const express = require("express");

const router = express.Router();

router.get("/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const yahooSymbol = `${symbol}.NS`;

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1d&interval=1m`
    );

    if (!response.ok) {
      return res.status(404).json({
        error: "Stock not found",
      });
    }

    const data = await response.json();

    const result = data.chart.result?.[0];

    if (!result) {
      return res.status(404).json({
        error: "No market data found",
      });
    }

    const meta = result.meta;

    /*
     * Fetch company classification
     * from NSE.
     */
    let industryInfo = null;

    try {
      const nseResponse = await fetch(
        `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.nseindia.com/",
            "Accept": "application/json",
          },
        }
      );

      if (nseResponse.ok) {
        const nseData =
          await nseResponse.json();

        industryInfo =
          nseData.industryInfo || null;
      }
    } catch (nseError) {
      console.error(
        "NSE classification error:",
        nseError.message
      );
    }

    res.json({
      symbol,
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      currency: meta.currency,
      exchange: meta.exchangeName,
      marketState: meta.marketState,
      industryInfo,
    });
  } catch (error) {
    console.error(
      "Market data error:",
      error.message
    );

    res.status(500).json({
      error: "Failed to fetch market data",
    });
  }
});

module.exports = router;
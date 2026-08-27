const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;

    const holdingsResult = await pool.query(
      `SELECT symbol, quantity, average_price
       FROM holdings
       WHERE portfolio_id = $1
       ORDER BY id`,
      [portfolioId]
    );

    const holdings = holdingsResult.rows;

    if (holdings.length === 0) {
      return res.json({
        portfolioId: Number(portfolioId),
        totalInvested: 0,
        totalCurrentValue: 0,
        totalProfitLoss: 0,
        returnPercentage: 0,
        holdingsCount: 0,
      });
    }

    let totalInvested = 0;
    let totalCurrentValue = 0;

    const analytics = [];

    for (const holding of holdings) {
      const quantity = Number(holding.quantity);
      const averagePrice = Number(holding.average_price);

      const invested = quantity * averagePrice;

      let currentPrice = null;

      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${holding.symbol}.NS?range=1d&interval=1d`
        );

        if (response.ok) {
          const data = await response.json();
          const result = data.chart.result?.[0];

          currentPrice = result?.meta?.regularMarketPrice ?? null;
        }
      } catch (error) {
        console.error(
          `Failed to fetch ${holding.symbol}:`,
          error.message
        );
      }

      const currentValue = currentPrice
        ? quantity * currentPrice
        : null;

      const profitLoss =
        currentValue !== null
          ? currentValue - invested
          : null;

      const returnPercentage =
        profitLoss !== null && invested > 0
          ? (profitLoss / invested) * 100
          : null;

      totalInvested += invested;

      if (currentValue !== null) {
        totalCurrentValue += currentValue;
      }

      analytics.push({
        symbol: holding.symbol,
        quantity,
        averagePrice,
        currentPrice,
        invested,
        currentValue,
        profitLoss,
        returnPercentage,
      });
    }

    const totalProfitLoss =
      totalCurrentValue - totalInvested;

    const portfolioReturn =
      totalInvested > 0
        ? (totalProfitLoss / totalInvested) * 100
        : 0;

    res.json({
      portfolioId: Number(portfolioId),
      holdingsCount: holdings.length,
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      returnPercentage: portfolioReturn,
      holdings: analytics,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      error: "Failed to calculate portfolio analytics",
    });
  }
});

module.exports = router;
const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;

    const result = await pool.query(
      `SELECT symbol, quantity, average_price
       FROM holdings
       WHERE portfolio_id = $1
       ORDER BY id`,
      [portfolioId]
    );

    const holdings = result.rows;

    if (holdings.length === 0) {
      return res.json({
        portfolioId: Number(portfolioId),
        riskLevel: "LOW",
        diversification: 0,
        concentration: [],
        riskFlags: [],
      });
    }

    // Combine multiple lots of the same stock
    const grouped = {};

    for (const holding of holdings) {
      const symbol = holding.symbol;
      const quantity = Number(holding.quantity);
      const averagePrice = Number(holding.average_price);

      if (!grouped[symbol]) {
        grouped[symbol] = {
          symbol,
          quantity: 0,
          invested: 0,
          currentValue: 0,
        };
      }

      grouped[symbol].quantity += quantity;
      grouped[symbol].invested +=
        quantity * averagePrice;
    }

    // Fetch current prices
    for (const symbol of Object.keys(grouped)) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?range=1d&interval=1d`
        );

        if (response.ok) {
          const data = await response.json();

          const currentPrice =
            data.chart.result?.[0]?.meta
              ?.regularMarketPrice ?? null;

          if (currentPrice !== null) {
            grouped[symbol].currentPrice = currentPrice;

            grouped[symbol].currentValue =
              grouped[symbol].quantity * currentPrice;
          }
        }
      } catch (error) {
        console.error(
          `Failed to fetch ${symbol}:`,
          error.message
        );
      }
    }

    const stocks = Object.values(grouped);

    const totalCurrentValue = stocks.reduce(
      (total, stock) =>
        total + stock.currentValue,
      0
    );

    const concentration = stocks.map((stock) => ({
      symbol: stock.symbol,
      currentValue: stock.currentValue,
      percentage:
        totalCurrentValue > 0
          ? (stock.currentValue /
              totalCurrentValue) *
            100
          : 0,
    }));

    concentration.sort(
      (a, b) => b.percentage - a.percentage
    );

    const riskFlags = [];

    // Concentration risk
    for (const stock of concentration) {
      if (stock.percentage >= 60) {
        riskFlags.push(
          `Very high exposure to ${stock.symbol} (${stock.percentage.toFixed(
            1
          )}%)`
        );
      } else if (stock.percentage >= 40) {
        riskFlags.push(
          `High exposure to ${stock.symbol} (${stock.percentage.toFixed(
            1
          )}%)`
        );
      }
    }

    // Diversification risk
    if (stocks.length === 1) {
      riskFlags.push(
        "Portfolio is concentrated in a single stock"
      );
    } else if (stocks.length === 2) {
      riskFlags.push(
        "Portfolio has limited diversification"
      );
    }

    // Determine risk level
    let riskLevel = "LOW";

    const largestHolding =
      concentration[0]?.percentage ?? 0;

    if (
      largestHolding >= 60 ||
      stocks.length === 1
    ) {
      riskLevel = "HIGH";
    } else if (
      largestHolding >= 40 ||
      stocks.length <= 2
    ) {
      riskLevel = "MEDIUM";
    }

    res.json({
      portfolioId: Number(portfolioId),

      riskLevel,

      diversification: stocks.length,

      totalCurrentValue,

      concentration,

      riskFlags,

      stocks: stocks.map((stock) => ({
        symbol: stock.symbol,
        quantity: stock.quantity,
        currentPrice: stock.currentPrice ?? null,
        currentValue: stock.currentValue,
      })),
    });
  } catch (error) {
    console.error("Risk analysis error:", error);

    res.status(500).json({
      error: "Failed to calculate portfolio risk",
    });
  }
});

module.exports = router;
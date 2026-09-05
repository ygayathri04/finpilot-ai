/*
=====================================================
MARKET AGENT
=====================================================

Job:
- Understand how the stock is moving relative to
  the broader market.
- Use the market data already collected by FinPilot.
- Do NOT fetch duplicate market data.
- Do NOT decide the final cause of the movement.

The Reasoning Agent will combine this with the
News Agent and Company Agent later.
=====================================================
*/

function analyzeMarket(stockMovement = {}, marketContext = {}) {
  const stockChange = Number(
    stockMovement.changePercent
  );

  const marketChange = Number(
    marketContext.changePercent
  );

  /*
  ---------------------------------------------------
  Check whether enough data is available
  ---------------------------------------------------
  */

  if (
    !Number.isFinite(stockChange) ||
    !Number.isFinite(marketChange)
  ) {
    return {
      available: false,

      classification: "INSUFFICIENT_DATA",

      stockChangePercent: Number.isFinite(stockChange)
        ? stockChange
        : null,

      marketChangePercent: Number.isFinite(marketChange)
        ? marketChange
        : null,

      differenceFromMarket: null,

      explanation:
        "There is not enough market data to determine whether the stock movement is related to the broader market.",
    };
  }

  /*
  ---------------------------------------------------
  Calculate difference
  ---------------------------------------------------
  */

  const differenceFromMarket =
    Number((stockChange - marketChange).toFixed(2));

  /*
  ---------------------------------------------------
  Determine relationship
  ---------------------------------------------------
  */

  let classification;
  let explanation;

  /*
  Same direction
  */

  if (
    stockChange > 0 &&
    marketChange > 0
  ) {
    if (Math.abs(differenceFromMarket) <= 0.5) {
      classification = "MARKET_ALIGNED";

      explanation =
        "The stock and broader market are both moving upward, with the stock movement broadly aligned with the market.";
    } else {
      classification =
        "MARKET_OUTPERFORMING_OR_UNDERPERFORMING";

      explanation =
        "The stock and broader market are moving in the same direction, but the stock is moving noticeably differently from the market.";
    }
  }

  else if (
    stockChange < 0 &&
    marketChange < 0
  ) {
    if (Math.abs(differenceFromMarket) <= 0.5) {
      classification = "MARKET_ALIGNED";

      explanation =
        "The stock and broader market are both moving downward, with the stock movement broadly aligned with the market.";
    } else {
      classification =
        "MARKET_OUTPERFORMING_OR_UNDERPERFORMING";

      explanation =
        "The stock and broader market are moving in the same direction, but the stock is declining noticeably differently from the market.";
    }
  }

  /*
  ---------------------------------------------------
  Opposite directions
  ---------------------------------------------------
  */

  else if (
    stockChange > 0 &&
    marketChange < 0
  ) {
    classification = "MARKET_DIVERGENCE";

    explanation =
      "The stock is rising while the broader market is falling, suggesting the stock may be responding to factors beyond the overall market.";
  }

  else if (
    stockChange < 0 &&
    marketChange > 0
  ) {
    classification = "MARKET_DIVERGENCE";

    explanation =
      "The stock is falling while the broader market is rising, suggesting company-specific or other factors may be contributing to the movement.";
  }

  /*
  ---------------------------------------------------
  No meaningful movement
  ---------------------------------------------------
  */

  else {
    classification = "MARKET_NEUTRAL";

    explanation =
      "The stock and broader market show little directional movement, so there is limited evidence of a market-driven move.";
  }

  /*
  ---------------------------------------------------
  Return structured Market Agent result
  ---------------------------------------------------
  */

  return {
    available: true,

    classification,

    stockChangePercent: stockChange,

    marketChangePercent: marketChange,

    differenceFromMarket,

    marketDirection:
      marketChange > 0
        ? "UP"
        : marketChange < 0
        ? "DOWN"
        : "FLAT",

    stockDirection:
      stockChange > 0
        ? "UP"
        : stockChange < 0
        ? "DOWN"
        : "FLAT",

    explanation,
  };
}


module.exports = {
  analyzeMarket,
};
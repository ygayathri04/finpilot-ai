async function getNifty50Data() {
  try {
    const response = await fetch(
      "https://www.nseindia.com/api/allIndices",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://www.nseindia.com/",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `NSE returned status ${response.status}`
      );
    }

    const data = await response.json();

    const nifty = data.data?.find(
      (item) => item.index === "NIFTY 50"
    );

    if (!nifty) {
      throw new Error("NIFTY 50 data not found");
    }

    return {
      index: "NIFTY 50",
      currentValue: nifty.last,
      previousClose: nifty.previousClose,
      change: nifty.variation,
      changePercent: nifty.percentChange,
      direction:
        nifty.percentChange > 0
          ? "UP"
          : nifty.percentChange < 0
          ? "DOWN"
          : "UNCHANGED",
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error(
      "NIFTY 50 data error:",
      error.message
    );

    return null;
  }
}

function compareWithMarket(
  stockChangePercent,
  niftyChangePercent
) {
  if (
    stockChangePercent == null ||
    niftyChangePercent == null
  ) {
    return {
      classification: "INSUFFICIENT_DATA",
      difference: null,
      explanation:
        "There is not enough data to compare the stock with the broader market.",
    };
  }

  const difference = Number(
    (
      stockChangePercent -
      niftyChangePercent
    ).toFixed(2)
  );

  const sameDirection =
    Math.sign(stockChangePercent) ===
    Math.sign(niftyChangePercent);

  if (
    sameDirection &&
    Math.abs(difference) <= 0.5
  ) {
    return {
      classification: "MARKET_ALIGNED",
      difference,
      explanation:
        "The stock is moving broadly in line with the broader market.",
    };
  }

  if (!sameDirection) {
    return {
      classification: "MARKET_DIVERGENCE",
      difference,
      explanation:
        "The stock is moving in the opposite direction to the broader market, indicating that company or sector factors may be more important than the overall market direction.",
    };
  }

  return {
    classification: "MARKET_OUTPERFORMING_OR_UNDERPERFORMING",
    difference,
    explanation:
      "The stock is moving in the same direction as the broader market but with a meaningfully different magnitude.",
  };
}

async function getMarketContext(
  stockChangePercent
) {
  const nifty = await getNifty50Data();

  if (!nifty) {
    return {
      index: "NIFTY 50",
      data: null,
      comparison: {
        classification: "INSUFFICIENT_DATA",
        difference: null,
        explanation:
          "NIFTY 50 market data is currently unavailable.",
      },
    };
  }

  const comparison =
    compareWithMarket(
      stockChangePercent,
      nifty.changePercent
    );

  return {
    index: "NIFTY 50",
    data: nifty,
    comparison,
  };
}

module.exports = {
  getMarketContext,
};
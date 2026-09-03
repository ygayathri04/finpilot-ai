const DEFAULT_SECTOR_STOCKS = {
  IT: ["TCS", "INFY", "HCLTECH", "WIPRO"],
};

const STOCK_SECTORS = {
  TCS: "IT",
  INFY: "IT",
  HCLTECH: "IT",
  WIPRO: "IT",
};

async function getMarketData(symbol) {
  const response = await fetch(
    `http://localhost:5001/api/market/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Market data unavailable for ${symbol}`);
  }

  return response.json();
}

function calculateChangePercent(market) {
  if (
    !market ||
    market.price == null ||
    market.previousClose == null ||
    market.previousClose === 0
  ) {
    return null;
  }

  return Number(
    (
      ((market.price - market.previousClose) /
        market.previousClose) *
      100
    ).toFixed(2)
  );
}

function calculateAverage(values) {
  const validValues = values.filter(
    (value) => value != null && Number.isFinite(value)
  );

  if (validValues.length === 0) {
    return null;
  }

  const total = validValues.reduce(
    (sum, value) => sum + value,
    0
  );

  return Number(
    (total / validValues.length).toFixed(2)
  );
}

function determineMovement(targetChange, sectorAverage) {
  if (
    targetChange == null ||
    sectorAverage == null
  ) {
    return {
      classification: "INSUFFICIENT_DATA",
      explanation:
        "There is not enough market data to compare the stock with its sector.",
    };
  }

  const difference = Number(
    (targetChange - sectorAverage).toFixed(2)
  );

  const sameDirection =
    Math.sign(targetChange) ===
    Math.sign(sectorAverage);

  const closeToSector =
    Math.abs(difference) <= 0.25;

  if (sameDirection && closeToSector) {
    return {
      classification: "SECTOR_WIDE",
      difference,
      explanation:
        "The stock is moving broadly in line with its sector, suggesting the movement may be influenced by broader sector conditions.",
    };
  }

  if (!sameDirection || Math.abs(difference) >= 0.75) {
    return {
      classification: "COMPANY_SPECIFIC",
      difference,
      explanation:
        "The stock is moving differently from its sector peers, suggesting company-specific factors may be contributing to the movement.",
    };
  }

  return {
    classification: "MIXED",
    difference,
    explanation:
      "The stock shows some movement beyond the sector average, but the available data does not clearly indicate a purely company-specific or sector-wide move.",
  };
}

async function getSectorComparison(symbol) {
  const upperSymbol = symbol.toUpperCase();

  const sector = STOCK_SECTORS[upperSymbol];

  if (!sector) {
    return {
      symbol: upperSymbol,
      sector: null,
      sectorAverageChangePercent: null,
      peers: [],
      comparison: {
        classification: "UNKNOWN_SECTOR",
        explanation:
          "A sector comparison is not currently configured for this stock.",
      },
    };
  }

  const sectorStocks =
    DEFAULT_SECTOR_STOCKS[sector] || [];

  const peerResults = await Promise.all(
    sectorStocks.map(async (stockSymbol) => {
      try {
        const market = await getMarketData(
          stockSymbol
        );

        const changePercent =
          calculateChangePercent(market);

        return {
          symbol: stockSymbol,
          price: market.price,
          previousClose: market.previousClose,
          changePercent,
        };
      } catch (error) {
        console.error(
          `Sector market data error for ${stockSymbol}:`,
          error.message
        );

        return {
          symbol: stockSymbol,
          price: null,
          previousClose: null,
          changePercent: null,
        };
      }
    })
  );

  const sectorAverageChangePercent =
    calculateAverage(
      peerResults.map(
        (peer) => peer.changePercent
      )
    );

  const targetPeer = peerResults.find(
    (peer) => peer.symbol === upperSymbol
  );

  const targetChangePercent =
    targetPeer?.changePercent ?? null;

  const comparison = determineMovement(
    targetChangePercent,
    sectorAverageChangePercent
  );

  return {
    symbol: upperSymbol,
    sector,
    targetChangePercent,
    sectorAverageChangePercent,
    differenceFromSector:
      comparison.difference ?? null,
    peers: peerResults,
    comparison,
  };
}

module.exports = {
  getSectorComparison,
};
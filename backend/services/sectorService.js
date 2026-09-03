const pool = require("../db");


// =====================================================
// GET COMPANY METADATA
// =====================================================

async function getCompanyMetadata(symbol) {
  const result = await pool.query(
    `
    SELECT
      symbol,
      company_name,
      macro_sector,
      sector,
      industry,
      basic_industry
    FROM company_metadata
    WHERE symbol = $1
    `,
    [symbol]
  );

  return result.rows[0] || null;
}


// =====================================================
// GET LIVE MARKET DATA
// =====================================================

async function getMarketData(symbol) {
  const response = await fetch(
    `http://localhost:5001/api/market/${symbol}`
  );

  if (!response.ok) {
    throw new Error(
      `Market data unavailable for ${symbol}`
    );
  }

  return response.json();
}


// =====================================================
// CALCULATE STOCK CHANGE %
// =====================================================

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


// =====================================================
// CALCULATE AVERAGE
// =====================================================

function calculateAverage(values) {
  const validValues = values.filter(
    (value) =>
      value != null &&
      Number.isFinite(value)
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


// =====================================================
// DETERMINE STOCK VS PEERS
// =====================================================

function determineMovement(
  targetChange,
  sectorAverage
) {
  if (
    targetChange == null ||
    sectorAverage == null
  ) {
    return {
      classification: "INSUFFICIENT_DATA",
      explanation:
        "There is not enough market data to compare the stock with its peers.",
    };
  }

  const difference = Number(
    (
      targetChange -
      sectorAverage
    ).toFixed(2)
  );

  const sameDirection =
    Math.sign(targetChange) ===
    Math.sign(sectorAverage);

  const closeToPeers =
    Math.abs(difference) <= 0.25;

  if (
    sameDirection &&
    closeToPeers
  ) {
    return {
      classification: "SECTOR_WIDE",
      difference,
      explanation:
        "The stock is moving broadly in line with its peers, suggesting broader sector conditions may be influencing the movement.",
    };
  }

  if (
    !sameDirection ||
    Math.abs(difference) >= 0.75
  ) {
    return {
      classification: "COMPANY_SPECIFIC",
      difference,
      explanation:
        "The stock is moving differently from its peers, suggesting company-specific factors may be contributing to the movement.",
    };
  }

  return {
    classification: "MIXED",
    difference,
    explanation:
      "The stock shows some movement beyond its peers, but the available data does not clearly indicate a purely company-specific or sector-wide move.",
  };
}


// =====================================================
// FIND PEER COMPANIES
//
// Priority:
// 1. Basic Industry
// 2. Industry
// 3. Sector
// 4. Macro Sector
// =====================================================

async function getPeerCandidates(company) {
  let classificationLevel = null;
  let classificationValue = null;

  if (company.basic_industry) {
    classificationLevel = "basic_industry";
    classificationValue = company.basic_industry;
  } else if (company.industry) {
    classificationLevel = "industry";
    classificationValue = company.industry;
  } else if (company.sector) {
    classificationLevel = "sector";
    classificationValue = company.sector;
  } else if (company.macro_sector) {
    classificationLevel = "macro_sector";
    classificationValue = company.macro_sector;
  }

  // No classification available
  if (!classificationLevel) {
    return {
      level: null,
      value: null,
      candidates: [],
    };
  }

  const allowedColumns = {
    basic_industry: "basic_industry",
    industry: "industry",
    sector: "sector",
    macro_sector: "macro_sector",
  };

  const column =
    allowedColumns[classificationLevel];

  const result = await pool.query(
    `
    SELECT
      symbol,
      company_name,
      basic_industry,
      industry,
      sector,
      macro_sector
    FROM company_metadata
    WHERE ${column} = $1
      AND symbol <> $2
    ORDER BY symbol
    LIMIT 20
    `,
    [
      classificationValue,
      company.symbol,
    ]
  );

  return {
    level: classificationLevel,
    value: classificationValue,
    candidates: result.rows,
  };
}


// =====================================================
// GET PEERS WITH VALID LIVE MARKET DATA
// =====================================================

async function getValidPeers(candidates) {
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const market =
          await getMarketData(
            candidate.symbol
          );

        const changePercent =
          calculateChangePercent(
            market
          );

        if (changePercent == null) {
          return null;
        }

        return {
          symbol: candidate.symbol,

          companyName:
            candidate.company_name,

          price:
            market.price,

          previousClose:
            market.previousClose,

          changePercent,

          basicIndustry:
            candidate.basic_industry,

          industry:
            candidate.industry,

          sector:
            candidate.sector,
        };
      } catch (error) {
        console.error(
          `Peer market data error for ${candidate.symbol}:`,
          error.message
        );

        return null;
      }
    })
  );

  return results
    .filter(
      (peer) => peer !== null
    )
    .slice(0, 7);
}


// =====================================================
// MAIN SECTOR COMPARISON
// =====================================================

async function getSectorComparison(symbol) {
  const upperSymbol =
    symbol.toUpperCase();

  // ---------------------------------------------------
  // 1. Get company classification
  // ---------------------------------------------------

  const company =
    await getCompanyMetadata(
      upperSymbol
    );

  if (!company) {
    return {
      symbol: upperSymbol,

      companyName: null,

      macroSector: null,

      sector: null,

      industry: null,

      basicIndustry: null,

      classificationLevel: null,

      classificationValue: null,

      targetChangePercent: null,

      sectorAverageChangePercent: null,

      differenceFromSector: null,

      peers: [],

      comparison: {
        classification:
          "UNKNOWN_SECTOR",

        explanation:
          "Company classification information is not available in the local company metadata database.",
      },
    };
  }


  // ---------------------------------------------------
  // 2. Find the most specific peer classification
  // ---------------------------------------------------

  const peerData =
    await getPeerCandidates(
      company
    );


  // ---------------------------------------------------
  // 3. If no peers are available
  // ---------------------------------------------------

  if (
    !peerData.level ||
    peerData.candidates.length === 0
  ) {
    return {
      symbol: upperSymbol,

      companyName:
        company.company_name,

      macroSector:
        company.macro_sector,

      sector:
        company.sector,

      industry:
        company.industry,

      basicIndustry:
        company.basic_industry,

      // IMPORTANT:
      // These fields tell the frontend
      // exactly what classification was used.
      classificationLevel:
        peerData.level,

      classificationValue:
        peerData.value,

      targetChangePercent: null,

      sectorAverageChangePercent: null,

      differenceFromSector: null,

      peers: [],

      comparison: {
        classification:
          "INSUFFICIENT_DATA",

        explanation:
          "There are not enough companies with matching classification information to build a peer comparison.",
      },
    };
  }


  // ---------------------------------------------------
  // 4. Get live market data for peers
  // ---------------------------------------------------

  const validPeers =
    await getValidPeers(
      peerData.candidates
    );


  // ---------------------------------------------------
  // 5. Get target company's live market data
  // ---------------------------------------------------

  let targetPeer = null;

  try {
    const market =
      await getMarketData(
        upperSymbol
      );

    targetPeer = {
      symbol:
        upperSymbol,

      companyName:
        company.company_name,

      price:
        market.price,

      previousClose:
        market.previousClose,

      changePercent:
        calculateChangePercent(
          market
        ),

      basicIndustry:
        company.basic_industry,

      industry:
        company.industry,

      sector:
        company.sector,
    };
  } catch (error) {
    console.error(
      `Target market data error for ${upperSymbol}:`,
      error.message
    );

    targetPeer = {
      symbol:
        upperSymbol,

      companyName:
        company.company_name,

      price: null,

      previousClose: null,

      changePercent: null,

      basicIndustry:
        company.basic_industry,

      industry:
        company.industry,

      sector:
        company.sector,
    };
  }


  // ---------------------------------------------------
  // 6. Combine target + peers
  // ---------------------------------------------------

  const peerResults = [
    targetPeer,
    ...validPeers,
  ];


  // ---------------------------------------------------
  // 7. Calculate peer average
  // ---------------------------------------------------

  const sectorAverageChangePercent =
    calculateAverage(
      peerResults.map(
        (peer) =>
          peer.changePercent
      )
    );


  // ---------------------------------------------------
  // 8. Target stock movement
  // ---------------------------------------------------

  const targetChangePercent =
    targetPeer.changePercent;


  // ---------------------------------------------------
  // 9. Compare stock with peers
  // ---------------------------------------------------

  const comparison =
    determineMovement(
      targetChangePercent,
      sectorAverageChangePercent
    );


  // ---------------------------------------------------
  // 10. FINAL RESPONSE
  // ---------------------------------------------------

  return {
    symbol: upperSymbol,

    companyName:
      company.company_name,

    macroSector:
      company.macro_sector,

    sector:
      company.sector,

    industry:
      company.industry,

    basicIndustry:
      company.basic_industry,

    // ⭐ IMPORTANT
    // This should now return:
    // "sector"
    classificationLevel:
      peerData.level,

    // ⭐ IMPORTANT
    // For PNB this should return:
    // "Finance"
    classificationValue:
      peerData.value,

    targetChangePercent,

    sectorAverageChangePercent,

    differenceFromSector:
      comparison.difference ??
      null,

    peers:
      peerResults,

    comparison,
  };
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getSectorComparison,
};
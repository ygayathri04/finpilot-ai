/*
=====================================================
COMPANY AGENT
=====================================================

Job:
- Understand company-specific and sector-specific
  signals around a stock.
- Use evidence already collected by FinPilot.
- Compare the stock with its relevant peers.
- Identify whether the movement appears different
  from the sector.

The Company Agent does NOT decide the final cause.
That job belongs to the Reasoning Agent.
=====================================================
*/

function analyzeCompany(
  stockMovement = {},
  sectorComparison = {}
) {
  const stockChange = Number(
    stockMovement.changePercent
  );

  const sectorAverage = Number(
    sectorComparison.sectorAverageChangePercent
  );

  const differenceFromSector = Number(
    sectorComparison.differenceFromSector
  );

  const classification =
    sectorComparison.comparison?.classification ||
    null;

  const classificationLevel =
    sectorComparison.classificationLevel ||
    null;

  const classificationValue =
    sectorComparison.classificationValue ||
    sectorComparison.sector ||
    null;

  /*
  ---------------------------------------------------
  Peer information
  ---------------------------------------------------
  */

  const peers = Array.isArray(
    sectorComparison.peers
  )
    ? sectorComparison.peers
    : [];

  /*
  ---------------------------------------------------
  Check available data
  ---------------------------------------------------
  */

  if (
    !Number.isFinite(stockChange) ||
    !Number.isFinite(sectorAverage) ||
    peers.length === 0
  ) {
    return {
      available: false,

      companySignal: "INSUFFICIENT_DATA",

      classification: "INSUFFICIENT_DATA",

      classificationLevel,

      classificationValue,

      stockChangePercent: Number.isFinite(stockChange)
        ? stockChange
        : null,

      sectorAverageChangePercent:
        Number.isFinite(sectorAverage)
          ? sectorAverage
          : null,

      differenceFromSector:
        Number.isFinite(differenceFromSector)
          ? differenceFromSector
          : null,

      peerCount: peers.length,

      peers: [],

      explanation:
        peers.length === 0
          ? `FinPilot could not find enough relevant peer companies to compare ${sectorComparison.symbol || "the stock"} with its sector.`
          : "There is not enough company or peer data to determine whether the stock is moving differently from its sector.",
    };
  }

  /*
  ---------------------------------------------------
  Determine company-specific relationship
  ---------------------------------------------------
  */

  let companySignal;
  let explanation;

  if (
    classification === "COMPANY_SPECIFIC"
  ) {
    companySignal = "COMPANY_SPECIFIC";

    explanation =
      `The stock is moving differently from its ${
        classificationLevel || "sector"
      } peers, suggesting company-specific factors may be contributing to the movement.`;
  }

  else if (
    Math.abs(differenceFromSector) <= 0.5
  ) {
    companySignal = "SECTOR_ALIGNED";

    explanation =
      `The stock movement is broadly aligned with its ${
        classificationLevel || "sector"
      } peers, so sector-wide factors may be contributing to the movement.`;
  }

  else {
    companySignal =
      "COMPANY_OUTPERFORMING_OR_UNDERPERFORMING";

    explanation =
      `The stock is moving noticeably differently from its ${
        classificationLevel || "sector"
      } peers, which may indicate company-specific factors in addition to sector movement.`;
  }

  /*
  ---------------------------------------------------
  Peer summary
  ---------------------------------------------------
  */

  const peerSummary = peers
    .slice(0, 10)
    .map((peer) => ({
      symbol: peer.symbol,
      companyName: peer.companyName,
      changePercent: peer.changePercent,
    }));

  /*
  ---------------------------------------------------
  Return structured Company Agent result
  ---------------------------------------------------
  */

  return {
    available: true,

    companySignal,

    classification,

    classificationLevel,

    classificationValue,

    stockChangePercent: stockChange,

    sectorAverageChangePercent:
      sectorAverage,

    differenceFromSector:
      Number.isFinite(differenceFromSector)
        ? differenceFromSector
        : Number(
            (stockChange - sectorAverage).toFixed(2)
          ),

    peerCount: peers.length,

    peers: peerSummary,

    explanation,
  };
}


module.exports = {
  analyzeCompany,
};
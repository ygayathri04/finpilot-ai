const { getCompanyNews } = require("./newsService");
const { askStockReasoning } = require("../ai");
const { getMarketContext } = require("./marketContextService");


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
// CALCULATE PRICE MOVEMENT
// =====================================================

function calculatePriceMovement(market) {
  if (
    !market ||
    market.price == null ||
    market.previousClose == null ||
    market.previousClose === 0
  ) {
    return null;
  }

  const change =
    Number(
      (
        market.price -
        market.previousClose
      ).toFixed(2)
    );

  const changePercent =
    Number(
      (
        ((market.price -
          market.previousClose) /
          market.previousClose) *
        100
      ).toFixed(2)
    );

  let direction = "UNCHANGED";

  if (changePercent > 0) {
    direction = "UP";
  } else if (changePercent < 0) {
    direction = "DOWN";
  }

  return {
    currentPrice: market.price,
    previousClose: market.previousClose,
    change,
    changePercent,
    direction,
  };
}


// =====================================================
// MOVEMENT SUMMARY
// =====================================================

function createMovementSummary(
  symbol,
  priceMovement
) {
  if (!priceMovement) {
    return `${symbol} market movement data is currently unavailable.`;
  }

  if (
    priceMovement.direction ===
    "UNCHANGED"
  ) {
    return `${symbol} is unchanged from the previous close.`;
  }

  const movement =
    priceMovement.direction === "UP"
      ? "up"
      : "down";

  return `${symbol} is ${movement} ${Math.abs(
    priceMovement.changePercent
  ).toFixed(2)}% from the previous close.`;
}


// =====================================================
// CLASSIFY COMPANY ANNOUNCEMENTS
//
// Important:
// Regulatory actions, penalties, notices and orders
// should NOT automatically be classified as contracts.
// =====================================================

function classifyEvent(event) {
  const title =
    `${event.title || ""}`.toLowerCase();

  const description =
    `${event.description || ""}`.toLowerCase();

  const text = `
    ${title}
    ${description}
  `.toLowerCase();


  // ---------------------------------------------------
  // REGULATORY / PENALTY / LEGAL ACTION
  // ---------------------------------------------------

  if (
    text.includes("penalty") ||
    text.includes("penal") ||
    text.includes("fine") ||
    text.includes("regulatory action") ||
    text.includes("regulatory order") ||
    text.includes("regulatory notice") ||
    text.includes("show cause notice") ||
    text.includes("show-cause notice") ||
    text.includes("notice from") ||
    text.includes("order passed") ||
    text.includes("orders passed") ||
    text.includes("action(s) initiated") ||
    text.includes("action initiated") ||
    text.includes("legal action") ||
    text.includes("proceedings") ||
    text.includes("violation") ||
    text.includes("non-compliance") ||
    text.includes("non compliance") ||
    text.includes("sebi") ||
    text.includes("rbi penalty") ||
    text.includes("rbi order")
  ) {
    return {
      type: "REGULATORY_ACTION",
      impact: "HIGH",
    };
  }


  // ---------------------------------------------------
  // ACQUISITION / MERGER
  // ---------------------------------------------------

  if (
    text.includes("acquisition") ||
    text.includes("acquire") ||
    text.includes("acquired") ||
    text.includes("merger") ||
    text.includes("amalgamation")
  ) {
    return {
      type: "ACQUISITION",
      impact: "HIGH",
    };
  }


  // ---------------------------------------------------
  // ACTUAL CONTRACT / BUSINESS ORDER
  //
  // We deliberately avoid treating generic
  // "order passed" or regulatory "orders"
  // as business contracts.
  // ---------------------------------------------------

  if (
    text.includes("contract") ||
    text.includes("contract awarded") ||
    text.includes("contract wins") ||
    text.includes("contract win") ||
    text.includes("order win") ||
    text.includes("order wins") ||
    text.includes("received an order") ||
    text.includes("received orders") ||
    text.includes("purchase order") ||
    text.includes("work order") ||
    text.includes("bagging") ||
    text.includes("bagged")
  ) {
    return {
      type: "CONTRACT",
      impact: "HIGH",
    };
  }


  // ---------------------------------------------------
  // PARTNERSHIP / COLLABORATION
  // ---------------------------------------------------

  if (
    text.includes("partnership") ||
    text.includes("collaboration") ||
    text.includes("joint venture") ||
    text.includes("strategic alliance") ||
    text.includes("strategic partnership")
  ) {
    return {
      type: "PARTNERSHIP",
      impact: "MEDIUM",
    };
  }


  // ---------------------------------------------------
  // EARNINGS / FINANCIAL RESULTS
  // ---------------------------------------------------

  if (
    text.includes("earnings") ||
    text.includes("results") ||
    text.includes("profit") ||
    text.includes("financial results") ||
    text.includes("quarterly results") ||
    text.includes("annual results") ||
    text.includes("revenue") ||
    text.includes("ebitda")
  ) {
    return {
      type: "EARNINGS",
      impact: "HIGH",
    };
  }


  // ---------------------------------------------------
  // CORPORATE ACTION
  // ---------------------------------------------------

  if (
    text.includes("dividend") ||
    text.includes("bonus") ||
    text.includes("stock split") ||
    text.includes("split") ||
    text.includes("record date") ||
    text.includes("buyback") ||
    text.includes("rights issue")
  ) {
    return {
      type: "CORPORATE_ACTION",
      impact: "MEDIUM",
    };
  }


  // ---------------------------------------------------
  // MANAGEMENT
  // ---------------------------------------------------

  if (
    text.includes("resignation") ||
    text.includes("resigned") ||
    text.includes("appointment") ||
    text.includes("appointed") ||
    text.includes("director") ||
    text.includes("management") ||
    text.includes("chief executive") ||
    text.includes("ceo") ||
    text.includes("cfo")
  ) {
    return {
      type: "MANAGEMENT",
      impact: "MEDIUM",
    };
  }


  // ---------------------------------------------------
  // DEFAULT
  // ---------------------------------------------------

  return {
    type: "COMPANY_UPDATE",
    impact: "LOW",
  };
}


// =====================================================
// READABLE EVENT TYPE
// =====================================================

function getReadableEventType(type) {
  const labels = {
    ACQUISITION:
      "acquisition or merger",

    CONTRACT:
      "contract or business order",

    PARTNERSHIP:
      "partnership",

    EARNINGS:
      "earnings or results announcement",

    CORPORATE_ACTION:
      "corporate action",

    MANAGEMENT:
      "management update",

    REGULATORY_ACTION:
      "regulatory or legal action",

    COMPANY_UPDATE:
      "company update",
  };

  return (
    labels[type] ||
    "company update"
  );
}


// =====================================================
// INVESTOR EXPLANATION
// =====================================================

function createInvestorExplanation(type) {
  const explanations = {
    ACQUISITION:
      "An acquisition or merger can affect the company's future growth, assets, costs, and competitive position.",

    CONTRACT:
      "A major contract or business order can indicate stronger future revenue or business demand.",

    PARTNERSHIP:
      "A partnership can create new business opportunities, customers, technology access, or distribution channels.",

    EARNINGS:
      "Earnings and financial results provide direct information about revenue, profit, margins, and business performance.",

    CORPORATE_ACTION:
      "A corporate action such as a dividend, bonus, buyback, or stock split can affect investor expectations and trading activity.",

    MANAGEMENT:
      "A management change can influence investor expectations about the company's future strategy and execution.",

    REGULATORY_ACTION:
      "A regulatory or legal action can create financial, compliance, reputational, or operational risks for the company.",

    COMPANY_UPDATE:
      "This is a company-specific announcement that may provide additional context about the business.",
  };

  return (
    explanations[type] ||
    explanations.COMPANY_UPDATE
  );
}


// =====================================================
// ENRICH EVENT
// =====================================================

function enrichEvent(event) {
  const classification =
    classifyEvent(event);

  return {
    ...event,

    type:
      classification.type,

    impact:
      event.impact ||
      classification.impact,

    confidence:
      event.confidence ||
      (
        classification.impact ===
        "HIGH"
          ? "HIGH"
          : classification.impact ===
            "MEDIUM"
          ? "MEDIUM"
          : "LOW"
      ),

    relevanceScore:
      event.relevanceScore ??
      0,

    investorExplanation:
      event.investorExplanation ||
      createInvestorExplanation(
        classification.type
      ),
  };
}


// =====================================================
// CAUSE ASSESSMENT
// =====================================================

function createCauseAssessment({
  priceMovement,
  sectorComparison,
  marketContext,
  topEvent,
}) {
  if (!priceMovement) {
    return "There is not enough market data to assess the stock movement.";
  }

  const reasons = [];


  // ---------------------------------------------------
  // Recent company event
  // ---------------------------------------------------

  if (
    topEvent &&
    topEvent.impact === "HIGH"
  ) {
    const readableEvent =
      getReadableEventType(
        topEvent.type
      );

    reasons.push(
      `A recent ${readableEvent} may be relevant to the stock movement, although the available evidence does not prove that it caused today's move.`
    );
  }


  // ---------------------------------------------------
  // Sector-wide movement
  // ---------------------------------------------------

  if (
    sectorComparison?.comparison
      ?.classification ===
    "SECTOR_WIDE"
  ) {
    reasons.push(
      "The stock is moving broadly in line with its sector peers, so broader sector conditions may be influencing the move."
    );
  }


  // ---------------------------------------------------
  // Market alignment
  // ---------------------------------------------------

  if (
    marketContext?.comparison
      ?.classification ===
    "MARKET_ALIGNED"
  ) {
    reasons.push(
      "The stock is also moving broadly in line with the wider market."
    );
  }


  // ---------------------------------------------------
  // Company-specific movement
  // ---------------------------------------------------

  if (
    sectorComparison?.comparison
      ?.classification ===
    "COMPANY_SPECIFIC"
  ) {
    reasons.push(
      "The stock is moving differently from its sector peers, which suggests company-specific factors may be contributing to the move."
    );
  }


  // ---------------------------------------------------
  // Market divergence
  // ---------------------------------------------------

  if (
    marketContext?.comparison
      ?.classification ===
    "MARKET_DIVERGENCE"
  ) {
    reasons.push(
      "The stock is moving in the opposite direction to the broader market, which makes company or sector factors more relevant."
    );
  }


  if (
    reasons.length === 0
  ) {
    return "The available evidence does not clearly identify a single reason for the stock movement.";
  }

  return reasons.join(" ");
}


// =====================================================
// FALLBACK REASONING
// =====================================================

function createFallbackReasoning({
  symbol,
  priceMovement,
  sectorComparison,
  marketContext,
  topEvent,
}) {
  if (!priceMovement) {
    return `${symbol} movement cannot be assessed because market data is unavailable.`;
  }

  const parts = [];


  parts.push(
    `${symbol} is ${
      priceMovement.direction ===
      "UP"
        ? "up"
        : priceMovement.direction ===
          "DOWN"
        ? "down"
        : "unchanged"
    } ${Math.abs(
      priceMovement.changePercent
    ).toFixed(2)}% based on the available market data.`
  );


  if (
    marketContext?.data
      ?.changePercent != null
  ) {
    parts.push(
      `The NIFTY 50 is ${
        marketContext.data
          .changePercent >= 0
          ? "up"
          : "down"
      } ${Math.abs(
        marketContext.data
          .changePercent
      ).toFixed(2)}%.`
    );
  }


  if (
    sectorComparison
      ?.sectorAverageChangePercent !=
    null
  ) {
    const classificationName =
      sectorComparison.classificationValue ||
      sectorComparison.sector ||
      "sector";

    parts.push(
      `The ${classificationName} peer average is ${
        sectorComparison
          .sectorAverageChangePercent >=
        0
          ? "up"
          : "down"
      } ${Math.abs(
        sectorComparison
          .sectorAverageChangePercent
      ).toFixed(2)}%.`
    );
  }


  if (topEvent) {
    const readableEvent =
      getReadableEventType(
        topEvent.type
      );

    parts.push(
      `A recent ${readableEvent} may also be relevant, but the available evidence does not prove that it caused today's move.`
    );
  }


  return parts.join(" ");
}


// =====================================================
// AI REASONING
// =====================================================

async function getAIReasoning({
  symbol,
  priceMovement,
  sectorComparison,
  marketContext,
  topEvent,
}) {
  try {
    const prompt = `
Analyze the recent movement of the Indian stock ${symbol}.

Stock movement:
${JSON.stringify(
  priceMovement,
  null,
  2
)}

Sector comparison:
${JSON.stringify(
  sectorComparison,
  null,
  2
)}

Market context:
${JSON.stringify(
  marketContext,
  null,
  2
)}

Most relevant recent company event:
${JSON.stringify(
  topEvent,
  null,
  2
)}

Explain:
1. How the stock is moving.
2. Whether the movement looks company-specific, sector-wide, or market-related.
3. Whether the recent company event could reasonably be relevant.
4. Do NOT claim that an event caused the stock movement unless the evidence proves it.
5. If the event is a regulatory action, penalty, legal action, or compliance issue, describe it as such and do NOT call it a contract.
6. Keep the explanation understandable for a normal investor.

Give a concise explanation.
`;

    const result =
      await askStockReasoning(
        prompt
      );

    if (
      typeof result ===
        "string" &&
      result.trim()
    ) {
      return result.trim();
    }

    return null;
  } catch (error) {
    console.error(
      "AI reasoning error:",
      error.message
    );

    return null;
  }
}


// =====================================================
// MAIN STOCK MOVEMENT INTELLIGENCE
// =====================================================

async function getStockIntelligence(
  symbol
) {
  const upperSymbol =
    symbol.toUpperCase();


  // ---------------------------------------------------
  // Market
  // ---------------------------------------------------

  const market =
    await getMarketData(
      upperSymbol
    );


  const priceMovement =
    calculatePriceMovement(
      market
    );


  const movementSummary =
    createMovementSummary(
      upperSymbol,
      priceMovement
    );


  // ---------------------------------------------------
  // Company news
  // ---------------------------------------------------

  let companyName = null;

  let news = [];

  try {
    news =
      await getCompanyNews(
        upperSymbol,
        null
      );

    if (
      news.length > 0 &&
      news[0].companyName
    ) {
      companyName =
        news[0].companyName;
    }
  } catch (error) {
    console.error(
      "Company news error:",
      error.message
    );
  }


  // ---------------------------------------------------
  // Classify news
  // ---------------------------------------------------

  const enrichedNews =
    news.map(enrichEvent);


  // ---------------------------------------------------
  // Sort news
  // ---------------------------------------------------

  const sortedNews =
    [...enrichedNews].sort(
      (a, b) => {
        const impactWeight = {
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };

        const impactDifference =
          (
            impactWeight[
              b.impact
            ] || 0
          ) -
          (
            impactWeight[
              a.impact
            ] || 0
          );

        if (
          impactDifference !== 0
        ) {
          return impactDifference;
        }

        return (
          (b.relevanceScore || 0) -
          (a.relevanceScore || 0)
        );
      }
    );


  const topEvent =
    sortedNews.length > 0
      ? sortedNews[0]
      : null;


  // ---------------------------------------------------
  // Sector comparison
  // ---------------------------------------------------

  let sectorComparison = null;

  try {
    const response =
      await fetch(
        `http://localhost:5001/api/sector/${upperSymbol}`
      );

    if (response.ok) {
      const data =
        await response.json();

      sectorComparison = {
        symbol:
          data.symbol,

        companyName:
          data.companyName ??
          companyName,

        macroSector:
          data.macroSector ??
          null,

        sector:
          data.sector ??
          null,

        industry:
          data.industry ??
          null,

        basicIndustry:
          data.basicIndustry ??
          null,

        classificationLevel:
          data.classificationLevel ??
          null,

        classificationValue:
          data.classificationValue ??
          null,

        targetChangePercent:
          data.targetChangePercent ??
          null,

        sectorAverageChangePercent:
          data.sectorAverageChangePercent ??
          null,

        differenceFromSector:
          data.differenceFromSector ??
          null,

        peers:
          data.peers ??
          [],

        comparison:
          data.comparison ??
          {
            classification:
              "INSUFFICIENT_DATA",

            difference:
              null,

            explanation:
              "Sector comparison data is unavailable.",
          },
      };
    }
  } catch (error) {
    console.error(
      "Sector comparison error:",
      error.message
    );
  }


  // ---------------------------------------------------
  // Market context
  // ---------------------------------------------------

  let marketContext = null;

  try {
    marketContext =
      await getMarketContext(
        priceMovement
          ?.changePercent ??
        null
      );
  } catch (error) {
    console.error(
      "Market context error:",
      error.message
    );
  }


  // ---------------------------------------------------
  // Cause assessment
  // ---------------------------------------------------

  const causeAssessment =
    createCauseAssessment({
      priceMovement,
      sectorComparison,
      marketContext,
      topEvent,
    });


  // ---------------------------------------------------
  // Fallback reasoning
  // ---------------------------------------------------

  let aiReasoning =
    createFallbackReasoning({
      symbol: upperSymbol,
      priceMovement,
      sectorComparison,
      marketContext,
      topEvent,
    });


  // ---------------------------------------------------
  // Try AI
  // ---------------------------------------------------

  const generatedAIReasoning =
    await getAIReasoning({
      symbol: upperSymbol,
      priceMovement,
      sectorComparison,
      marketContext,
      topEvent,
    });


  if (generatedAIReasoning) {
    aiReasoning =
      generatedAIReasoning;
  }


  // ---------------------------------------------------
  // FINAL RESPONSE
  // ---------------------------------------------------

  return {
    symbol: upperSymbol,

    market,

    priceMovement,

    movementSummary,

    sectorComparison,

    marketContext,

    aiReasoning,

    causeAssessment,

    topEvent,

    news: sortedNews,

    newsCount:
      sortedNews.length,
  };
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getStockIntelligence,
};
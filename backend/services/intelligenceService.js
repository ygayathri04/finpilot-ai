const { getCompanyNews } = require("./newsService");
const {
  getMarketContext,
} = require("./marketContextService");
async function getSectorComparison(symbol) {
  try {
    const response = await fetch(
      `http://localhost:5001/api/sector/${symbol}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(
      "Sector comparison error:",
      error.message
    );

    return null;
  }
}

function classifyEvent(newsItem) {
  const text =
    `${newsItem.title} ${newsItem.description}`.toLowerCase();

  if (
    text.includes("acquisition") ||
    text.includes("acquire") ||
    text.includes("acquired") ||
    text.includes("merger") ||
    text.includes("merges")
  ) {
    return "ACQUISITION";
  }

  if (
    text.includes("contract") ||
    text.includes("contracts") ||
    text.includes("order") ||
    text.includes("orders") ||
    text.includes("deal") ||
    text.includes("multi-year deal") ||
    text.includes("multimillion") ||
    text.includes("bagging")
  ) {
    return "CONTRACT_OR_ORDER";
  }

  if (
    text.includes("partnership") ||
    text.includes("partner") ||
    text.includes("partners") ||
    text.includes("join forces") ||
    text.includes("collaboration") ||
    text.includes("collaborate") ||
    text.includes("agreement") ||
    text.includes("alliance")
  ) {
    return "PARTNERSHIP";
  }

  if (
    text.includes("financial results") ||
    text.includes("financial result") ||
    text.includes("earnings") ||
    text.includes("quarterly results") ||
    text.includes("quarter results") ||
    text.includes("results for the period")
  ) {
    return "FINANCIAL_RESULTS";
  }

  if (
    text.includes("dividend") ||
    text.includes("dividends")
  ) {
    return "DIVIDEND";
  }

  if (
    text.includes("buyback") ||
    text.includes("buy-back") ||
    text.includes("buy back")
  ) {
    return "BUYBACK";
  }

  if (
    text.includes("appointment") ||
    text.includes("appointed") ||
    text.includes("resignation") ||
    text.includes("resigned") ||
    text.includes("chief executive") ||
    text.includes("managing director")
  ) {
    return "MANAGEMENT_CHANGE";
  }

  if (
    text.includes("regulatory") ||
    text.includes("regulator") ||
    text.includes("approval") ||
    text.includes("approved") ||
    text.includes("clearance")
  ) {
    return "REGULATORY";
  }

  if (
    text.includes("launch") ||
    text.includes("launched") ||
    text.includes("launches") ||
    text.includes("new product") ||
    text.includes("new platform") ||
    text.includes("platform") ||
    text.includes("business unit") ||
    text.includes("centre of excellence") ||
    text.includes("center of excellence") ||
    text.includes("solutions lab")
  ) {
    return "PRODUCT_OR_BUSINESS_LAUNCH";
  }

  return "OTHER";
}

function estimateImpact(eventType) {
  if (
    eventType === "ACQUISITION" ||
    eventType === "CONTRACT_OR_ORDER" ||
    eventType === "FINANCIAL_RESULTS"
  ) {
    return "HIGH";
  }

  if (
    eventType === "PARTNERSHIP" ||
    eventType === "BUYBACK" ||
    eventType === "DIVIDEND" ||
    eventType === "MANAGEMENT_CHANGE" ||
    eventType === "REGULATORY"
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function explainEvent(eventType) {
  const explanations = {
    ACQUISITION:
      "An acquisition can change the company's growth opportunities, capabilities, or costs.",

    CONTRACT_OR_ORDER:
      "A new contract or order may increase future revenue visibility and business activity.",

    PARTNERSHIP:
      "A partnership may provide access to new technology, customers, markets, or capabilities.",

    FINANCIAL_RESULTS:
      "Financial results show how the company's revenue, profit, and business performance are developing.",

    DIVIDEND:
      "A dividend returns part of the company's profits to shareholders.",

    BUYBACK:
      "A buyback means the company is purchasing its own shares, which can affect the share count and capital allocation.",

    MANAGEMENT_CHANGE:
      "A management change can affect the company's strategy and execution.",

    REGULATORY:
      "A regulatory development can affect the company's ability to operate, expand, or generate revenue.",

    PRODUCT_OR_BUSINESS_LAUNCH:
      "A new product or business initiative may create new growth opportunities.",

    OTHER:
      "This announcement may provide additional information about the company's business.",
  };

  return (
    explanations[eventType] ||
    explanations.OTHER
  );
}

function calculatePriceMovement(market) {
  if (
    !market ||
    market.price == null ||
    market.previousClose == null
  ) {
    return null;
  }

  const change =
    market.price - market.previousClose;

  const changePercent =
    (change / market.previousClose) * 100;

  return {
    currentPrice: market.price,
    previousClose: market.previousClose,
    change: Number(change.toFixed(2)),
    changePercent: Number(
      changePercent.toFixed(2)
    ),
    direction:
      change > 0
        ? "UP"
        : change < 0
          ? "DOWN"
          : "UNCHANGED",
  };
}

function calculateRelevance(
  eventType,
  publishedAt
) {
  const impactScore = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const impact = estimateImpact(eventType);
  const eventScore =
    impactScore[impact] || 1;

  const announcementDate =
    new Date(publishedAt);

  const now = new Date();

  const ageInDays =
    (now - announcementDate) /
    (1000 * 60 * 60 * 24);

  let recencyScore = 1;

  if (ageInDays <= 7) {
    recencyScore = 3;
  } else if (ageInDays <= 30) {
    recencyScore = 2;
  }

  return eventScore + recencyScore;
}

function calculateConfidence(
  eventType,
  relevanceScore
) {
  if (
    relevanceScore >= 5 &&
    (
      eventType === "ACQUISITION" ||
      eventType === "CONTRACT_OR_ORDER" ||
      eventType === "FINANCIAL_RESULTS"
    )
  ) {
    return "MEDIUM";
  }

  if (relevanceScore >= 4) {
    return "LOW";
  }

  return "LOW";
}

function createMovementSummary(
  priceMovement
) {
  if (!priceMovement) {
    return "Current stock movement data is unavailable.";
  }

  if (priceMovement.direction === "UP") {
    return `The stock is up ${Math.abs(
      priceMovement.changePercent
    )}% from its previous close.`;
  }

  if (priceMovement.direction === "DOWN") {
    return `The stock is down ${Math.abs(
      priceMovement.changePercent
    )}% from its previous close.`;
  }

  return "The stock is unchanged from its previous close.";
}

function createCauseAssessment(
  priceMovement,
  topEvent,
  sectorComparison,
  marketContext
) {
  const sectorClassification =
    sectorComparison?.comparison?.classification;

  const marketClassification =
    marketContext?.comparison?.classification;

  const hasCompanyEvent = Boolean(topEvent);

  if (
    sectorClassification === "SECTOR_WIDE" &&
    marketClassification === "MARKET_ALIGNED"
  ) {
    return "The stock is moving broadly in line with both its sector and the broader market. The movement may therefore be influenced mainly by overall market and sector conditions.";
  }

  if (
    sectorClassification === "COMPANY_SPECIFIC" &&
    marketClassification === "MARKET_DIVERGENCE"
  ) {
    if (hasCompanyEvent) {
      return "The stock is moving differently from both its sector and the broader market. A company-specific factor, such as the detected company event, may therefore be relevant to the movement. This does not prove that the event caused the price change.";
    }

    return "The stock is moving differently from both its sector and the broader market, suggesting that company-specific factors may be more important. However, the available data does not prove causation.";
  }

  if (
    sectorClassification === "SECTOR_WIDE" &&
    marketClassification === "MARKET_DIVERGENCE"
  ) {
    return "The stock is moving broadly with its sector but differently from the broader market. Sector-specific conditions may therefore be more relevant than the overall market direction.";
  }

  if (
    sectorClassification === "COMPANY_SPECIFIC" &&
    marketClassification === "MARKET_ALIGNED"
  ) {
    if (hasCompanyEvent) {
      return "The stock is moving differently from its sector while broadly following the overall market. Company-specific factors, including the detected company event, may be contributing to the movement, but causation is not proven.";
    }

    return "The stock is moving differently from its sector while broadly following the overall market. Company-specific factors may be contributing to the movement, but the available data does not prove causation.";
  }

  if (
    sectorClassification === "MIXED" ||
    marketClassification ===
    "MARKET_OUTPERFORMING_OR_UNDERPERFORMING"
  ) {
    return "The stock shows movement beyond either the sector or broader market benchmark. Both market conditions and company-specific factors may be relevant, but the available data does not establish a single cause.";
  }

  if (hasCompanyEvent) {
    return "A potentially relevant company event has been detected, but the available market and sector comparisons do not provide enough evidence to determine whether it caused the stock movement.";
  }

  return "The available market and sector data do not provide enough evidence to determine a clear cause for the stock movement.";
}

async function getStockIntelligence(
  symbol
) {
  try {
    const upperSymbol =
      symbol.toUpperCase();

    const news =
      await getCompanyNews(
        upperSymbol
      );

    const marketResponse =
      await fetch(
        `http://localhost:5001/api/market/${upperSymbol}`
      );

    let market = null;

    if (marketResponse.ok) {
      market =
        await marketResponse.json();
    }

    const sectorComparison =
      await getSectorComparison(
        upperSymbol
      );

    const priceMovement =
      calculatePriceMovement(
        market
      );

    const marketContext =
      await getMarketContext(
        priceMovement?.changePercent
      );

    const intelligence = news
      .map((item) => {
        const eventType =
          classifyEvent(item);

        const impact =
          estimateImpact(eventType);

        const relevanceScore =
          calculateRelevance(
            eventType,
            item.publishedAt
          );

        const confidence =
          calculateConfidence(
            eventType,
            relevanceScore
          );

        return {
          ...item,
          eventType,
          impact,
          relevanceScore,
          confidence,
          investorExplanation:
            explainEvent(
              eventType
            ),
        };
      })
      .sort(
        (a, b) =>
          b.relevanceScore -
          a.relevanceScore
      );

    const topEvent =
      intelligence.length > 0
        ? intelligence[0]
        : null;

    return {
      symbol: upperSymbol,

      market,

      priceMovement,

      movementSummary:
        createMovementSummary(
          priceMovement
        ),

      sectorComparison,
      marketContext,

      causeAssessment:
        createCauseAssessment(
          priceMovement,
          topEvent,
          sectorComparison,
          marketContext
        ),

      topEvent,

      news: intelligence,

      newsCount:
        intelligence.length,
    };
  } catch (error) {
    console.error(
      "Stock intelligence error:",
      error.message
    );

    return {
      symbol:
        symbol.toUpperCase(),

      market: null,

      priceMovement: null,

      movementSummary:
        "Current stock movement data is unavailable.",

      sectorComparison: null,

      causeAssessment:
        "Unable to assess the stock movement.",

      topEvent: null,

      news: [],

      newsCount: 0,
    };
  }
}

module.exports = {
  getStockIntelligence,
};
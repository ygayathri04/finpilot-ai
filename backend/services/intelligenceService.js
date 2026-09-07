const { getCompanyNews } = require("./newsService");
const { analyzeNews } = require("../agents/newsAgent");
const { analyzeMarket } = require("../agents/marketAgent");
const { analyzeCompany } = require("../agents/companyAgent");
const { analyzeReasoning } = require("../agents/reasoningAgent");
const { askStockReasoning } = require("../ai");
const { getMarketContext } = require("./marketContextService");

// =====================================================
// GET LIVE MARKET DATA
// =====================================================

function getEventArticle(eventName = "") {
  const word = String(eventName || "").trim();

  if (/^[aeiou]/i.test(word)) {
    return "An";
  }

  return "A";
}

async function getMarketData(symbol) {
  const response = await fetch(
    `http://localhost:5001/api/market/${symbol}`
  );

  if (!response.ok) {
    throw new Error(`Market data unavailable for ${symbol}`);
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

  const change = Number(
    (market.price - market.previousClose).toFixed(2)
  );

  const changePercent = Number(
    (
      ((market.price - market.previousClose) /
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

function createMovementSummary(symbol, priceMovement) {
  if (!priceMovement) {
    return `${symbol} market movement data is currently unavailable.`;
  }

  if (priceMovement.direction === "UNCHANGED") {
    return `${symbol} is unchanged from the previous close.`;
  }

  const movement =
    priceMovement.direction === "UP" ? "up" : "down";

  return `${symbol} is ${movement} ${Math.abs(
    priceMovement.changePercent
  ).toFixed(2)}% from the previous close.`;
}

// =====================================================
// READABLE EVENT TYPE
// =====================================================

function getReadableEventType(type) {
  const labels = {
    ACQUISITION: "acquisition",
    CONTRACT: "contract",
    PARTNERSHIP: "partnership",
    EARNINGS: "earnings",
    CORPORATE_ACTION: "corporate action",
    MANAGEMENT: "management update",
    MANAGEMENT_CHANGE: "management update",
    REGULATORY_ACTION: "regulatory action",
    REGULATORY_DISCLOSURE: "regulatory disclosure",
    COMPANY_UPDATE: "company update",
    SHAREHOLDER_EVENT: "shareholder event",
    OTHER: "company update",
  };

  return labels[type] || "company update";
}

// =====================================================
// READABLE EVENT TITLE
// =====================================================

function getReadableEventTitle(event = {}) {
  const type = String(
    event.type ||
      event.eventType ||
      ""
  ).toUpperCase();

  const title = String(
    event.title || ""
  ).trim();

  const typeTitles = {
    INVESTOR_MEETING: "Investor / analyst meeting",
    ACQUISITION: "Acquisition update",
    CONTRACT: "Contract / order update",
    PARTNERSHIP: "Partnership update",
    MANAGEMENT_CHANGE: "Management change",
    EARNINGS: "Earnings / financial results",
    REGULATORY_ACTION: "Regulatory action",
    REGULATORY_DISCLOSURE: "Regulatory disclosure",
    SHAREHOLDER_EVENT: "Shareholder event",
    BUSINESS_UPDATE: "Business update",
  };

  if (typeTitles[type]) {
    return typeTitles[type];
  }

  const genericTitles = new Set([
    "",
    "GENERAL UPDATES",
    "GENERAL UPDATE",
    "UPDATES",
    "UPDATE",
    "OTHER",
  ]);

  if (!genericTitles.has(title.toUpperCase())) {
    return title;
  }

  const labels = {
    ACQUISITION: "Acquisition update",
    CONTRACT: "Contract / order update",
    PARTNERSHIP: "Partnership update",
    EARNINGS: "Financial results",
    CORPORATE_ACTION: "Corporate action",
    MANAGEMENT: "Management update",
    MANAGEMENT_CHANGE: "Management update",
    REGULATORY_ACTION: "Regulatory / legal update",
    REGULATORY_DISCLOSURE: "Regulatory disclosure",
    SHAREHOLDER_EVENT: "Shareholder event",
    COMPANY_UPDATE: "Company business update",
    OTHER: "Company announcement",
  };

  return labels[type] || "Company announcement";
}

// =====================================================
// FALLBACK INVESTOR EXPLANATION
// =====================================================

function createInvestorExplanation(type) {
  const explanations = {
    ACQUISITION:
      "The acquisition could affect future growth, capabilities, or competitive position.",

    CONTRACT:
      "The contract could support future revenue and business demand.",

    PARTNERSHIP:
      "The partnership could create new customers, technology access, or business opportunities.",

    EARNINGS:
      "The results provide information about the company's recent financial performance.",

    CORPORATE_ACTION:
      "The corporate action may affect shareholder returns or trading activity.",

    MANAGEMENT:
      "The management change may affect expectations around strategy and execution.",

    MANAGEMENT_CHANGE:
      "The management change may affect expectations around strategy and execution.",

    REGULATORY_ACTION:
      "The regulatory action may create financial, compliance, or operational risk.",

    REGULATORY_DISCLOSURE:
      "The filing is a regulatory or compliance disclosure. Its financial significance depends on the specific information disclosed.",

    COMPANY_UPDATE:
      "The announcement provides additional context about the company's business.",

    SHAREHOLDER_EVENT:
      "The shareholder event provides information about ownership or corporate governance.",

    OTHER:
      "The announcement provides additional company-specific information.",
  };

  return (
    explanations[type] ||
    explanations.COMPANY_UPDATE
  );
}

// =====================================================
// CREATE EVENT KEY
// =====================================================

function createEventKey(event) {
  return [
    event.attachment || "",
    event.title || "",
    event.publishedAt || "",
  ].join("|");
}

// =====================================================
// ENRICH EVENT
// =====================================================

function enrichEvent(event, analyzedEvent = null) {
  const cleanEvent = {
    ...event,
    description:
      event.originalDescription ||
      event.description ||
      "",
  };

  delete cleanEvent.attachmentText;
  delete cleanEvent.originalDescription;

  const eventType =
    analyzedEvent?.type ||
    event.type ||
    "COMPANY_UPDATE";

  return {
    ...cleanEvent,

    type: eventType,

    eventType:
      analyzedEvent?.eventType ||
      analyzedEvent?.type ||
      event.eventType ||
      event.type ||
      "COMPANY_UPDATE",

    impact:
      getDynamicEventImpact(
        analyzedEvent || event
      ),

    confidence:
      analyzedEvent?.confidence ||
      event.confidence ||
      "MEDIUM",

    relevanceScore:
      analyzedEvent?.relevanceScore ??
      event.relevanceScore ??
      0,

    displayTitle:
      analyzedEvent?.displayTitle ||
      event.displayTitle ||
      getReadableEventTitle({
        ...event,
        ...analyzedEvent,
        type: eventType,
      }),

    investorExplanation:
      analyzedEvent?.investorExplanation ||
      event.investorExplanation ||
      createInvestorExplanation(eventType),
  };
}

// =====================================================
// DYNAMIC EVENT IMPACT
// =====================================================

function getDynamicEventImpact(event = {}) {
  const type = String(
    event.type ||
      event.eventType ||
      ""
  ).toUpperCase();

  const score = Number(
    event.relevanceScore || 0
  );

  // Relevance and impact are different.
  // Relevance = usefulness as evidence.
  // Impact = significance of the event itself.

  if (
    type === "REGULATORY_DISCLOSURE" ||
    type === "SHAREHOLDER_EVENT" ||
    type === "OTHER"
  ) {
    return "LOW";
  }

  if (type === "EARNINGS") {
    if (event.quality === "ACTUAL_RESULTS") {
      return "HIGH";
    }

    if (
      event.quality === "TRANSCRIPT" ||
      event.quality === "AUDIO"
    ) {
      return "MEDIUM";
    }

    return "LOW";
  }

  if (type === "REGULATORY_ACTION") {
    return score >= 80 ? "HIGH" : "MEDIUM";
  }

  if (type === "ACQUISITION") {
    if (
      score >= 85 &&
      isEventVeryRecent(event)
    ) {
      return "HIGH";
    }

    if (score >= 50) {
      return "MEDIUM";
    }

    return "LOW";
  }

  if (type === "CONTRACT") {
    if (
      score >= 85 &&
      isEventVeryRecent(event)
    ) {
      return "HIGH";
    }

    if (score >= 50) {
      return "MEDIUM";
    }

    return "LOW";
  }

  if (
    type === "PARTNERSHIP" ||
    type === "MANAGEMENT_CHANGE" ||
    type === "CORPORATE_ACTION"
  ) {
    return score >= 60 ? "MEDIUM" : "LOW";
  }

  return score >= 60 ? "MEDIUM" : "LOW";
}

function isEventVeryRecent(event = {}) {
  const value =
    event.publishedAt ||
    event.date ||
    event.timestamp ||
    event.announcementDate ||
    "";

  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const ageDays =
    Math.max(
      0,
      Date.now() - date.getTime()
    ) / 86400000;

  return ageDays <= 7;
}

// =====================================================
// CAUSE ASSESSMENT
// =====================================================

function isEventFreshForMovement(event) {
  if (!event) return false;

  const value =
    event.publishedAt ||
    event.date ||
    "";

  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const ageDays =
    Math.max(
      0,
      Date.now() - date.getTime()
    ) / 86400000;

  return ageDays <= 45;
}

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

  if (
    topEvent &&
    topEvent.impact === "HIGH" &&
    isEventFreshForMovement(topEvent)
  ) {
    const readableEvent =
      topEvent.displayTitle ||
      getReadableEventTitle(topEvent);

    reasons.push(
      `A recent ${readableEvent} may be relevant, but the evidence does not prove it caused today's move.`
    );
  }

  if (
    sectorComparison?.comparison?.classification ===
    "SECTOR_WIDE"
  ) {
    reasons.push(
      "The stock is moving broadly with its sector."
    );
  }

  if (
    marketContext?.comparison?.classification ===
    "MARKET_ALIGNED"
  ) {
    reasons.push(
      "The stock is also moving broadly with the wider market."
    );
  }

  if (
    sectorComparison?.comparison?.classification ===
    "COMPANY_SPECIFIC"
  ) {
    reasons.push(
      "The stock is moving differently from its sector peers, suggesting company-specific factors may be contributing."
    );
  }

  if (
    marketContext?.comparison?.classification ===
    "MARKET_DIVERGENCE"
  ) {
    reasons.push(
      "The stock is moving differently from the broader market, making company or sector factors more relevant."
    );
  }

  if (reasons.length === 0) {
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
      priceMovement.direction === "UP"
        ? "up"
        : priceMovement.direction === "DOWN"
          ? "down"
          : "unchanged"
    } ${Math.abs(
      priceMovement.changePercent
    ).toFixed(2)}%.`
  );

  if (
    marketContext?.data?.changePercent != null
  ) {
    parts.push(
      `The NIFTY 50 is ${
        marketContext.data.changePercent >= 0
          ? "up"
          : "down"
      } ${Math.abs(
        marketContext.data.changePercent
      ).toFixed(2)}%.`
    );
  }

  if (
    sectorComparison?.sectorAverageChangePercent !=
    null
  ) {
    const classificationName =
      sectorComparison.classificationValue ||
      sectorComparison.sector ||
      "sector";

    parts.push(
      `The ${classificationName} peer average is ${
        sectorComparison.sectorAverageChangePercent >=
        0
          ? "up"
          : "down"
      } ${Math.abs(
        sectorComparison.sectorAverageChangePercent
      ).toFixed(2)}%.`
    );
  }

  // Do not call older events "recent".
  // They are useful background evidence only.

    if (topEvent) {
    const readableEvent =
      topEvent.displayTitle ||
      getReadableEventTitle(topEvent);

    const eventDate = new Date(
      topEvent.publishedAt ||
        topEvent.date ||
        topEvent.timestamp ||
        0
    );

    const ageDays =
      Number.isFinite(eventDate.getTime())
        ? Math.max(
            0,
            Math.floor(
              (Date.now() -
                eventDate.getTime()) /
                86400000
            )
          )
        : null;

    if (
      ageDays !== null &&
      ageDays <= 7
    ) {
      parts.push(
        `A recent ${readableEvent} may be relevant, but there is not enough evidence to say it caused today's move.`
      );
    } else if (
      ageDays !== null &&
      ageDays <= 30
    ) {
      parts.push(
        `${getEventArticle(readableEvent)} ${readableEvent} announced ${ageDays} days ago is relevant background evidence, but there is not enough evidence to link it to today's move.`
      );
    }
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
  newsAnalysis,
  marketAnalysis,
  companyAnalysis,
  reasoningAnalysis,
}) {
  try {
    const prompt = `
You are the optional explanation layer for FinPilot,
a Stock Movement Intelligence system.

The local FinPilot agents have already analyzed the evidence.

Your job is only to turn that evidence into ONE short,
clear explanation for a normal investor.

Stock:
${symbol}

NEWS AGENT:
${JSON.stringify(newsAnalysis, null, 2)}

MARKET AGENT:
${JSON.stringify(marketAnalysis, null, 2)}

COMPANY AGENT:
${JSON.stringify(companyAnalysis, null, 2)}

REASONING AGENT:
${JSON.stringify(reasoningAnalysis, null, 2)}

STOCK MOVEMENT:
${JSON.stringify(priceMovement, null, 2)}

SECTOR:
${JSON.stringify(sectorComparison, null, 2)}

MARKET CONTEXT:
${JSON.stringify(marketContext, null, 2)}

TOP EVENT:
${JSON.stringify(topEvent, null, 2)}

RULES:
1. Use only the evidence provided.
2. Do not invent facts.
3. Do not give buy or sell recommendations.
4. Do not claim causation unless proven.
5. Keep company-specific, market-wide, and sector-wide factors separate.
6. Keep the answer SHORT.
7. Maximum 2-3 sentences.
8. Use simple investor-friendly language.
9. Do not call an event "recent" if it is more than 7 days old.
10. Return only the explanation.
`;

    const result = await askStockReasoning(prompt);

    if (
      typeof result === "string" &&
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
// OVERALL CONFIDENCE
// =====================================================

function calculateOverallConfidence({
  priceMovement,
  marketContext,
  sectorComparison,
  topEvent,
}) {
  if (!priceMovement) {
    return "LOW";
  }

  const stockChange =
    Number(priceMovement.changePercent);

  const marketChange =
    Number(
      marketContext?.data?.changePercent
    );

  const marketDifference =
    Number.isFinite(stockChange) &&
    Number.isFinite(marketChange)
      ? Math.abs(
          stockChange - marketChange
        )
      : 0;

  const peerAverage =
    sectorComparison?.sectorAverageChangePercent;

  const peerDifference =
    peerAverage != null &&
    Number.isFinite(Number(peerAverage))
      ? Math.abs(
          stockChange -
            Number(peerAverage)
        )
      : 0;

  const freshEvent =
    topEvent &&
    isEventFreshForMovement(topEvent);

  const highImpactFreshEvent =
    freshEvent &&
    topEvent.impact === "HIGH";

  // HIGH requires a strong recent event
  // plus meaningful market/peer divergence.

  if (
    highImpactFreshEvent &&
    (
      marketDifference >= 2 ||
      peerDifference >= 2
    )
  ) {
    return "HIGH";
  }

  // MEDIUM means there is meaningful evidence,
  // but causation remains uncertain.

  if (
    highImpactFreshEvent ||
    peerDifference >= 0.75 ||
    marketDifference >= 0.75
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

// =====================================================
// MAIN STOCK MOVEMENT INTELLIGENCE
// =====================================================

async function getStockIntelligence(symbol) {
  const upperSymbol = symbol.toUpperCase();

  // ---------------------------------------------------
  // Market
  // ---------------------------------------------------

  const market = await getMarketData(
    upperSymbol
  );

  const priceMovement =
    calculatePriceMovement(market);

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
    news = await getCompanyNews(
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
  // News Agent
  // ---------------------------------------------------

  const newsAnalysis =
    await analyzeNews(news);

  const analyzedEvents =
    newsAnalysis.events || [];

  const analyzedEventMap = new Map(
    analyzedEvents.map((analyzedEvent) => [
      createEventKey(analyzedEvent),
      analyzedEvent,
    ])
  );

  const enrichedNews = news.map(
    (event) =>
      enrichEvent(
        event,
        analyzedEventMap.get(
          createEventKey(event)
        ) || null
      )
  );

  // ---------------------------------------------------
  // Sort news
  // ---------------------------------------------------

  const sortedNews =
    [...enrichedNews].sort(
      (a, b) => {
        const dateA =
          new Date(
            a.publishedAt ||
              a.date ||
              a.timestamp ||
              0
          ).getTime();

        const dateB =
          new Date(
            b.publishedAt ||
              b.date ||
              b.timestamp ||
              0
          ).getTime();

        const validA =
          Number.isFinite(dateA);

        const validB =
          Number.isFinite(dateB);

        if (
          validA &&
          validB &&
          dateA !== dateB
        ) {
          return dateB - dateA;
        }

        if (validB !== validA) {
          return validB ? 1 : -1;
        }

        return (
          (Number(b.relevanceScore) || 0) -
          (Number(a.relevanceScore) || 0)
        );
      }
    );

  // ---------------------------------------------------
  // TOP EVENT
  // ---------------------------------------------------

  let topEvent = null;

  if (newsAnalysis.topEvent) {
    const matchingEvent =
      enrichedNews.find(
        (event) =>
          event.attachment ===
            newsAnalysis.topEvent
              .attachment &&
          event.title ===
            newsAnalysis.topEvent
              .title &&
          event.publishedAt ===
            newsAnalysis.topEvent
              .publishedAt
      );

    topEvent =
      matchingEvent ||
      newsAnalysis.topEvent;
  } else if (
    sortedNews.length > 0
  ) {
    topEvent = sortedNews[0];
  }

  // ---------------------------------------------------
  // Sector comparison
  // ---------------------------------------------------

  let sectorComparison = null;

  try {
    const response = await fetch(
      `http://localhost:5001/api/sector/${upperSymbol}`
    );

    if (response.ok) {
      const data =
        await response.json();

      sectorComparison = {
        symbol: data.symbol,

        companyName:
          data.companyName ??
          companyName,

        macroSector:
          data.macroSector ?? null,

        sector:
          data.sector ?? null,

        industry:
          data.industry ?? null,

        basicIndustry:
          data.basicIndustry ?? null,

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
          data.sectorAverageChangePercent == null ||
          Number(data.sectorAverageChangePercent) === 0 &&
            (!Array.isArray(data.peers) ||
              data.peers.length === 0)
            ? null
            : Number(data.sectorAverageChangePercent),

        differenceFromSector:
          data.differenceFromSector == null ||
          Number(data.differenceFromSector) === 0 &&
            (!Array.isArray(data.peers) ||
              data.peers.length === 0)
            ? null
            : Number(data.differenceFromSector),

        peers:
          Array.isArray(data.peers)
            ? data.peers
            : [],

        comparison:
          data.comparison ?? {
            classification:
              "INSUFFICIENT_DATA",

            difference: null,

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
        priceMovement?.changePercent ??
          null
      );
  } catch (error) {
    console.error(
      "Market context error:",
      error.message
    );
  }

  // ---------------------------------------------------
  // Agents
  // ---------------------------------------------------

  const marketAnalysis =
    await analyzeMarket(
      priceMovement,
      marketContext?.data
    );

  const companyAnalysis =
    await analyzeCompany(
      priceMovement,
      sectorComparison
    );

  const reasoningAnalysis =
    await analyzeReasoning({
      symbol: upperSymbol,
      stockMovement: priceMovement,
      newsAnalysis,
      marketAnalysis,
      companyAnalysis,
    });

  // ---------------------------------------------------
  // Normalize top-event impact
  // ---------------------------------------------------

  if (topEvent) {
    topEvent = {
      ...topEvent,

      displayTitle:
        topEvent.displayTitle ||
        getReadableEventTitle(
          topEvent
        ),

      impact:
        getDynamicEventImpact(
          topEvent
        ),

      confidence:
        topEvent.impact === "HIGH" &&
        isEventFreshForMovement(
          topEvent
        )
          ? "HIGH"
          : topEvent.impact ===
                "MEDIUM" &&
            isEventFreshForMovement(
              topEvent
            )
            ? "MEDIUM"
            : "LOW",
    };
  }

  // ---------------------------------------------------
  // Overall confidence
  // ---------------------------------------------------

  const overallConfidence =
    calculateOverallConfidence({
      priceMovement,
      sectorComparison,
      marketContext,
      topEvent,
    });

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
  // Reasoning
  // ---------------------------------------------------

  let aiReasoning =
    reasoningAnalysis.overallAssessment ||
    createFallbackReasoning({
      symbol: upperSymbol,
      priceMovement,
      sectorComparison,
      marketContext,
      topEvent,
    });

  // ---------------------------------------------------
  // Optional LLM
  // ---------------------------------------------------

  const enableOptionalLLM =
    process.env
      .FINPILOT_ENABLE_OPTIONAL_LLM ===
    "true";

  if (enableOptionalLLM) {
    const generatedAIReasoning =
      await getAIReasoning({
        symbol: upperSymbol,
        priceMovement,
        sectorComparison,
        marketContext,
        topEvent,
        newsAnalysis,
        marketAnalysis,
        companyAnalysis,
        reasoningAnalysis,
      });

    if (generatedAIReasoning) {
      aiReasoning =
        generatedAIReasoning;
    }
  }

  // ---------------------------------------------------
  // FINAL RESPONSE
  // ---------------------------------------------------

  return {
    symbol: upperSymbol,

    market,

    priceMovement,

    movementSummary,

    confidence:
      overallConfidence,

    sectorComparison,

    marketContext,

    marketAnalysis,

    companyAnalysis,

    reasoningAnalysis,

    aiReasoning,

    causeAssessment,

    topEvent,

    news: sortedNews,

    newsAnalysis,

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
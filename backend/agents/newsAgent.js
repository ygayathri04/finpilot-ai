/*
=====================================================
NEWS AGENT
=====================================================

Job:
- Understand recent company announcements.
- Classify what actually happened.
- Identify potentially important events.
- Rank events using event type + recency.
- Never invent information.
- Never claim that an event caused a stock movement.

The News Agent does NOT decide why the stock moved.
That job belongs to the Reasoning Agent.
=====================================================
*/


/*
=====================================================
MAIN NEWS ANALYSIS
=====================================================
*/

async function analyzeNews(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      eventCount: 0,
      events: [],
      topEvent: null,
      summary:
        "No recent company announcements were available.",
    };
  }

  const analyzedEvents = events.map((event) => {
    const type = classifyEvent(event);

    const relevanceScore =
      calculateRelevanceScore(event, type);

    return {
      title:
        event.title ||
        "Untitled announcement",

      date:
        event.date ||
        event.timestamp ||
        event.announcementDate ||
        event.publishedAt ||
        null,

      publishedAt:
        event.publishedAt ||
        event.date ||
        event.timestamp ||
        event.announcementDate ||
        null,

      type,

      readableType:
        getReadableEventType(type),

      impact:
        getEventImpact(type),

      confidence:
        calculateConfidence(event, type),

      relevanceScore,

      source:
        event.source ||
        event.url ||
        event.link ||
        event.attachment ||
        null,

      attachment:
        event.attachment ||
        null,

      explanation:
        createNewsExplanation(type),
    };
  });

  const topEvent =
    selectTopEvent(analyzedEvents);

  return {
    eventCount:
      analyzedEvents.length,

    events:
      analyzedEvents,

    topEvent,

    summary:
      createNewsSummary(
        topEvent,
        analyzedEvents
      ),
  };
}


/*
=====================================================
TEXT HELPERS
=====================================================

IMPORTANT:

newsService.js keeps the original NSE description in:

event.originalDescription

and may append the extracted PDF text into:

event.description

Therefore classification MUST prefer
originalDescription.

Otherwise PDF content can accidentally make:

- collaborations look like acquisitions
- disclosures look like acquisitions
- financial filings look like regulatory actions
etc.
=====================================================
*/

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}


function getPrimaryEventText(event = {}) {
  return [
    event.title,

    event.subject,

    event.originalDescription ||
      event.description,

    event.category,

    event.announcementType,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");
}


function getEventText(event = {}) {
  return getPrimaryEventText(event);
}


/*
=====================================================
EVENT CLASSIFICATION
=====================================================
*/

function classifyEvent(event = {}) {
  const text =
    getPrimaryEventText(event);

  /*
  =====================================================
  SHAREHOLDER EVENTS
  =====================================================

  These must be checked first because shareholder
  filings can contain SEBI/regulatory language.
  */

  if (
    text.includes("voting results") ||
    text.includes("voting result") ||
    text.includes("postal ballot") ||
    text.includes("e-voting") ||
    text.includes("evoting") ||
    text.includes("remote e-voting") ||
    text.includes("scrutiniser's report") ||
    text.includes("scrutinizer's report") ||
    text.includes("scrutiniser report") ||
    text.includes("scrutinizer report") ||
    text.includes("shareholders meeting") ||
    text.includes("shareholder meeting") ||
    text.includes("general meeting") ||
    text.includes("annual general meeting") ||
    text.includes("extraordinary general meeting") ||
    text.includes("egm") ||
    text.includes("agm") ||
    text.includes("members of the company") ||
    text.includes("approval of the members") ||
    text.includes("approval of shareholders")
  ) {
    return "SHAREHOLDER_EVENT";
  }


  /*
  =====================================================
  EARNINGS / FINANCIAL RESULTS
  =====================================================
  */

  if (
    text.includes("financial results") ||
    text.includes("quarterly results") ||
    text.includes("unaudited financial results") ||
    text.includes("audited financial results") ||
    text.includes("consolidated financial results") ||
    text.includes("standalone financial results") ||
    text.includes("earnings") ||
    text.includes("earnings release") ||
    text.includes("earnings call") ||
    text.includes("analyst meet") ||
    text.includes("profit after tax") ||
    text.includes("net profit") ||
    text.includes("revenue from operations") ||
    text.includes("financial performance")
  ) {
    return "EARNINGS";
  }


  /*
  =====================================================
  REGULATION 31(4) / OWNERSHIP DISCLOSURE
  =====================================================

  This is NOT an acquisition.

  Regulation 31(4) disclosures are ownership /
  promoter-related regulatory disclosures.

  They should not be promoted to a high-impact
  acquisition merely because extracted filing text
  contains acquisition-related legal terminology.
  */

  if (
    text.includes("regulation 31(4)") ||
    text.includes("regulation 31 (4)") ||
    text.includes("regulation 31(4) of sebi") ||
    text.includes("regulation 31 (4) of sebi") ||
    text.includes("takeovers regulations, 2011") ||
    text.includes("takeovers regulations 2011") ||
    text.includes("substantial acquisition of shares")
  ) {
    return "REGULATORY_DISCLOSURE";
  }


  /*
  =====================================================
  REGULATORY / LEGAL ACTION
  =====================================================
  */

  if (
    text.includes("penalty") ||
    text.includes("penal") ||
    text.includes("regulatory action") ||
    text.includes("regulatory order") ||
    text.includes("regulatory notice") ||
    text.includes("show cause notice") ||
    text.includes("notice from") ||
    text.includes("order passed") ||
    text.includes("orders passed") ||
    text.includes("action(s) initiated") ||
    text.includes("legal action") ||
    text.includes("legal proceedings") ||
    text.includes("court proceedings") ||
    text.includes("proceedings initiated") ||
    text.includes("violation") ||
    text.includes("non-compliance") ||
    text.includes("rbi penalty") ||
    text.includes("rbi order") ||
    text.includes("sebi order") ||
    text.includes("sebi penalty")
  ) {
    return "REGULATORY_ACTION";
  }


  /*
  =====================================================
  CONTRACT / ORDER
  =====================================================
  */

  if (
    text.includes("contract awarded") ||
    text.includes("contract win") ||
    text.includes("contract wins") ||
    text.includes("order win") ||
    text.includes("order wins") ||
    text.includes("received an order") ||
    text.includes("purchase order") ||
    text.includes("work order") ||
    text.includes("bagging") ||
    text.includes("bagged") ||
    text.includes("contract")
  ) {
    return "CONTRACT";
  }


  /*
  =====================================================
  ACQUISITION
  =====================================================
  */

  if (
    text.includes("acquisition") ||
    text.includes("acquires") ||
    text.includes("acquired") ||
    text.includes("acquiring")
  ) {
    return "ACQUISITION";
  }


  /*
  =====================================================
  PARTNERSHIP
  =====================================================
  */

  if (
    text.includes("partnership") ||
    text.includes("strategic alliance") ||
    text.includes("collaboration") ||
    text.includes("joint venture") ||
    text.includes("strategic collaboration")
  ) {
    return "PARTNERSHIP";
  }


  /*
  =====================================================
  MANAGEMENT CHANGE
  =====================================================
  */

  if (
    text.includes("appointed") ||
    text.includes("resigned") ||
    text.includes("resignation") ||
    text.includes("management change") ||
    text.includes("chief executive officer") ||
    text.includes("managing director")
  ) {
    return "MANAGEMENT_CHANGE";
  }
/*
  =====================================================
  BUSINESS UPDATE
  =====================================================
  */

  if (
    text.includes("business update") ||
    text.includes("product launch") ||
    text.includes("new product") ||
    text.includes("expansion") ||
    text.includes("capacity expansion") ||
    text.includes("commercial operations") ||
    text.includes("selects") ||
    text.includes("selected") ||
    text.includes("adopts") ||
    text.includes("launches")
  ) {
    return "BUSINESS_UPDATE";
  }


  return "OTHER";
}


/*
=====================================================
READABLE EVENT TYPE
=====================================================
*/

function getReadableEventType(type) {
  const labels = {
    REGULATORY_ACTION:
      "regulatory or legal action",

    REGULATORY_DISCLOSURE:
      "regulatory disclosure",

    SHAREHOLDER_EVENT:
      "shareholder event",

    CONTRACT:
      "contract or order",

    EARNINGS:
      "earnings / financial results",

    ACQUISITION:
      "acquisition",

    PARTNERSHIP:
      "partnership",

    MANAGEMENT_CHANGE:
      "management change",

    BUSINESS_UPDATE:
      "business update",

    OTHER:
      "other company announcement",
  };

  return (
    labels[type] ||
    "other company announcement"
  );
}


/*
=====================================================
EVENT IMPACT
=====================================================
*/

function getEventImpact(type) {
  switch (type) {
    case "REGULATORY_ACTION":
      return "HIGH";

    case "ACQUISITION":
      return "HIGH";

    case "CONTRACT":
      return "HIGH";

    case "EARNINGS":
      return "HIGH";

    case "MANAGEMENT_CHANGE":
      return "MEDIUM";

    case "PARTNERSHIP":
      return "MEDIUM";

    case "BUSINESS_UPDATE":
      return "MEDIUM";

    case "REGULATORY_DISCLOSURE":
      return "LOW";

    case "SHAREHOLDER_EVENT":
      return "LOW";

    default:
      return "LOW";
  }
}


/*
=====================================================
NEWS EXPLANATION
=====================================================
*/

function createNewsExplanation(type) {
  switch (type) {
    case "REGULATORY_ACTION":
      return (
        "A regulatory or legal action can create financial, " +
        "compliance, reputational, or operational risks for the company."
      );


    case "REGULATORY_DISCLOSURE":
      return (
        "A regulatory disclosure provides information about " +
        "ownership, compliance, or reporting requirements, " +
        "but does not by itself indicate a major business event."
      );


    case "SHAREHOLDER_EVENT":
      return (
        "The shareholder event provides information about " +
        "ownership, voting, or corporate governance."
      );


    case "CONTRACT":
      return (
        "A contract or order win may indicate potential future " +
        "business activity or revenue, although the announcement " +
        "does not guarantee future financial performance."
      );


    case "EARNINGS":
      return (
        "An earnings announcement provides information about " +
        "the company's recent financial performance."
      );


    case "ACQUISITION":
      return (
        "An acquisition can affect the company's growth strategy, " +
        "assets, costs, or future business operations."
      );


    case "PARTNERSHIP":
      return (
        "A partnership may create new business opportunities, " +
        "but its financial impact depends on how the partnership develops."
      );


    case "MANAGEMENT_CHANGE":
      return (
        "A management change can matter because leadership decisions " +
        "may affect the company's strategy and operations."
      );


    case "BUSINESS_UPDATE":
      return (
        "A business update provides information about the company's " +
        "operations, products, or business activity."
      );


    default:
      return (
        "This announcement provides company-related information, " +
        "but its financial significance may require additional evidence."
      );
  }
}


/*
=====================================================
RELEVANCE SCORE
=====================================================

The score is NOT a probability that the event caused
the stock movement.

It only answers:

"How useful is this event as evidence when looking
at recent stock movement?"

The score combines:

1. Event importance
2. Event recency
3. Description quality

RECENCY IS INTENTIONALLY STRONG.

This prevents an old earnings filing from automatically
beating a much more recent regulatory action.
=====================================================
*/

function calculateRelevanceScore(event = {}, type) {
  let score = 0;


  /*
  =====================================================
  BASE EVENT IMPORTANCE
  =====================================================
  */

  const baseScores = {
    REGULATORY_ACTION: 70,

    ACQUISITION: 65,

    CONTRACT: 60,

    EARNINGS: 55,

    MANAGEMENT_CHANGE: 50,

    PARTNERSHIP: 45,

    BUSINESS_UPDATE: 40,

    SHAREHOLDER_EVENT: 20,

    REGULATORY_DISCLOSURE: 15,

    OTHER: 10,
  };

  score +=
    baseScores[type] !== undefined
      ? baseScores[type]
      : 10;


  /*
  =====================================================
  RECENCY
  =====================================================

  Recent events receive a large bonus.

  0-2 days   = +40
  3-7 days   = +35
  8-14 days  = +28
  15-30 days = +20
  31-60 days = +10
  61+ days   = +0
  */

  const eventDate =
    event.publishedAt ||
    event.date ||
    event.timestamp ||
    event.announcementDate ||
    null;

  const parsedDate =
    eventDate
      ? new Date(eventDate)
      : null;

  if (
    parsedDate &&
    !Number.isNaN(parsedDate.getTime())
  ) {
    const ageMs =
      Date.now() -
      parsedDate.getTime();

    const ageDays =
      ageMs / (1000 * 60 * 60 * 24);

    if (ageDays >= 0) {
      if (ageDays <= 2) {
        score += 40;
      } else if (ageDays <= 7) {
        score += 35;
      } else if (ageDays <= 14) {
        score += 28;
      } else if (ageDays <= 30) {
        score += 20;
      } else if (ageDays <= 60) {
        score += 10;
      }
    } else {
      /*
      Future-dated events should not receive a
      recency bonus.
      */
      score -= 10;
    }
  }


  /*
  =====================================================
  DESCRIPTION QUALITY
  =====================================================

  Prefer the original NSE description rather than
  the extracted PDF body.
  */

  const cleanDescription =
    event.originalDescription ||
    event.description ||
    "";

  if (
    cleanDescription &&
    String(cleanDescription).trim().length > 100
  ) {
    score += 5;
  }


  /*
  =====================================================
  CLAMP
  =====================================================
  */

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
}


/*
=====================================================
CONFIDENCE
=====================================================

Confidence means confidence in classification,
NOT confidence that the event caused the stock move.
=====================================================
*/

function calculateConfidence(event = {}, type) {
  const text =
    getEventText(event);

  if (!text) {
    return "LOW";
  }

  if (type === "OTHER") {
    return "MEDIUM";
  }

  return "HIGH";
}


/*
=====================================================
IMPACT PRIORITY
=====================================================
*/


function getImpact(type, facts = {}, event = {}) {
  const ageDays = getEventAgeDays(event);

  /*
   * Impact describes the significance of the event itself.
   * It is NOT a claim that the event caused today's price move.
   */

  if (type === "REGULATORY_ACTION") {
    return ageDays <= 14 ? "HIGH" : "MEDIUM";
  }

  if (type === "ACQUISITION") {
    if (facts.value || facts.target || facts.ownership) {
      return ageDays <= 7 ? "HIGH" : "MEDIUM";
    }

    return "MEDIUM";
  }

  if (type === "CONTRACT") {
    if (facts.value || facts.customer) {
      return ageDays <= 7 ? "HIGH" : "MEDIUM";
    }

    return "MEDIUM";
  }

  if (type === "EARNINGS") {
    return ageDays <= 14 ? "HIGH" : "MEDIUM";
  }

  if (type === "MANAGEMENT_CHANGE") {
    return ageDays <= 14 ? "HIGH" : "MEDIUM";
  }

  if (type === "PARTNERSHIP") {
    return ageDays <= 7 ? "MEDIUM" : "LOW";
  }

  if (type === "CORPORATE_ACTION") {
    return ageDays <= 14 ? "MEDIUM" : "LOW";
  }

  return "LOW";
}


function selectTopEvent(events) {
  if (!Array.isArray(events) || !events.length) {
    return null;
  }

  return [...events].sort((a, b) => {
    const relevanceA =
      Number.isFinite(
        Number(a.relevanceScore)
      )
        ? Number(a.relevanceScore)
        : 0;

    const relevanceB =
      Number.isFinite(
        Number(b.relevanceScore)
      )
        ? Number(b.relevanceScore)
        : 0;


    /*
    ---------------------------------------------------
    1. Highest relevance first
    ---------------------------------------------------
    */

    if (
      relevanceA !== relevanceB
    ) {
      return (
        relevanceB -
        relevanceA
      );
    }


    /*
    ---------------------------------------------------
    2. Newer event wins if relevance is tied
    ---------------------------------------------------
    */

    const dateA =
      new Date(
        a.publishedAt ||
        a.date ||
        0
      ).getTime();

    const dateB =
      new Date(
        b.publishedAt ||
        b.date ||
        0
      ).getTime();

    const validDateA =
      Number.isFinite(dateA);

    const validDateB =
      Number.isFinite(dateB);

    if (
      validDateA &&
      validDateB &&
      dateA !== dateB
    ) {
      return dateB - dateA;
    }


    /*
    ---------------------------------------------------
    3. Higher event importance wins
    ---------------------------------------------------
    */

    return (
      getImpactPriority(b.type) -
      getImpactPriority(a.type)
    );
  })[0];
}


/*
=====================================================
NEWS SUMMARY
=====================================================
*/

function createNewsSummary(
  topEvent,
  events
) {
  if (!topEvent) {
    return (
      "No recent company announcements were available."
    );
  }

  return (
    `${events.length} recent company announcement(s) were found. ` +
    `The most relevant event is classified as ${topEvent.readableType}.`
  );
}


/*
=====================================================
EXPORT
=====================================================
*/

module.exports = {
  analyzeNews,
};
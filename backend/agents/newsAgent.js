/*
=====================================================
NEWS AGENT
=====================================================

Job:
- Understand recent company announcements.
- Classify what actually happened.
- Identify potentially important events.
- Never invent information.
- Never claim that an event caused a stock movement.

The News Agent does NOT decide why the stock moved.
That job belongs to the Reasoning Agent.
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

      type,

      readableType:
        getReadableEventType(type),

      impact:
        getEventImpact(type),

      confidence: "HIGH",

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
EVENT CLASSIFICATION
=====================================================
*/

function classifyEvent(event = {}) {
  const text = [
    event.title,
    event.subject,
    event.description,
    event.category,
    event.attachment,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  /*
  Regulatory/legal events are checked BEFORE
  contracts so regulatory orders are not mistaken
  for business contracts.
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
    text.includes("proceedings") ||
    text.includes("violation") ||
    text.includes("non-compliance") ||
    text.includes("sebi") ||
    text.includes("rbi penalty") ||
    text.includes("rbi order")
  ) {
    return "REGULATORY_ACTION";
  }

  if (
    text.includes("contract") ||
    text.includes("contract awarded") ||
    text.includes("contract win") ||
    text.includes("contract wins") ||
    text.includes("order win") ||
    text.includes("order wins") ||
    text.includes("received an order") ||
    text.includes("purchase order") ||
    text.includes("work order") ||
    text.includes("bagging") ||
    text.includes("bagged")
  ) {
    return "CONTRACT";
  }

  if (
    text.includes("financial results") ||
    text.includes("quarterly results") ||
    text.includes("earnings") ||
    text.includes("profit") ||
    text.includes("revenue")
  ) {
    return "EARNINGS";
  }

  if (
    text.includes("acquisition") ||
    text.includes("acquires") ||
    text.includes("acquired")
  ) {
    return "ACQUISITION";
  }

  if (
    text.includes("partnership") ||
    text.includes("strategic alliance") ||
    text.includes("collaboration")
  ) {
    return "PARTNERSHIP";
  }

  if (
    text.includes("appointed") ||
    text.includes("resigned") ||
    text.includes("resignation") ||
    text.includes("management change")
  ) {
    return "MANAGEMENT_CHANGE";
  }

  if (
    text.includes("business update") ||
    text.includes("product launch") ||
    text.includes("new product") ||
    text.includes("expansion")
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

    case "CONTRACT":
      return "HIGH";

    case "EARNINGS":
      return "HIGH";

    case "ACQUISITION":
      return "HIGH";

    case "PARTNERSHIP":
      return "MEDIUM";

    case "MANAGEMENT_CHANGE":
      return "MEDIUM";

    case "BUSINESS_UPDATE":
      return "MEDIUM";

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
SELECT MOST IMPORTANT EVENT
=====================================================

Rules:
1. Meaningful event types beat generic OTHER events.
2. Among meaningful events, newer events win.
3. If dates are equal, higher-impact event wins.
=====================================================
*/

function selectTopEvent(events) {
  if (!events.length) {
    return null;
  }

  const priority = {
    REGULATORY_ACTION: 6,
    EARNINGS: 5,
    ACQUISITION: 5,
    CONTRACT: 4,
    PARTNERSHIP: 3,
    MANAGEMENT_CHANGE: 3,
    BUSINESS_UPDATE: 2,
    OTHER: 1,
  };

  return [...events].sort((a, b) => {
    const priorityA =
      priority[a.type] || 1;

    const priorityB =
      priority[b.type] || 1;

    /*
    ---------------------------------------------------
    Meaningful events beat generic OTHER
    ---------------------------------------------------
    */

    if (
      a.type === "OTHER" &&
      b.type !== "OTHER"
    ) {
      return 1;
    }

    if (
      b.type === "OTHER" &&
      a.type !== "OTHER"
    ) {
      return -1;
    }

    /*
    ---------------------------------------------------
    Newer meaningful event wins
    ---------------------------------------------------
    */

    const dateA =
      new Date(a.date || 0).getTime();

    const dateB =
      new Date(b.date || 0).getTime();

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
    Same date → higher-impact event wins
    ---------------------------------------------------
    */

    return priorityB - priorityA;
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


module.exports = {
  analyzeNews,
};
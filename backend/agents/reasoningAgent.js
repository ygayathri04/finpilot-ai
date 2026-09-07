/*
=====================================================
FINPILOT REASONING AGENT
=====================================================

Core reasoning engine.

IMPORTANT:
- No external AI/API required.
- Uses evidence from the other agents.
- Does not invent facts.
- Does not claim causation without evidence.
- Does not give buy/sell recommendations.

An optional LLM can be added later only as an
explanation/polishing layer.
=====================================================
*/


function getEventArticle(eventName = "") {
  const word = String(eventName || "").trim();

  if (/^[aeiou]/i.test(word)) {
    return "An";
  }

  return "A";
}

function analyzeReasoning({
  symbol,
  stockMovement = {},
  newsAnalysis = {},
  marketAnalysis = {},
  companyAnalysis = {},
}) {
  const stockChange = Number(
    stockMovement.changePercent
  );

  const marketChange = Number(
    marketAnalysis.marketChangePercent
  );

  const sectorChange = Number(
    companyAnalysis.sectorAverageChangePercent
  );

  const sectorDifference = Number(
    companyAnalysis.differenceFromSector
  );

  const marketDifference = Number(
    marketAnalysis.differenceFromMarket
  );

  const stockDirection =
    stockChange > 0
      ? "up"
      : stockChange < 0
      ? "down"
      : "flat";

  const marketDirection =
    marketChange > 0
      ? "up"
      : marketChange < 0
      ? "down"
      : "flat";

  const sectorDirection =
    sectorChange > 0
      ? "up"
      : sectorChange < 0
      ? "down"
      : "flat";


  /*
  =====================================================
  1. WHAT HAPPENED
  =====================================================
  */

  let whatHappened;

  if (Number.isFinite(stockChange)) {
    whatHappened =
      `${symbol} is ${stockDirection} ${Math.abs(
        stockChange
      ).toFixed(2)}% today.`;
  } else {
    whatHappened =
      `The available data does not provide a reliable percentage movement for ${symbol}.`;
  }


  /*
  =====================================================
  2. MARKET SIGNAL
  =====================================================
  */

  let marketSignal;

  if (
    marketAnalysis.classification ===
    "MARKET_DIVERGENCE"
  ) {
    marketSignal =
      `The broader market is ${marketDirection}, while ${symbol} is ${stockDirection}. This is a market divergence, so the broader market alone does not explain the stock movement.`;
  }

  else if (
    marketAnalysis.classification ===
    "MARKET_ALIGNED"
  ) {
    marketSignal =
      `The broader market is also ${marketDirection}. ${symbol} is moving in the same direction as the market, although its movement differs by ${Math.abs(
        marketDifference
      ).toFixed(2)} percentage points.`;
  }

  else if (
    marketAnalysis.classification ===
    "MARKET_OUTPERFORMING_OR_UNDERPERFORMING"
  ) {
    marketSignal =
      `The stock and broader market are moving in the same direction, but ${symbol} is moving noticeably differently from the market.`;
  }

  else {
    marketSignal =
      "There is insufficient market evidence to determine how strongly the broader market explains this movement.";
  }


  /*
  =====================================================
  3. COMPANY / SECTOR SIGNAL
  =====================================================
  */

  let companySignal;

  const classificationValue =
    companyAnalysis.classificationValue ||
    "its sector";

  if (
    companyAnalysis.companySignal ===
    "COMPANY_SPECIFIC"
  ) {
    companySignal =
      `${symbol} is moving differently from ${classificationValue} peers. The stock is ${stockDirection} while the peer average is ${sectorDirection} ${Math.abs(
        sectorChange
      ).toFixed(2)}%. This suggests company-specific factors may be contributing.`;
  }

  else if (
    companyAnalysis.companySignal ===
    "SECTOR_ALIGNED"
  ) {
    companySignal =
      `${symbol} is moving broadly in line with ${classificationValue} peers, so sector-wide factors may be contributing to the movement.`;
  }

  else if (
    Number.isFinite(sectorDifference)
  ) {
    companySignal =
      `${symbol} is moving noticeably differently from ${classificationValue} peers, so company-specific factors may also be relevant.`;
  }

  else {
    companySignal =
      "There is insufficient peer data to determine whether the movement is company-specific.";
  }


  /*
  =====================================================
  4. NEWS SIGNAL
  =====================================================
  */

  let newsSignal;

  const topEvent =
    newsAnalysis.topEvent;

  if (!topEvent) {
    newsSignal =
      "No recent company event was available to evaluate.";
  }

  else {
    const eventType =
      topEvent.readableType ||
      topEvent.type ||
      "company announcement";

    newsSignal =
      `${getEventArticle(eventType)} ${eventType} was identified: "${topEvent.title}". This event may be relevant, but the available evidence does not prove that it caused today's stock movement.`;
  }


  /*
  =====================================================
  5. OVERALL ASSESSMENT
  =====================================================
  */

  const signals = [];

  if (
    marketAnalysis.classification ===
    "MARKET_ALIGNED"
  ) {
    signals.push(
      "the broader market is moving in the same direction"
    );
  }

  if (
    marketAnalysis.classification ===
    "MARKET_DIVERGENCE"
  ) {
    signals.push(
      "the stock is diverging from the broader market"
    );
  }

  if (
    companyAnalysis.companySignal ===
    "COMPANY_SPECIFIC"
  ) {
    signals.push(
      "the stock is behaving differently from its peers"
    );
  }

  if (topEvent) {
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

    if (ageDays !== null && ageDays <= 7) {
      signals.push(
        `a recent ${topEvent.readableType || topEvent.type || "company event"} was identified`
      );
    } else if (ageDays !== null && ageDays <= 30) {
      signals.push(
        `a ${topEvent.readableType || topEvent.type || "company event"} from ${ageDays} days ago was identified`
      );
    } else {
      signals.push(
        `a company ${topEvent.readableType || topEvent.type || "event"} was identified in the available announcements`
      );
    }
  }


  let overallAssessment;

if (signals.length === 0) {
  overallAssessment =
    "The available evidence is insufficient to determine a strong explanation for the stock movement.";
} else {
  const explanationParts = [];

  explanationParts.push(
    whatHappened
  );

  if (marketAnalysis.available) {
    if (
      marketAnalysis.classification ===
      "MARKET_DIVERGENCE"
    ) {
      explanationParts.push(
        "The broader market is moving in the opposite direction, so the market alone does not explain the stock movement."
      );
    } else {
      explanationParts.push(
        `The broader market is also ${marketDirection}, so market-wide factors may be contributing.`
      );
    }
  }

  if (companyAnalysis.available) {
    if (
      companyAnalysis.companySignal ===
      "COMPANY_SPECIFIC"
    ) {
      explanationParts.push(
        `The stock is behaving differently from ${classificationValue} peers, which may point toward company-specific factors.`
      );
    } else if (
      companyAnalysis.companySignal ===
      "SECTOR_ALIGNED"
    ) {
      explanationParts.push(
        `The stock is broadly in line with ${classificationValue} peers, so sector-wide factors may be contributing.`
      );
    }
  }

  if (topEvent) {
  const readableEvent =
    topEvent.displayTitle ||
    topEvent.readableType ||
    topEvent.type ||
    "company event";

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

  if (ageDays !== null && ageDays <= 7) {
    explanationParts.push(
      `A recent ${readableEvent} was identified, which may be relevant, but there is not enough evidence to say it caused today's move.`
    );
  } else if (ageDays !== null && ageDays <= 30) {
    explanationParts.push(
      `${getEventArticle(readableEvent)} ${readableEvent} announced ${ageDays} days ago is relevant background evidence, but there is not enough evidence to link it to today's move.`
    );
  } else {
    explanationParts.push(
      `${getEventArticle(readableEvent)} ${readableEvent} was identified in the available company announcements, but it is not recent enough to be strongly linked to today's move.`
    );
  }
} else {
  explanationParts.push(
    "No clearly relevant recent company event was identified."
  );
}

overallAssessment =
  explanationParts.join(" ");
}

/*
=====================================================
6. CONFIDENCE
=====================================================
*/

let confidence = "LOW";

let evidenceCount = 0;

/*
-----------------------------------------------------
Only count evidence that is actually available.
-----------------------------------------------------
*/

if (
  Number.isFinite(stockChange)
) {
  evidenceCount++;
}

if (
  marketAnalysis.available === true
) {
  evidenceCount++;
}

if (
  companyAnalysis.available === true &&
  Number.isFinite(
    companyAnalysis.sectorAverageChangePercent
  ) &&
  Number(companyAnalysis.peerCount) > 0
) {
  evidenceCount++;
}

if (topEvent) {
  evidenceCount++;
}

/*
-----------------------------------------------------
Confidence level
-----------------------------------------------------
*/

if (evidenceCount >= 4) {
  confidence = "HIGH";
}

else if (evidenceCount >= 2) {
  confidence = "MEDIUM";
}

else {
  confidence = "LOW";
}


  /*
  =====================================================
  FINAL RESPONSE
  =====================================================
  */

  return {
    symbol,

    whatHappened,

    marketSignal,

    companySignal,

    newsSignal,

    overallAssessment,

    confidence,
  };
}


module.exports = {
  analyzeReasoning,
};
async function askFinPilot(question, portfolioContext) {
  const q = String(question || "").trim().toLowerCase();
  const context = portfolioContext || {};
  const holdings = Array.isArray(context.holdings)
    ? context.holdings
    : [];

  if (!q) {
    return "Please ask me a question about your portfolio or stocks.";
  }

  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q.startsWith("hi ") ||
    q.startsWith("hello ")
  ) {
    return "Hi! I'm FinPilot. I can help you understand your portfolio, holdings, risk, and stock-related questions.";
  }

  if (
    q.includes("portfolio") &&
    (q.includes("perform") ||
      q.includes("doing") ||
      q.includes("look"))
  ) {
    if (holdings.length === 0) {
      return "I don't have any holdings available in your portfolio data yet, so I can't assess portfolio performance.";
    }

    const symbols = holdings
      .map((holding) => holding.symbol)
      .filter(Boolean);

    return `Your portfolio currently contains ${holdings.length} holding${
      holdings.length === 1 ? "" : "s"
    }${
      symbols.length
        ? `: ${symbols.join(", ")}.`
        : "."
    } I don't have enough current market-value data here to calculate your overall gain or loss, so I won't invent a performance number.`;
  }

  if (q.includes("holding") || q.includes("holdings")) {
    if (holdings.length === 0) {
      return "You currently have no holdings available in the portfolio data.";
    }

    const details = holdings
      .map((holding) => {
        const symbol = holding.symbol || "Unknown";
        const quantity =
          holding.quantity !== undefined
            ? holding.quantity
            : "unknown";
        const averagePrice =
          holding.average_price !== undefined
            ? holding.average_price
            : "unknown";

        return `${symbol}: ${quantity} shares, average price ${averagePrice}`;
      })
      .join("; ");

    return `Your current holdings are: ${details}.`;
  }

  if (q.includes("risk")) {
    if (!context.risk) {
      return "Risk information is not available right now, so I can't assess your portfolio risk.";
    }

    return `Your portfolio risk data is available. Based on the data returned by FinPilot, the current risk information is: ${JSON.stringify(
      context.risk
    )}.`;
  }

  if (
    q.includes("recommend") ||
    q.includes("recommendation")
  ) {
    if (!context.recommendations) {
      return "No recommendation data is available right now.";
    }

    return `FinPilot has recommendation data available: ${JSON.stringify(
      context.recommendations
    )}. These are informational and should not be treated as guaranteed outcomes.`;
  }

  if (
    q.includes("buy") ||
    q.includes("sell") ||
    q.includes("invest") ||
    q.includes("investment") ||
    q.includes("should i") ||
    q.includes("stocks") ||
    q.includes("stock") ||
    q.includes("finance") ||
    q.includes("financial") ||
    q.includes("market")
  ) {
    const mentionedHolding = holdings.find((holding) =>
      q.includes(String(holding.symbol || "").toLowerCase())
    );

    if (mentionedHolding) {
      return `I can help you evaluate ${mentionedHolding.symbol}, but I can't tell you definitively to buy or sell it. You currently hold ${mentionedHolding.quantity} shares at an average price of ${mentionedHolding.average_price}. To decide whether adding more makes sense, FinPilot would need current price, recent stock movement, company news, and risk information.`;
    }

    return "I can help explain stocks, portfolio holdings, market movements, risk, and financial concepts. I won't give a definitive buy or sell decision when the available evidence is incomplete.";
  }

  return "I can help with your portfolio, holdings, risk, recommendations, stocks, and market concepts. Ask me a specific question and I'll use the available FinPilot data without inventing information.";
}

async function askStockReasoning(stockContext) {
  const prompt = `
You are FinPilot, an AI stock movement intelligence assistant.

Analyze the stock using ONLY the evidence provided below.

Your job is to explain:
1. How the stock is moving.
2. How it compares with its sector.
3. How it compares with the NIFTY 50.
4. Which recent company events may be relevant.
5. Whether the evidence points more toward company-specific, sector-wide, or broader market factors.

Important rules:
- Do not invent facts or financial numbers.
- Do not claim that a news event caused the stock movement unless the evidence proves causation.
- Treat company events as possible contributing factors, not guaranteed causes.
- Mention specific numbers when they are provided.
- Mention the most relevant company event when useful.
- If evidence is insufficient, clearly say so.
- Keep the explanation concise and easy to understand.
- Do not give a definitive buy or sell recommendation.

STOCK INTELLIGENCE DATA:
${JSON.stringify(stockContext, null, 2)}

Write a clear investor-focused explanation of why this stock might be moving today.
`;

  return await askOllama(prompt);
}

async function askStockReasoning(stockContext) {
  const data = stockContext || {};

  const symbol =
    data.symbol ||
    data.ticker ||
    "this stock";

  const currentChange =
    data.dayChangePercent ??
    data.changePercent ??
    null;

  const marketChange =
    data.marketChangePercent ??
    data.niftyChangePercent ??
    null;

  let answer = `FinPilot's available evidence for ${symbol} does not support a definitive buy or sell decision.`;

  if (currentChange !== null) {
    answer += ` The stock's reported move is ${currentChange}%.`;
  }

  if (marketChange !== null) {
    answer += ` The NIFTY 50 market move provided is ${marketChange}%.`;
  }

  answer += " Company events should be treated as possible contributing factors rather than proven causes unless the evidence establishes causation.";

  return answer;
}

module.exports = {
  askFinPilot,
  askStockReasoning,
};

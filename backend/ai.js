require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askFinPilot(question, portfolioContext) {
  const prompt = `
You are FinPilot, an AI financial portfolio assistant.

Your job is to help the user understand their portfolio clearly and responsibly.

Important rules:
- Use the portfolio data provided below.
- Do not invent financial numbers.
- Explain financial concepts in simple language.
- Do not guarantee profits or predict exact future prices.
- Do not make a definitive buy/sell decision for the user.
- If the available data is insufficient, say so.
- Give practical, concise explanations.

PORTFOLIO DATA:
${JSON.stringify(portfolioContext, null, 2)}

USER QUESTION:
${question}

Answer as FinPilot.
`;

  const response = await client.responses.create({
    model: "gpt-5",
    instructions:
      "You are FinPilot, a careful and helpful AI financial portfolio assistant.",
    input: prompt,
  });

  return response.output_text;
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

  const response = await client.responses.create({
    model: "gpt-5",
    instructions:
      "You are FinPilot, a careful stock movement reasoning assistant. Base your answer only on the supplied evidence.",
    input: prompt,
  });

  return response.output_text;
}

module.exports = {
  askFinPilot,
  askStockReasoning,
};
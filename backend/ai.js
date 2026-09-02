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

module.exports = {
  askFinPilot,
};
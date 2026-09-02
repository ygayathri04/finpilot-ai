const express = require("express");
const pool = require("../db");
const { askFinPilot } = require("../ai");

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    // Get all holdings for portfolio 1
    const holdingsResult = await pool.query(
      `SELECT id, symbol, quantity, average_price, created_at
       FROM holdings
       WHERE portfolio_id = $1
       ORDER BY id`,
      [1]
    );

    const holdings = holdingsResult.rows;

    // Get portfolio information
    const portfolioResult = await pool.query(
      `SELECT id, user_id, name, created_at
       FROM portfolios
       WHERE id = $1`,
      [1]
    );

    const portfolio =
      portfolioResult.rows[0] || null;

    // Get risk information from our existing API
    let risk = null;

    try {
      const riskResponse = await fetch(
        "http://localhost:5001/api/risk/1"
      );

      if (riskResponse.ok) {
        risk = await riskResponse.json();
      }
    } catch (error) {
      console.error(
        "Could not fetch risk data:",
        error.message
      );
    }

    // Get recommendation information
    let recommendations = null;

    try {
      const recommendationResponse =
        await fetch(
          "http://localhost:5001/api/recommendations/1"
        );

      if (recommendationResponse.ok) {
        recommendations =
          await recommendationResponse.json();
      }
    } catch (error) {
      console.error(
        "Could not fetch recommendation data:",
        error.message
      );
    }

    // Build context for the AI
    const portfolioContext = {
      portfolio,
      holdings,
      risk,
      recommendations,
    };

    // Ask FinPilot
    const answer = await askFinPilot(
      question,
      portfolioContext
    );

    res.json({
      question,
      answer,
    });
  } catch (error) {
    console.error(
      "AI chat error:",
      error
    );

    res.status(500).json({
      error: "Failed to generate AI response",
    });
  }
});

module.exports = router;
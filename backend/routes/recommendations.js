const express = require("express");

const router = express.Router();

router.get("/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;

    // Get the portfolio risk analysis
    const response = await fetch(
      `http://localhost:5001/api/risk/${portfolioId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch risk analysis");
    }

    const risk = await response.json();

    const recommendations = [];

    // --------------------------------
    // Concentration recommendations
    // --------------------------------

    if (risk.concentration.length === 1) {
      recommendations.push({
        type: "HIGH_RISK",
        title: "Portfolio is highly concentrated",
        message:
          "Your portfolio is invested in a single stock. Consider reviewing diversification across different companies or sectors.",
      });
    }

    for (const stock of risk.concentration) {
      if (stock.percentage >= 60) {
        recommendations.push({
          type: "HIGH_RISK",
          title: `High exposure to ${stock.symbol}`,
          message:
            `${stock.symbol} represents ${stock.percentage.toFixed(
              1
            )}% of your portfolio value. This creates significant concentration risk.`,
        });
      } else if (stock.percentage >= 40) {
        recommendations.push({
          type: "MEDIUM_RISK",
          title: `Large exposure to ${stock.symbol}`,
          message:
            `${stock.symbol} represents ${stock.percentage.toFixed(
              1
            )}% of your portfolio value. Consider whether this level of exposure matches your investment strategy.`,
        });
      }
    }

    // --------------------------------
    // Diversification recommendations
    // --------------------------------

    if (risk.diversification === 1) {
      recommendations.push({
        type: "DIVERSIFICATION",
        title: "Consider diversification",
        message:
          "Adding exposure to other companies or sectors could reduce dependence on a single investment.",
      });
    } else if (risk.diversification === 2) {
      recommendations.push({
        type: "DIVERSIFICATION",
        title: "Limited diversification",
        message:
          "Your portfolio contains only two different stocks. Consider reviewing whether additional diversification would be appropriate.",
      });
    }

    // --------------------------------
    // Healthy portfolio message
    // --------------------------------

    if (recommendations.length === 0) {
      recommendations.push({
        type: "POSITIVE",
        title: "Portfolio looks reasonably diversified",
        message:
          "No major concentration risks were detected based on the current portfolio structure.",
      });
    }

    // --------------------------------
    // Overall recommendation
    // --------------------------------

    let summary;

    if (risk.riskLevel === "HIGH") {
      summary =
        "Your portfolio currently has a high concentration risk. Review your exposure and consider whether greater diversification fits your investment goals.";
    } else if (risk.riskLevel === "MEDIUM") {
      summary =
        "Your portfolio has some concentration risk. Reviewing diversification may help reduce dependence on a small number of investments.";
    } else {
      summary =
        "Your portfolio currently shows relatively low concentration risk based on the available holdings.";
    }

    res.json({
      portfolioId: Number(portfolioId),
      riskLevel: risk.riskLevel,
      summary,
      recommendations,
    });
  } catch (error) {
    console.error(
      "Recommendation engine error:",
      error
    );

    res.status(500).json({
      error: "Failed to generate recommendations",
    });
  }
});

module.exports = router;
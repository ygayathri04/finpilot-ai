const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { portfolio_id, symbol, quantity, average_price } = req.body;

    const result = await pool.query(
      `INSERT INTO holdings
       (portfolio_id, symbol, quantity, average_price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [portfolio_id, symbol, quantity, average_price]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add holding" });
  }
});

router.get("/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;

    const result = await pool.query(
      "SELECT * FROM holdings WHERE portfolio_id = $1 ORDER BY id",
      [portfolioId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch holdings" });
  }
});

module.exports = router;
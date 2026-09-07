const express = require("express");
const pool = require("../db");

const router = express.Router();

// --------------------------------
// Add holding
// --------------------------------
router.post("/", async (req, res) => {
  try {
    const {
      portfolio_id,
      symbol,
      quantity,
      average_price,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO holdings
       (portfolio_id, symbol, quantity, average_price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        portfolio_id,
        symbol,
        quantity,
        average_price,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to add holding",
    });
  }
});

// --------------------------------
// Get holdings
// --------------------------------
router.get("/:portfolioId", async (req, res) => {
  try {
    const { portfolioId } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM holdings
       WHERE portfolio_id = $1
       ORDER BY id`,
      [portfolioId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch holdings",
    });
  }
});

// --------------------------------
// Update holding
// --------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantity,
      average_price,
    } = req.body;

    const result = await pool.query(
      `UPDATE holdings
       SET quantity = $1,
           average_price = $2
       WHERE id = $3
       RETURNING *`,
      [
        quantity,
        average_price,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Holding not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to update holding",
    });
  }
});

// --------------------------------
// Delete holding
// --------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM holdings
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Holding not found",
      });
    }

    res.json({
      message: "Holding removed successfully",
      holding: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to remove holding",
    });
  }
});

module.exports = router;
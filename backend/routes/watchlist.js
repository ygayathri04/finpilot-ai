const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { user_id, symbol } = req.body;

    const result = await pool.query(
      `INSERT INTO watchlist (user_id, symbol)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, symbol]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM watchlist WHERE user_id = $1 ORDER BY id",
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM watchlist WHERE id = $1",
      [id]
    );

    res.json({ message: "Stock removed from watchlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove stock" });
  }
});

module.exports = router;
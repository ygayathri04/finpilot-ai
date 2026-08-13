const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { user_id, name } = req.body;

    const result = await pool.query(
      "INSERT INTO portfolios (user_id, name) VALUES ($1, $2) RETURNING *",
      [user_id, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create portfolio" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM portfolios WHERE user_id = $1 ORDER BY id",
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch portfolios" });
  }
});

module.exports = router;
const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM alerts
       WHERE user_id = $1
       ORDER BY id DESC`,
      [req.params.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      symbol,
      alert_type,
      target_value,
    } = req.body;

    if (!user_id || !symbol || !alert_type) {
      return res.status(400).json({
        error: "user_id, symbol, and alert_type are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO alerts
       (user_id, symbol, alert_type, target_value)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        user_id,
        symbol.toUpperCase(),
        alert_type,
        target_value ?? null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create alert:", error);
    res.status(500).json({ error: "Failed to create alert" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { is_active } = req.body;

    const result = await pool.query(
      `UPDATE alerts
       SET is_active = $1
       WHERE id = $2
       RETURNING *`,
      [Boolean(is_active), req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update alert:", error);
    res.status(500).json({ error: "Failed to update alert" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM alerts WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ message: "Alert deleted" });
  } catch (error) {
    console.error("Failed to delete alert:", error);
    res.status(500).json({ error: "Failed to delete alert" });
  }
});

module.exports = router;

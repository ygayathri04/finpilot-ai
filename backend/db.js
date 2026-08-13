const { Pool } = require("pg");

const pool = new Pool({
  user: "finpilot",
  host: "localhost",
  database: "finpilot",
  password: "finpilot_dev",
  port: 5432,
});

module.exports = pool;
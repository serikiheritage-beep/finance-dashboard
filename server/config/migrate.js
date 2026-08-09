// Run with: npm run migrate
// Applies models/schema.sql to the configured DATABASE_URL.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("./db");

async function migrate() {
  const schemaPath = path.join(__dirname, "..", "models", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  try {
    await pool.query(sql);
    console.log("Schema applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();

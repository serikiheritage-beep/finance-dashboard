const { body, validationResult } = require("express-validator");
const db = require("../config/db");

const accountValidators = [
  body("name").trim().isLength({ min: 1 }).withMessage("Account name is required."),
  body("type")
    .isIn(["checking", "savings", "credit", "investment"])
    .withMessage("Type must be checking, savings, credit, or investment."),
  body("balance").optional().isFloat().withMessage("Balance must be a number."),
  body("currency").optional().isLength({ min: 3, max: 10 }),
];

async function listAccounts(req, res, next) {
  try {
    const result = await db.query(
      "SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ accounts: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createAccount(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { name, type, balance = 0, currency = "USD" } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO accounts (user_id, name, type, balance, currency)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, name, type, balance, currency]
    );
    res.status(201).json({ account: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateAccount(req, res, next) {
  const { id } = req.params;
  const { name, type, status, currency } = req.body;

  try {
    const result = await db.query(
      `UPDATE accounts
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           status = COALESCE($3, status),
           currency = COALESCE($4, currency)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, type, status, currency, id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Account not found." });
    res.json({ account: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Account not found." });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAccounts, createAccount, updateAccount, deleteAccount, accountValidators };

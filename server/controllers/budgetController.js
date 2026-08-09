const { body, validationResult } = require("express-validator");
const db = require("../config/db");

const budgetValidators = [
  body("category").trim().isLength({ min: 1 }).withMessage("Category is required."),
  body("month").matches(/^\d{4}-\d{2}$/).withMessage("Month must be in YYYY-MM format."),
  body("limitAmount").isFloat({ gt: 0 }).withMessage("Limit must be a positive number."),
];

async function listBudgets(req, res, next) {
  const { month } = req.query;
  try {
    const budgets = await db.query(
      month
        ? "SELECT * FROM budgets WHERE user_id = $1 AND month = $2 ORDER BY category"
        : "SELECT * FROM budgets WHERE user_id = $1 ORDER BY month DESC, category",
      month ? [req.user.id, month] : [req.user.id]
    );

    // Attach spend-to-date for each budget's category/month.
    const withSpend = await Promise.all(
      budgets.rows.map(async (b) => {
        const spend = await db.query(
          `SELECT COALESCE(SUM(amount), 0) AS spent
           FROM transactions
           WHERE user_id = $1 AND type = 'expense' AND category = $2
             AND to_char(occurred_on, 'YYYY-MM') = $3`,
          [req.user.id, b.category, b.month]
        );
        return { ...b, spent: Number(spend.rows[0].spent) };
      })
    );

    res.json({ budgets: withSpend });
  } catch (err) {
    next(err);
  }
}

async function upsertBudget(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { category, month, limitAmount } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO budgets (user_id, category, month, limit_amount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category, month)
       DO UPDATE SET limit_amount = EXCLUDED.limit_amount
       RETURNING *`,
      [req.user.id, category, month, limitAmount]
    );
    res.status(201).json({ budget: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteBudget(req, res, next) {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Budget not found." });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listBudgets, upsertBudget, deleteBudget, budgetValidators };

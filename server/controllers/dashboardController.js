const db = require("../config/db");

async function summary(req, res, next) {
  try {
    const userId = req.user.id;

    const totalsQ = db.query(
      `SELECT
         COALESCE(SUM(balance) FILTER (WHERE status = 'active'), 0) AS total_balance
       FROM accounts WHERE user_id = $1`,
      [userId]
    );

    const monthQ = db.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS monthly_income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS monthly_expenses
       FROM transactions
       WHERE user_id = $1 AND to_char(occurred_on, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')`,
      [userId]
    );

    const byCategoryQ = db.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND to_char(occurred_on, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
       GROUP BY category ORDER BY total DESC`,
      [userId]
    );

    const trendQ = db.query(
      `SELECT to_char(occurred_on, 'YYYY-MM') AS month,
              COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
              COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expenses
       FROM transactions
       WHERE user_id = $1 AND occurred_on >= (CURRENT_DATE - INTERVAL '6 months')
       GROUP BY month ORDER BY month ASC`,
      [userId]
    );

    const [totals, month, byCategory, trend] = await Promise.all([totalsQ, monthQ, byCategoryQ, trendQ]);

    const income = Number(month.rows[0].monthly_income);
    const expenses = Number(month.rows[0].monthly_expenses);
    const savingsRate = income > 0 ? Number((((income - expenses) / income) * 100).toFixed(1)) : 0;

    res.json({
      totalBalance: Number(totals.rows[0].total_balance),
      monthlyIncome: income,
      monthlyExpenses: expenses,
      savingsRate,
      spendingByCategory: byCategory.rows.map((r) => ({ category: r.category, total: Number(r.total) })),
      trend: trend.rows.map((r) => ({
        month: r.month,
        income: Number(r.income),
        expenses: Number(r.expenses),
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };

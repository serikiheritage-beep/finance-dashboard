const db = require("../config/db");

async function createNotification(client, userId, type, message) {
  await client.query(
    `INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)`,
    [userId, type, message]
  );
}

const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

// Called after an expense transaction is inserted, inside the same DB
// transaction/client used to write it. Only fires the moment spend crosses
// the limit (not on every subsequent over-budget transaction) to avoid spam.
async function checkBudgetExceeded(client, userId, category, month, newTotalSpent, amountJustAdded) {
  const budgetRes = await client.query(
    `SELECT limit_amount FROM budgets WHERE user_id = $1 AND category = $2 AND month = $3`,
    [userId, category, month]
  );
  const budget = budgetRes.rows[0];
  if (!budget) return;

  const limit = Number(budget.limit_amount);
  const spentBefore = newTotalSpent - amountJustAdded;

  if (spentBefore <= limit && newTotalSpent > limit) {
    await createNotification(
      client,
      userId,
      "budget_exceeded",
      `Your ${category} budget for ${month} is over limit — spent ${currency(newTotalSpent)} of ${currency(limit)}.`
    );
  }
}

async function notifyIncomeReceived(client, userId, category, amount) {
  await createNotification(
    client,
    userId,
    "income_received",
    `Income received: ${currency(amount)} (${category}).`
  );
}

module.exports = { createNotification, checkBudgetExceeded, notifyIncomeReceived };

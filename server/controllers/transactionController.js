const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { checkBudgetExceeded, notifyIncomeReceived } = require("../utils/notificationService");

const transactionValidators = [
  body("accountId").isInt().withMessage("A valid account is required."),
  body("type").isIn(["income", "expense", "transfer"]).withMessage("Type must be income, expense, or transfer."),
  body("category").trim().isLength({ min: 1 }).withMessage("Category is required."),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number."),
  body("occurredOn").optional().isISO8601().withMessage("Date must be a valid date."),
];

// Income increases balance, expense/transfer-out decreases it.
function signedDelta(type, amount) {
  return type === "income" ? amount : -amount;
}

async function listTransactions(req, res, next) {
  const { accountId, category, from, to, limit = 100 } = req.query;
  const clauses = ["user_id = $1"];
  const params = [req.user.id];

  if (accountId) {
    params.push(accountId);
    clauses.push(`account_id = $${params.length}`);
  }
  if (category) {
    params.push(category);
    clauses.push(`category = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`occurred_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`occurred_on <= $${params.length}`);
  }

  params.push(Math.min(Number(limit) || 100, 500));

  try {
    const result = await db.query(
      `SELECT * FROM transactions WHERE ${clauses.join(" AND ")}
       ORDER BY occurred_on DESC, created_at DESC LIMIT $${params.length}`,
      params
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createTransaction(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { accountId, type, category, amount, paymentMethod, notes, occurredOn } = req.body;
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const account = await client.query(
      "SELECT * FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [accountId, req.user.id]
    );
    if (!account.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Account not found." });
    }

    const inserted = await client.query(
      `INSERT INTO transactions (user_id, account_id, type, category, amount, payment_method, notes, occurred_on)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE))
       RETURNING *`,
      [req.user.id, accountId, type, category, amount, paymentMethod, notes, occurredOn]
    );

    const delta = signedDelta(type, amount);
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [delta, accountId]);

    const tx = inserted.rows[0];
    const month = tx.occurred_on.toISOString().slice(0, 7);

    if (type === "expense") {
      const spendRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
         WHERE user_id = $1 AND type = 'expense' AND category = $2 AND to_char(occurred_on, 'YYYY-MM') = $3`,
        [req.user.id, category, month]
      );
      await checkBudgetExceeded(client, req.user.id, category, month, Number(spendRes.rows[0].spent), Number(amount));
    } else if (type === "income") {
      await notifyIncomeReceived(client, req.user.id, category, Number(amount));
    }

    await client.query("COMMIT");
    res.status(201).json({ transaction: tx });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

async function deleteTransaction(req, res, next) {
  const { id } = req.params;
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT * FROM transactions WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (!existing.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transaction not found." });
    }

    const tx = existing.rows[0];
    const reversal = -signedDelta(tx.type, Number(tx.amount));
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [reversal, tx.account_id]);
    await client.query("DELETE FROM transactions WHERE id = $1", [id]);

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listTransactions, createTransaction, deleteTransaction, transactionValidators };

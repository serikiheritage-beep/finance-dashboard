import { useEffect, useState } from "react";
import api from "../services/api";

const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n || 0));

const CATEGORIES = ["Food", "Transport", "Shopping", "Utilities", "Entertainment", "Healthcare", "Income", "Other"];

export default function Transactions() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filterAccount, setFilterAccount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    accountId: "",
    type: "expense",
    category: "Food",
    amount: "",
    notes: "",
    occurredOn: new Date().toISOString().slice(0, 10),
  });

  function loadAll() {
    api.get("/accounts").then(({ data }) => {
      setAccounts(data.accounts);
      setForm((f) => (f.accountId ? f : { ...f, accountId: data.accounts[0]?.id || "" }));
    });
  }

  function loadTransactions() {
    api
      .get("/transactions", { params: filterAccount ? { accountId: filterAccount } : {} })
      .then(({ data }) => setTransactions(data.transactions));
  }

  useEffect(loadAll, []);
  useEffect(loadTransactions, [filterAccount]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/transactions", { ...form, amount: Number(form.amount) });
      setForm({ ...form, amount: "", notes: "" });
      loadTransactions();
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't save that transaction.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/transactions/${id}`);
    loadTransactions();
    loadAll();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Register</p>
          <h1>Transactions</h1>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Log a transaction</h3>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="tx-account">Account</label>
              <select
                id="tx-account"
                required
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tx-type">Type</label>
              <select id="tx-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="tx-category">Category</label>
              <select
                id="tx-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tx-amount">Amount</label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="tx-date">Date</label>
              <input
                id="tx-date"
                type="date"
                value={form.occurredOn}
                onChange={(e) => setForm({ ...form, occurredOn: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="tx-notes">Notes (optional)</label>
              <input id="tx-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn" type="submit" disabled={busy || !form.accountId}>
              {busy ? "Saving…" : "Add transaction"}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="toolbar" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              Ledger
            </h3>
            <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} style={{ width: 180 }}>
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">No transactions yet.</div>
          ) : (
            <div className="ledger">
              {transactions.map((t) => (
                <div className="ledger-row" key={t.id}>
                  <div className="ledger-date">{t.occurred_on?.slice(0, 10)}</div>
                  <div className="ledger-desc">{t.notes || t.category}</div>
                  <div className="ledger-category">{t.category}</div>
                  <div className="ledger-leader" />
                  <div className={`ledger-amount mono ${t.type === "income" ? "income" : "expense"}`}>
                    {t.type === "income" ? "+" : "−"}
                    {currency(t.amount)}
                  </div>
                  <button className="ledger-remove" onClick={() => handleDelete(t.id)} title="Delete">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

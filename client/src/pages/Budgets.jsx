import { useEffect, useState } from "react";
import api from "../services/api";

const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const CATEGORIES = ["Food", "Transport", "Shopping", "Utilities", "Entertainment", "Healthcare", "Other"];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [form, setForm] = useState({ category: "Food", limitAmount: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api.get("/budgets", { params: { month } }).then(({ data }) => setBudgets(data.budgets));
  }

  useEffect(load, [month]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/budgets", { ...form, month, limitAmount: Number(form.limitAmount) });
      setForm({ category: "Food", limitAmount: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't save that budget.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/budgets/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Planning</p>
          <h1>Monthly Budgets</h1>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 160 }} />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Set a budget</h3>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="bud-category">Category</label>
              <select
                id="bud-category"
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
              <label htmlFor="bud-limit">Monthly limit</label>
              <input
                id="bud-limit"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={form.limitAmount}
                onChange={(e) => setForm({ ...form, limitAmount: e.target.value })}
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save budget"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="section-title">Budget usage — {month}</h3>
          {budgets.length === 0 ? (
            <div className="empty-state">No budgets set for this month yet.</div>
          ) : (
            budgets.map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.limit_amount) * 100));
              const over = b.spent > b.limit_amount;
              return (
                <div key={b.id} style={{ marginBottom: "1.1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: 600 }}>{b.category}</span>
                    <span className="mono" style={{ color: over ? "var(--rust)" : "var(--ink-soft)" }}>
                      {currency(b.spent)} / {currency(b.limit_amount)}
                    </span>
                  </div>
                  <div className="budget-bar-track">
                    <div
                      className="budget-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: over ? "var(--rust)" : "var(--teal)",
                      }}
                    />
                  </div>
                  <button
                    className="ledger-remove"
                    style={{ marginTop: "0.3rem", fontSize: "0.75rem" }}
                    onClick={() => handleDelete(b.id)}
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

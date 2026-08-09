import { useEffect, useState } from "react";
import api from "../services/api";

const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const TYPES = ["checking", "savings", "credit", "investment"];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ name: "", type: "checking", balance: "", currency: "USD" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api.get("/accounts").then(({ data }) => setAccounts(data.accounts));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/accounts", { ...form, balance: Number(form.balance) || 0 });
      setForm({ name: "", type: "checking", balance: "", currency: "USD" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create the account.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this account? Its transactions will be deleted too.")) return;
    await api.delete(`/accounts/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Accounts</p>
          <h1>Your Accounts</h1>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Add an account</h3>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="acc-name">Account name</label>
              <input
                id="acc-name"
                required
                placeholder="e.g. Everyday Checking"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="acc-type">Type</label>
              <select id="acc-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="acc-balance">Starting balance</label>
              <input
                id="acc-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add account"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="section-title">All accounts</h3>
          {accounts.length === 0 ? (
            <div className="empty-state">No accounts yet — add your first one.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>
                        <span className={`badge badge-${a.type}`}>{a.type}</span>
                      </td>
                      <td className="mono">{currency(a.balance)}</td>
                      <td>
                        <button className="btn-danger btn" onClick={() => handleDelete(a.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="auth-mark">Ledger</div>
        <div className="auth-sub">Create your account — takes about a minute</div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: "0.5rem" }}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div style={{ marginTop: "1.2rem", fontSize: "0.88rem", color: "var(--ink-soft)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--teal)", fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

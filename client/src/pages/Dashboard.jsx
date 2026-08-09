import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../services/api";

const currency = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const PIE_COLORS = ["#0E6B5C", "#B8863B", "#A8452F", "#33478C", "#7A6A9C", "#5B6660"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then(({ data }) => setData(data))
      .catch(() => setError("Couldn't load your dashboard right now."));
  }, []);

  if (error) return <div className="empty-state">{error}</div>;
  if (!data) return <div className="empty-state">Loading your dashboard…</div>;

  const net = data.monthlyIncome - data.monthlyExpenses;

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Financial Dashboard</h1>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-label">Total balance</div>
          <div className="stat-value figure">{currency(data.totalBalance)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Income this month</div>
          <div className="stat-value figure positive">{currency(data.monthlyIncome)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Expenses this month</div>
          <div className="stat-value figure negative">{currency(data.monthlyExpenses)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Savings rate</div>
          <div className={`stat-value figure ${net >= 0 ? "positive" : "negative"}`}>
            {data.savingsRate}%
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card chart-card">
          <h3>Income vs. expenses — last 6 months</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.trend}>
              <CartesianGrid stroke="#DDD6C7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#5B6660" />
              <YAxis tick={{ fontSize: 12 }} stroke="#5B6660" tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => currency(v)} />
              <Line type="monotone" dataKey="income" stroke="#0E6B5C" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#A8452F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Spending by category — this month</h3>
          {data.spendingByCategory.length === 0 ? (
            <div className="empty-state">No expenses logged yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.spendingByCategory}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.spendingByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => currency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

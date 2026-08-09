import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/accounts", label: "Accounts" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budgets", label: "Budgets" },
];

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: "1px solid var(--rule)",
        padding: "1.6rem 1.2rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100vh",
      }}
    >
      <div>
        <div className="auth-mark" style={{ marginBottom: "2rem" }}>
          Ledger
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              style={({ isActive }) => ({
                padding: "0.55rem 0.7rem",
                borderRadius: 3,
                fontSize: "0.92rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--teal)" : "var(--ink)",
                background: isActive ? "var(--teal-soft)" : "transparent",
                textDecoration: "none",
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.15rem" }}>
          {user?.name}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginBottom: "0.8rem" }}>
          {user?.email}
        </div>
        <button className="btn-outline btn" style={{ width: "100%" }} onClick={logout}>
          Sign out
        </button>
      </div>
    </nav>
  );
  }
    

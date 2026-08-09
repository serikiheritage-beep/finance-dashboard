import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const TYPE_ICON = {
  budget_exceeded: "⚠",
  income_received: "＋",
  bill_due: "🕐",
  unusual_spending: "◆",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  function load() {
    api.get("/notifications").then(({ data }) => {
      setItems(data.notifications);
      setUnread(data.unreadCount);
    });
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
  }

  async function handleItemClick(n) {
    if (!n.is_read) {
      await api.post(`/notifications/${n.id}/read`);
      load();
    }
  }

  async function handleMarkAllRead() {
    await api.post("/notifications/read-all");
    load();
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          background: "none",
          border: "1px solid var(--rule)",
          borderRadius: "999px",
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontSize: "1rem",
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "var(--rust)",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.62rem",
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: 46,
            width: 320,
            maxHeight: 420,
            overflowY: "auto",
            zIndex: 20,
            padding: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.8rem 1rem",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: "none", border: "none", color: "var(--teal)", fontSize: "0.78rem", fontWeight: 600 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.6rem 1rem" }}>
              You're all caught up.
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--rule)",
                  cursor: "pointer",
                  background: n.is_read ? "transparent" : "var(--teal-soft)",
                }}
              >
                <span style={{ flexShrink: 0 }}>{TYPE_ICON[n.type] || "•"}</span>
                <div>
                  <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", marginTop: "0.2rem" }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

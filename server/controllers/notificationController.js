const db = require("../config/db");

async function listNotifications(req, res, next) {
  try {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unread = result.rows.filter((n) => !n.is_read).length;
    res.json({ notifications: result.rows, unreadCount: unread });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Notification not found." });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await db.query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`, [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead, markAllRead };

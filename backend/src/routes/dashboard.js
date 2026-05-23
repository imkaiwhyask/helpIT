const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/stats', (req, res) => {
  const db = getDb();
  const now = new Date().toISOString();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as cnt FROM tickets GROUP BY status
  `).all().reduce((acc, r) => { acc[r.status] = r.cnt; return acc; }, {});

  const byPriority = db.prepare(`
    SELECT priority, COUNT(*) as cnt FROM tickets
    WHERE status NOT IN ('resolved','closed')
    GROUP BY priority
  `).all().reduce((acc, r) => { acc[r.priority] = r.cnt; return acc; }, {});

  const resolvedToday = db.prepare(`
    SELECT COUNT(*) as cnt FROM tickets
    WHERE status IN ('resolved','closed') AND resolved_at >= ?
  `).get(todayStart.toISOString()).cnt;

  const overdue = db.prepare(`
    SELECT COUNT(*) as cnt FROM tickets
    WHERE status NOT IN ('resolved','closed') AND resolution_due < ?
  `).get(now).cnt;

  const recentTickets = db.prepare(`
    SELECT t.id, t.title, t.priority, t.status, t.category,
           t.created_at, t.resolution_due, t.sla_resolution_breached,
           u.name AS assigned_name
    FROM tickets t
    LEFT JOIN users u ON t.assigned_to = u.id
    ORDER BY t.created_at DESC
    LIMIT 8
  `).all();

  // SLA compliance for last 7 days
  const slaCompliance = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(); start.setDate(start.getDate() - i); start.setHours(0, 0, 0, 0);
    const end   = new Date(start); end.setHours(23, 59, 59, 999);
    const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const row = db.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN sla_resolution_breached = 0 THEN 1 ELSE 0 END) as on_time
      FROM tickets
      WHERE status IN ('resolved','closed')
        AND resolved_at >= ? AND resolved_at <= ?
    `).get(start.toISOString(), end.toISOString());

    slaCompliance.push({
      date: label,
      total: row.total,
      on_time: row.on_time,
      rate: row.total > 0 ? Math.round((row.on_time / row.total) * 100) : null,
    });
  }

  res.json({
    stats: {
      open: byStatus.open || 0,
      in_progress: byStatus.in_progress || 0,
      on_hold: byStatus.on_hold || 0,
      resolved_today: resolvedToday,
      overdue,
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    },
    by_priority: {
      critical: byPriority.critical || 0,
      high: byPriority.high || 0,
      medium: byPriority.medium || 0,
      low: byPriority.low || 0,
    },
    by_status: {
      open: byStatus.open || 0,
      in_progress: byStatus.in_progress || 0,
      on_hold: byStatus.on_hold || 0,
      resolved: byStatus.resolved || 0,
      closed: byStatus.closed || 0,
    },
    sla_compliance: slaCompliance,
    recent_tickets: recentTickets,
  });
});

module.exports = router;

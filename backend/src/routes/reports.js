const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Technician performance — admin/technician only
router.get('/technicians', (req, res) => {
  if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();

  const { days = 30 } = req.query;
  const since = new Date(Date.now() - Number(days) * 86400000).toISOString();

  const techs = db.prepare(`
    SELECT
      u.id, u.name, u.email, u.department,
      COUNT(t.id)                                                          AS total_assigned,
      SUM(CASE WHEN t.status IN ('resolved','closed') THEN 1 ELSE 0 END) AS resolved,
      SUM(CASE WHEN t.status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) AS open,
      SUM(CASE WHEN t.sla_resolution_breached = 1 THEN 1 ELSE 0 END)     AS breached,
      SUM(CASE WHEN t.status IN ('resolved','closed')
               AND t.sla_resolution_breached = 0 THEN 1 ELSE 0 END)      AS resolved_on_time,
      AVG(CASE WHEN t.resolved_at IS NOT NULL
               THEN (julianday(t.resolved_at) - julianday(t.created_at)) * 24
               ELSE NULL END)                                              AS avg_resolution_hours
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to = u.id AND t.created_at >= ?
    WHERE u.role IN ('technician','admin') AND u.is_active = 1
    GROUP BY u.id
    ORDER BY resolved DESC, u.name ASC
  `).all(since);

  // SLA compliance per tech
  const result = techs.map(t => ({
    ...t,
    sla_compliance: t.resolved > 0
      ? Math.round((t.resolved_on_time / t.resolved) * 100)
      : null,
    avg_resolution_hours: t.avg_resolution_hours
      ? Math.round(t.avg_resolution_hours * 10) / 10
      : null,
  }));

  res.json({ technicians: result, period_days: Number(days) });
});

// Overall ticket trend — tickets created per day for last N days
router.get('/trends', (req, res) => {
  if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();
  const { days = 30 } = req.query;
  const since = new Date(Date.now() - Number(days) * 86400000).toISOString();

  const rows = db.prepare(`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS created,
      SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) AS resolved,
      SUM(CASE WHEN sla_resolution_breached = 1 THEN 1 ELSE 0 END) AS breached
    FROM tickets
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(since);

  res.json({ trends: rows, period_days: Number(days) });
});

module.exports = router;

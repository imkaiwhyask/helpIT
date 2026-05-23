const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Technician performance — admin/technician only
router.get('/technicians', async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });

    const { days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 86400000);

    const techs = await prisma.$queryRaw`
      SELECT
        u.id, u.name, u.email, u.department,
        COUNT(t.id)::int                                                                          AS total_assigned,
        COALESCE(SUM(CASE WHEN t.status IN ('resolved','closed') THEN 1 ELSE 0 END), 0)::int     AS resolved,
        COALESCE(SUM(CASE WHEN t.status NOT IN ('resolved','closed') THEN 1 ELSE 0 END), 0)::int AS open,
        COALESCE(SUM(CASE WHEN t.sla_resolution_breached = true THEN 1 ELSE 0 END), 0)::int      AS breached,
        COALESCE(SUM(CASE WHEN t.status IN ('resolved','closed')
                          AND t.sla_resolution_breached = false THEN 1 ELSE 0 END), 0)::int      AS resolved_on_time,
        AVG(CASE WHEN t.resolved_at IS NOT NULL
                 THEN EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600
                 ELSE NULL END)                                                                   AS avg_resolution_hours
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to = u.id AND t.created_at >= ${since}
      WHERE u.role IN ('technician','admin') AND u.is_active = true
      GROUP BY u.id
      ORDER BY resolved DESC, u.name ASC
    `;

    const result = techs.map(t => ({
      ...t,
      sla_compliance: t.resolved > 0
        ? Math.round((t.resolved_on_time / t.resolved) * 100)
        : null,
      avg_resolution_hours: t.avg_resolution_hours != null
        ? Math.round(Number(t.avg_resolution_hours) * 10) / 10
        : null,
    }));

    res.json({ technicians: result, period_days: Number(days) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Overall ticket trend — tickets created per day for last N days
router.get('/trends', async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });

    const { days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 86400000);

    const rows = await prisma.$queryRaw`
      SELECT
        DATE(created_at)::text                                                                AS date,
        COUNT(*)::int                                                                         AS created,
        COALESCE(SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END), 0)::int   AS resolved,
        COALESCE(SUM(CASE WHEN sla_resolution_breached = true THEN 1 ELSE 0 END), 0)::int    AS breached
      FROM tickets
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json({ trends: rows, period_days: Number(days) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

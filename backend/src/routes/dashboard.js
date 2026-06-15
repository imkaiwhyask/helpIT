const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/stats', async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });

    const now = new Date();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const slaWindowStart = new Date(); slaWindowStart.setDate(slaWindowStart.getDate() - 6); slaWindowStart.setHours(0, 0, 0, 0);

    const [
      byStatusRaw,
      byPriorityRaw,
      resolvedToday,
      overdue,
      recentTickets,
      slaRows,
    ] = await Promise.all([
      prisma.ticket.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.ticket.groupBy({
        by: ['priority'],
        where: { status: { notIn: ['resolved', 'closed'] } },
        _count: { id: true },
      }),
      prisma.ticket.count({
        where: { status: { in: ['resolved', 'closed'] }, resolved_at: { gte: todayStart } },
      }),
      prisma.ticket.count({
        where: { status: { notIn: ['resolved', 'closed'] }, resolution_due: { lt: now } },
      }),
      prisma.ticket.findMany({
        where: {},
        select: {
          id: true, title: true, priority: true, status: true,
          category: true, created_at: true, resolution_due: true,
          sla_resolution_breached: true,
          assigned_user: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 8,
      }),
      prisma.$queryRaw`
        SELECT
          DATE(resolved_at)::text AS date,
          COUNT(*)::int AS total,
          COALESCE(SUM(CASE WHEN sla_resolution_breached = false THEN 1 ELSE 0 END), 0)::int AS on_time
        FROM tickets
        WHERE status IN ('resolved','closed')
          AND resolved_at >= ${slaWindowStart}
          AND resolved_at < ${now}
        GROUP BY DATE(resolved_at)
      `,
    ]);

    const byStatus   = Object.fromEntries(byStatusRaw.map(r   => [r.status,   r._count.id]));
    const byPriority = Object.fromEntries(byPriorityRaw.map(r => [r.priority, r._count.id]));

    // Build 7-day SLA compliance array from single query result
    const slaMap = new Map(slaRows.map(r => [r.date, r]));
    const slaCompliance = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const key   = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const row   = slaMap.get(key) ?? { total: 0, on_time: 0 };
      slaCompliance.push({
        date:    label,
        total:   row.total,
        on_time: row.on_time,
        rate: row.total > 0 ? Math.round((row.on_time / row.total) * 100) : null,
      });
    }

    const recent = recentTickets.map(({ assigned_user, ...t }) => ({
      ...t,
      assigned_name: assigned_user?.name ?? null,
    }));

    res.json({
      stats: {
        open:           byStatus.open           || 0,
        in_progress:    byStatus.in_progress    || 0,
        on_hold:        byStatus.on_hold        || 0,
        resolved_today: resolvedToday,
        overdue,
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      },
      by_priority: {
        critical: byPriority.critical || 0,
        high:     byPriority.high     || 0,
        medium:   byPriority.medium   || 0,
        low:      byPriority.low      || 0,
      },
      by_status: {
        open:        byStatus.open        || 0,
        in_progress: byStatus.in_progress || 0,
        on_hold:     byStatus.on_hold     || 0,
        resolved:    byStatus.resolved    || 0,
        closed:      byStatus.closed      || 0,
      },
      sla_compliance: slaCompliance,
      recent_tickets: recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

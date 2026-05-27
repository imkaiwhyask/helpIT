const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();
router.use(requireAuth);

const SLA = {
  critical: { response: 1,  resolution: 4  },
  high:     { response: 4,  resolution: 8  },
  medium:   { response: 8,  resolution: 24 },
  low:      { response: 24, resolution: 72 },
};

const VALID_PRIORITIES = new Set(['critical', 'high', 'medium', 'low']);
const VALID_STATUSES   = new Set(['open', 'in_progress', 'on_hold', 'resolved', 'closed']);
const MAX_PAGE_LIMIT   = 100;

function addHours(date, h) {
  return new Date(new Date(date).getTime() + h * 3600000);
}

function flattenTicket(t) {
  const { assigned_user, creator, ...rest } = t;
  return {
    ...rest,
    assigned_name:  assigned_user?.name  ?? null,
    assigned_email: assigned_user?.email ?? null,
    creator_name:   creator?.name        ?? null,
  };
}

const TICKET_INCLUDE = {
  assigned_user: { select: { name: true, email: true } },
  creator:       { select: { name: true } },
};

async function isValidAssignee(id) {
  if (!id) return false;
  const u = await prisma.user.findUnique({
    where: { id, is_active: true },
    select: { role: true },
  });
  return u?.role === 'technician' || u?.role === 'admin';
}

// Pick least-loaded active technician or admin for round-robin auto-assign
async function autoAssign() {
  const result = await prisma.$queryRaw`
    SELECT u.id, COUNT(t.id)::int AS load
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to = u.id
      AND t.status NOT IN ('resolved','closed')
    WHERE u.role IN ('technician', 'admin') AND u.is_active = true
    GROUP BY u.id
    ORDER BY load ASC, u.id ASC
    LIMIT 1
  `;
  return result[0]?.id ?? null;
}

// List tickets with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, search, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit), MAX_PAGE_LIMIT);
    const offset = (Number(page) - 1) * safeLimit;

    const where = {};
    if (req.user.role === 'user') where.created_by = req.user.id;
    if (status)   where.status   = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) {
      const orClauses = [{ title: { contains: search, mode: 'insensitive' } }];
      const numId = parseInt(search, 10);
      if (!isNaN(numId)) orClauses.push({ id: numId });
      where.OR = orClauses;
    }

    const [total, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: TICKET_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: safeLimit,
      }),
    ]);

    res.json({ tickets: tickets.map(flattenTicket), total, page: Number(page), limit: safeLimit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single ticket with comments
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assigned_user: { select: { name: true, email: true } },
        creator:       { select: { name: true, email: true } },
      },
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const commentWhere = { ticket_id: ticket.id };
    if (req.user.role === 'user') commentWhere.is_internal = false;

    const comments = await prisma.ticketComment.findMany({
      where: commentWhere,
      include: { user: { select: { name: true, role: true } } },
      orderBy: { created_at: 'asc' },
    });

    const flatComments = comments.map(({ user, ...c }) => ({
      ...c,
      author_name: user.name,
      author_role: user.role,
    }));

    const { assigned_user, creator, ...rest } = ticket;
    res.json({
      ...rest,
      assigned_name:  assigned_user?.name  ?? null,
      assigned_email: assigned_user?.email ?? null,
      creator_name:   creator?.name        ?? null,
      creator_email:  creator?.email       ?? null,
      comments: flatComments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create ticket
router.post('/', async (req, res) => {
  try {
    const {
      title, description = '', category = 'Other', subcategory = '',
      priority = 'medium', assigned_to, auto_assign,
    } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (title.trim().length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer' });
    if (description.length > 10000) return res.status(400).json({ error: 'Description must be 10,000 characters or fewer' });
    if (priority && !VALID_PRIORITIES.has(priority)) return res.status(400).json({ error: 'Invalid priority' });

    const now = new Date();
    const responseDue  = addHours(now, SLA[priority]?.response   ?? 8);
    const resolutionDue = addHours(now, SLA[priority]?.resolution ?? 24);

    // Users cannot choose their assignee — always auto-assign
    let assignee = null;
    if (req.user.role !== 'user' && assigned_to) {
      const candidateId = Number(assigned_to);
      if (!(await isValidAssignee(candidateId))) {
        return res.status(400).json({ error: 'Assignee must be an active technician or admin' });
      }
      assignee = candidateId;
    }
    if (!assignee && (auto_assign || req.user.role === 'user')) {
      assignee = await autoAssign();
    }

    const ticket = await prisma.ticket.create({
      data: {
        title, description, category, subcategory, priority,
        status: 'open',
        assigned_to: assignee,
        created_by: req.user.id,
        created_at: now,
        updated_at: now,
        response_due: responseDue,
        resolution_due: resolutionDue,
      },
    });

    if (assignee) {
      const assigneeUser = await prisma.user.findUnique({ where: { id: assignee }, select: { name: true, email: true } });
      const who = assigneeUser?.name ?? 'someone';
      await prisma.ticketComment.create({
        data: {
          ticket_id: ticket.id,
          user_id: req.user.id,
          content: `Ticket auto-assigned to ${who}`,
          is_internal: true,
        },
      });
      emailService.notifyAssigned(ticket, assigneeUser, req.user.name);
    }

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update ticket
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role === 'user') {
      if (ticket.created_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      const { status, priority, assigned_to } = req.body;
      if (status !== undefined || priority !== undefined || assigned_to !== undefined) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Technicians can reassign any ticket, but can only edit other fields on their own tickets
    if (req.user.role === 'technician') {
      const onlyReassigning = Object.keys(req.body).every(k => k === 'assigned_to');
      if (!onlyReassigning && ticket.assigned_to !== null && ticket.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // End users cannot reassign tickets
    if (req.user.role === 'user' && 'assigned_to' in req.body) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description, category, subcategory, priority, status, assigned_to } = req.body;

    if (title !== undefined && title.trim().length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer' });
    if (description !== undefined && description.length > 10000) return res.status(400).json({ error: 'Description must be 10,000 characters or fewer' });

    if (priority && !VALID_PRIORITIES.has(priority)) return res.status(400).json({ error: 'Invalid priority' });
    if (status   && !VALID_STATUSES.has(status))     return res.status(400).json({ error: 'Invalid status' });

    const now = new Date();
    const newPriority  = priority  ?? ticket.priority;
    const newStatus    = status    ?? ticket.status;
    let newAssigned = ticket.assigned_to;
    if ('assigned_to' in req.body) {
      if (assigned_to) {
        const candidateId = Number(assigned_to);
        if (!(await isValidAssignee(candidateId))) {
          return res.status(400).json({ error: 'Assignee must be an active technician or admin' });
        }
        newAssigned = candidateId;
      } else {
        newAssigned = null;
      }
    }

    let resolved_at           = ticket.resolved_at;
    let sla_resolution_breached = ticket.sla_resolution_breached;
    let first_response_at     = ticket.first_response_at;
    let on_hold_since         = ticket.on_hold_since;

    if (newStatus === 'resolved' && ticket.status !== 'resolved') {
      resolved_at = now;
      sla_resolution_breached = now > ticket.resolution_due;
    } else if (['open', 'in_progress'].includes(newStatus) && ticket.status === 'resolved') {
      resolved_at = null;
      sla_resolution_breached = false;
    }

    if (!first_response_at && newStatus === 'in_progress') {
      first_response_at = now;
    }

    if (newStatus === 'on_hold' && ticket.status !== 'on_hold') {
      on_hold_since = now;
    } else if (newStatus !== 'on_hold') {
      on_hold_since = null;
    }

    let response_due   = ticket.response_due;
    let resolution_due = ticket.resolution_due;
    if (priority && priority !== ticket.priority) {
      response_due   = addHours(ticket.created_at, SLA[priority].response);
      resolution_due = addHours(ticket.created_at, SLA[priority].resolution);
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        title:                title       ?? ticket.title,
        description:          description ?? ticket.description,
        category:             category    ?? ticket.category,
        subcategory:          subcategory ?? ticket.subcategory,
        priority:             newPriority,
        status:               newStatus,
        assigned_to:          newAssigned,
        updated_at:           now,
        resolved_at,
        sla_resolution_breached,
        first_response_at,
        response_due,
        resolution_due,
        on_hold_since,
      },
      include: {
        assigned_user: { select: { name: true } },
        creator:       { select: { name: true } },
      },
    });

    // Log status / assignment changes as internal comments
    const commentInserts = [];
    if (status && status !== ticket.status) {
      commentInserts.push(prisma.ticketComment.create({
        data: {
          ticket_id: ticket.id,
          user_id: req.user.id,
          content: `Status changed from "${ticket.status}" to "${status}"`,
          is_internal: true,
        },
      }));
    }
    if ('assigned_to' in req.body && Number(assigned_to) !== ticket.assigned_to) {
      const who = assigned_to
        ? (await prisma.user.findUnique({ where: { id: Number(assigned_to) }, select: { name: true } }))?.name ?? 'someone'
        : 'unassigned';
      commentInserts.push(prisma.ticketComment.create({
        data: {
          ticket_id: ticket.id,
          user_id: req.user.id,
          content: `Ticket assigned to ${who}`,
          is_internal: true,
        },
      }));
    }
    if (commentInserts.length) await Promise.all(commentInserts);

    // Best-effort email notifications — fire-and-forget, never block the response
    const wasReassigned = 'assigned_to' in req.body
      && assigned_to
      && Number(assigned_to) !== ticket.assigned_to;
    const wasResolved = status
      && (status === 'resolved' || status === 'closed')
      && status !== ticket.status;

    if (wasReassigned) {
      prisma.user.findUnique({ where: { id: Number(assigned_to) }, select: { name: true, email: true } })
        .then(u => emailService.notifyReassigned(updated, u))
        .catch(err => console.error('[email]', err.message));
    }
    if (wasResolved) {
      prisma.user.findUnique({ where: { id: ticket.created_by }, select: { name: true, email: true } })
        .then(u => emailService.notifyResolved(updated, u))
        .catch(err => console.error('[email]', err.message));
    }

    res.json(flattenTicket(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete ticket — admin only
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    await prisma.ticket.delete({ where: { id: ticket.id } });
    console.info(JSON.stringify({ audit: 'TICKET_DELETE', actor: req.user.id, ticketId: id, title: ticket.title, ts: new Date() }));
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment
router.post('/:id/comments', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const { content, is_internal = false } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    if (content.length > 5000) return res.status(400).json({ error: 'Comment must be 5,000 characters or fewer' });

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        created_by: true,
        assigned_to: true,
        creator:       { select: { name: true, email: true } },
        assigned_user: { select: { name: true, email: true } },
      },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const isInternal = req.user.role === 'user' ? false : Boolean(is_internal);

    const [comment] = await prisma.$transaction([
      prisma.ticketComment.create({
        data: {
          ticket_id: ticket.id,
          user_id: req.user.id,
          content: content.trim(),
          is_internal: isInternal,
        },
        include: { user: { select: { name: true, role: true } } },
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { updated_at: new Date() },
      }),
    ]);

    const { user, ...rest } = comment;
    if (!isInternal) {
      emailService.notifyComment(ticket, comment.content, req.user.id);
    }
    res.status(201).json({ ...rest, author_name: user.name, author_role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comment — admin can delete any; others only their own (on their own ticket)
router.delete('/:ticketId/comments/:commentId', async (req, res) => {
  try {
    const ticketId  = Number(req.params.ticketId);
    const commentId = Number(req.params.commentId);
    if (!Number.isInteger(ticketId)  || ticketId  < 1) return res.status(400).json({ error: 'Invalid ticket ID' });
    if (!Number.isInteger(commentId) || commentId < 1) return res.status(400).json({ error: 'Invalid comment ID' });

    const comment = await prisma.ticketComment.findUnique({
      where: { id: commentId },
      include: { ticket: { select: { id: true, created_by: true } } },
    });
    if (!comment || comment.ticket_id !== ticketId) return res.status(404).json({ error: 'Comment not found' });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.ticketComment.delete({ where: { id: commentId } });
    console.info(JSON.stringify({ audit: 'COMMENT_DELETE', actor: req.user.id, commentId, ticketId, ts: new Date() }));
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Merge tickets — admin/technician. Merges one or more source tickets INTO this ticket (target).
router.post('/:id/merge', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'technician') return res.status(403).json({ error: 'Access denied' });

    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId < 1) return res.status(400).json({ error: 'Invalid target ticket ID' });

    const rawIds = Array.isArray(req.body.source_ids) ? req.body.source_ids : [];
    const sourceIds = [...new Set(rawIds.map(Number).filter(n => Number.isInteger(n) && n > 0))];
    if (!sourceIds.length) return res.status(400).json({ error: 'At least one source ticket ID is required' });
    if (sourceIds.includes(targetId)) return res.status(400).json({ error: 'Cannot merge a ticket into itself' });

    const target = await prisma.ticket.findUnique({ where: { id: targetId } });
    if (!target) return res.status(404).json({ error: 'Target ticket not found' });

    const sources = await prisma.ticket.findMany({ where: { id: { in: sourceIds } } });
    if (sources.length !== sourceIds.length) {
      const missing = sourceIds.filter(id => !sources.find(s => s.id === id));
      return res.status(404).json({ error: `Tickets not found: ${missing.join(', ')}` });
    }
    const alreadyMerged = sources.filter(s => s.status === 'closed' && s.merged_into);
    if (alreadyMerged.length) {
      return res.status(400).json({ error: `Already merged: #${alreadyMerged.map(s => s.id).join(', #')}` });
    }

    const now = new Date();
    const sourceLabel = sourceIds.map(id => `#${id}`).join(', ');

    await prisma.$transaction([
      // Move all attachments from every source to target
      prisma.ticketAttachment.updateMany({
        where: { ticket_id: { in: sourceIds } },
        data:  { ticket_id: targetId },
      }),
      // Close all sources and mark merged
      prisma.ticket.updateMany({
        where: { id: { in: sourceIds } },
        data:  { status: 'closed', merged_into: targetId, updated_at: now },
      }),
      // Internal comment on each source
      ...sourceIds.map(sourceId => prisma.ticketComment.create({
        data: {
          ticket_id:   sourceId,
          user_id:     req.user.id,
          content:     `This ticket has been merged into ticket #${targetId} by ${req.user.name}.`,
          is_internal: true,
        },
      })),
      // Single summary comment on target
      prisma.ticketComment.create({
        data: {
          ticket_id:   targetId,
          user_id:     req.user.id,
          content:     `Tickets ${sourceLabel} were merged into this ticket by ${req.user.name}.`,
          is_internal: true,
        },
      }),
      prisma.ticket.update({
        where: { id: targetId },
        data:  { updated_at: now },
      }),
    ]);

    console.info(JSON.stringify({ audit: 'TICKET_MERGE', actor: req.user.id, targetId, sourceIds, ts: now }));
    res.json({ message: `Merged ${sourceIds.length} ticket${sourceIds.length > 1 ? 's' : ''} into this ticket` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

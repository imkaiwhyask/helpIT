const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const SLA = {
  critical: { response: 1, resolution: 4 },
  high:     { response: 4, resolution: 8 },
  medium:   { response: 8, resolution: 24 },
  low:      { response: 24, resolution: 72 },
};

function addHours(date, h) {
  return new Date(new Date(date).getTime() + h * 3600000).toISOString();
}

// List tickets with optional filters
router.get('/', (req, res) => {
  const db = getDb();
  const { status, priority, category, search, page = 1, limit = 20 } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  // Requesters can only see their own tickets
  if (req.user.role === 'user') { where += ' AND t.created_by = ?'; params.push(req.user.id); }

  if (status)   { where += ' AND t.status = ?';   params.push(status); }
  if (priority) { where += ' AND t.priority = ?'; params.push(priority); }
  if (category) { where += ' AND t.category = ?'; params.push(category); }
  if (search)   { where += ' AND (t.title LIKE ? OR CAST(t.id AS TEXT) LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM tickets t ${where}`).get(...params).cnt;

  const rows = db.prepare(`
    SELECT t.*,
           u.name  AS assigned_name,
           u.email AS assigned_email,
           c.name  AS creator_name
    FROM tickets t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ tickets: rows, total, page: Number(page), limit: Number(limit) });
});

// Get single ticket with comments
router.get('/:id', (req, res) => {
  const db = getDb();
  const ticket = db.prepare(`
    SELECT t.*,
           u.name  AS assigned_name,
           u.email AS assigned_email,
           c.name  AS creator_name,
           c.email AS creator_email
    FROM tickets t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  // Requesters can only view their own tickets
  if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Requesters see only public comments; IT staff see all
  const commentFilter = req.user.role === 'user' ? 'AND tc.is_internal = 0' : '';
  const comments = db.prepare(`
    SELECT tc.*, u.name AS author_name, u.role AS author_role
    FROM ticket_comments tc
    JOIN users u ON tc.user_id = u.id
    WHERE tc.ticket_id = ? ${commentFilter}
    ORDER BY tc.created_at ASC
  `).all(req.params.id);

  res.json({ ...ticket, comments });
});

// Pick the least-loaded active technician for round-robin auto-assign
function autoAssign(db) {
  const tech = db.prepare(`
    SELECT u.id, COUNT(t.id) AS load
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to = u.id AND t.status NOT IN ('resolved','closed')
    WHERE u.role IN ('technician','admin') AND u.is_active = 1
    GROUP BY u.id
    ORDER BY load ASC, u.id ASC
    LIMIT 1
  `).get();
  return tech?.id ?? null;
}

// Create ticket
router.post('/', (req, res) => {
  const { title, description = '', category = 'Other', subcategory = '', priority = 'medium', assigned_to, auto_assign } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const now = new Date().toISOString();
  const responseDue = addHours(now, SLA[priority]?.response ?? 8);
  const resolutionDue = addHours(now, SLA[priority]?.resolution ?? 24);

  const db = getDb();

  // Auto-assign: explicit ID wins; if auto_assign flag or no assignee from portal, round-robin
  let assignee = assigned_to || null;
  if (!assignee && (auto_assign || req.user.role === 'user')) {
    assignee = autoAssign(db);
  }

  const result = db.prepare(`
    INSERT INTO tickets
      (title,description,category,subcategory,priority,status,assigned_to,created_by,
       created_at,updated_at,response_due,resolution_due)
    VALUES (?,?,?,?,?,'open',?,?,?,?,?,?)
  `).run(title, description, category, subcategory, priority, assignee, req.user.id, now, now, responseDue, resolutionDue);

  if (assignee) {
    const who = db.prepare('SELECT name FROM users WHERE id=?').get(assignee)?.name ?? 'someone';
    db.prepare('INSERT INTO ticket_comments (ticket_id,user_id,content,is_internal) VALUES (?,?,?,1)')
      .run(result.lastInsertRowid, req.user.id, `Ticket auto-assigned to ${who}`);
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(ticket);
});

// Update ticket
router.put('/:id', (req, res) => {
  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const { title, description, category, subcategory, priority, status, assigned_to } = req.body;
  const now = new Date().toISOString();

  const newTitle       = title       ?? ticket.title;
  const newDesc        = description ?? ticket.description;
  const newCategory    = category    ?? ticket.category;
  const newSubcategory = subcategory ?? ticket.subcategory;
  const newPriority    = priority    ?? ticket.priority;
  const newStatus      = status      ?? ticket.status;
  const newAssigned    = 'assigned_to' in req.body ? (assigned_to || null) : ticket.assigned_to;

  let resolvedAt = ticket.resolved_at;
  let slaResBreached = ticket.sla_resolution_breached;
  let firstResponseAt = ticket.first_response_at;

  if (newStatus === 'resolved' && ticket.status !== 'resolved') {
    resolvedAt = now;
    slaResBreached = now > ticket.resolution_due ? 1 : 0;
  } else if (['open', 'in_progress'].includes(newStatus) && ticket.status === 'resolved') {
    resolvedAt = null;
    slaResBreached = 0;
  }

  if (!firstResponseAt && newStatus === 'in_progress') {
    firstResponseAt = now;
  }

  // Recalculate SLA if priority changed
  let responseDue = ticket.response_due;
  let resolutionDue = ticket.resolution_due;
  if (priority && priority !== ticket.priority) {
    responseDue = addHours(ticket.created_at, SLA[priority].response);
    resolutionDue = addHours(ticket.created_at, SLA[priority].resolution);
  }

  db.prepare(`
    UPDATE tickets SET
      title=?, description=?, category=?, subcategory=?, priority=?, status=?,
      assigned_to=?, updated_at=?, resolved_at=?, sla_resolution_breached=?,
      first_response_at=?, response_due=?, resolution_due=?
    WHERE id=?
  `).run(newTitle, newDesc, newCategory, newSubcategory, newPriority, newStatus,
         newAssigned, now, resolvedAt, slaResBreached,
         firstResponseAt, responseDue, resolutionDue, ticket.id);

  // Log status/assignment changes as internal comments
  if (status && status !== ticket.status) {
    db.prepare('INSERT INTO ticket_comments (ticket_id,user_id,content,is_internal) VALUES (?,?,?,1)')
      .run(ticket.id, req.user.id, `Status changed from "${ticket.status}" to "${status}"`);
  }
  if ('assigned_to' in req.body && assigned_to !== ticket.assigned_to) {
    const who = assigned_to
      ? db.prepare('SELECT name FROM users WHERE id=?').get(assigned_to)?.name ?? 'someone'
      : 'unassigned';
    db.prepare('INSERT INTO ticket_comments (ticket_id,user_id,content,is_internal) VALUES (?,?,?,1)')
      .run(ticket.id, req.user.id, `Ticket assigned to ${who}`);
  }

  const updated = db.prepare(`
    SELECT t.*, u.name AS assigned_name, c.name AS creator_name
    FROM tickets t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(ticket.id);

  res.json(updated);
});

// Delete ticket
router.delete('/:id', (req, res) => {
  const db = getDb();
  const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
  res.json({ message: 'Ticket deleted' });
});

// Add comment
router.post('/:id/comments', (req, res) => {
  const { content, is_internal = 0 } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

  const db = getDb();
  const ticket = db.prepare('SELECT id, created_by FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  // Requesters can only comment on their own tickets and cannot post internal notes
  if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const forcePublic = req.user.role === 'user' ? 0 : (is_internal ? 1 : 0);

  const result = db.prepare(
    'INSERT INTO ticket_comments (ticket_id,user_id,content,is_internal) VALUES (?,?,?,?)'
  ).run(req.params.id, req.user.id, content.trim(), forcePublic);

  const comment = db.prepare(`
    SELECT tc.*, u.name AS author_name, u.role AS author_role
    FROM ticket_comments tc JOIN users u ON tc.user_id = u.id
    WHERE tc.id = ?
  `).get(result.lastInsertRowid);

  // Update ticket updated_at
  db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);

  res.status(201).json(comment);
});

module.exports = router;

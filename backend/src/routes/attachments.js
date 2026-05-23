const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg','image/png','image/gif','image/webp',
      'application/pdf',
      'text/plain','text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip','application/x-zip-compressed',
      'application/json','application/xml',
      'video/mp4',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// List attachments for a ticket
router.get('/tickets/:ticketId/attachments', (req, res) => {
  const db = getDb();
  const ticket = db.prepare('SELECT id, created_by FROM tickets WHERE id = ?').get(req.params.ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role === 'user' && ticket.created_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  const attachments = db.prepare(`
    SELECT a.*, u.name AS uploader_name
    FROM ticket_attachments a
    LEFT JOIN users u ON a.uploaded_by = u.id
    WHERE a.ticket_id = ?
    ORDER BY a.created_at ASC
  `).all(req.params.ticketId);
  res.json(attachments);
});

// Upload attachment to a ticket
router.post('/tickets/:ticketId/attachments', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No valid file uploaded (max 10 MB)' });

  const db = getDb();
  const ticket = db.prepare('SELECT id, created_by FROM tickets WHERE id = ?').get(req.params.ticketId);
  if (!ticket) { fs.unlinkSync(req.file.path); return res.status(404).json({ error: 'Ticket not found' }); }
  if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
    fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: 'Access denied' });
  }

  const result = db.prepare(
    'INSERT INTO ticket_attachments (ticket_id,filename,original_name,size,mimetype,uploaded_by) VALUES (?,?,?,?,?,?)'
  ).run(req.params.ticketId, req.file.filename, req.file.originalname, req.file.size, req.file.mimetype, req.user.id);

  db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.ticketId);

  const attachment = db.prepare('SELECT * FROM ticket_attachments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(attachment);
});

// Download / serve attachment
router.get('/attachments/:id/download', (req, res) => {
  const db = getDb();
  const att = db.prepare(`
    SELECT a.*, t.created_by AS ticket_creator
    FROM ticket_attachments a
    JOIN tickets t ON a.ticket_id = t.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!att) return res.status(404).json({ error: 'Attachment not found' });
  if (req.user.role === 'user' && att.ticket_creator !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  const filePath = path.join(UPLOAD_DIR, att.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

  res.setHeader('Content-Disposition', `attachment; filename="${att.original_name}"`);
  res.setHeader('Content-Type', att.mimetype || 'application/octet-stream');
  res.sendFile(filePath);
});

// Delete attachment
router.delete('/attachments/:id', (req, res) => {
  const db = getDb();
  const att = db.prepare(`
    SELECT a.*, t.created_by AS ticket_creator
    FROM ticket_attachments a
    JOIN tickets t ON a.ticket_id = t.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!att) return res.status(404).json({ error: 'Attachment not found' });
  if (req.user.role === 'user' && att.ticket_creator !== req.user.id) return res.status(403).json({ error: 'Access denied' });

  const filePath = path.join(UPLOAD_DIR, att.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM ticket_attachments WHERE id = ?').run(att.id);
  res.json({ message: 'Attachment deleted' });
});

module.exports = router;

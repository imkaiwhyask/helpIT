const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileType = require('file-type');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf',
  'text/plain','text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip','application/x-zip-compressed',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg','.jpeg','.png','.gif','.webp',
  '.pdf',
  '.txt','.csv',
  '.xls','.xlsx',
  '.doc','.docx',
  '.zip',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(null, false);
    }
    cb(null, true);
  },
});

// List attachments for a ticket
router.get('/tickets/:ticketId/attachments', async (req, res) => {
  try {
    const ticketId = Number(req.params.ticketId);
    if (!Number.isInteger(ticketId) || ticketId < 1) return res.status(400).json({ error: 'Invalid ID' });
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, created_by: true },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attachments = await prisma.ticketAttachment.findMany({
      where: { ticket_id: ticket.id },
      include: { uploader: { select: { name: true } } },
      orderBy: { created_at: 'asc' },
    });

    res.json(attachments.map(({ uploader, ...a }) => ({ ...a, uploader_name: uploader?.name ?? null })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload attachment to a ticket
router.post('/tickets/:ticketId/attachments', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No valid file uploaded (max 10 MB, allowed types only)' });

  // Magic byte validation — verify actual file content matches claimed type
  try {
    const detected = await FileType.fromFile(req.file.path);
    const claimedMime = req.file.mimetype;
    // text/plain and text/csv have no magic bytes — allow them through if extension is valid
    const isTextType = claimedMime === 'text/plain' || claimedMime === 'text/csv';
    if (!isTextType && (!detected || !ALLOWED_MIME_TYPES.has(detected.mime))) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File content does not match its extension' });
    }
  } catch {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Could not verify file type' });
  }

  try {
    const ticketId = Number(req.params.ticketId);
    if (!Number.isInteger(ticketId) || ticketId < 1) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, created_by: true },
    });
    if (!ticket) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied' });
    }

    const [attachment] = await prisma.$transaction([
      prisma.ticketAttachment.create({
        data: {
          ticket_id:     ticket.id,
          filename:      req.file.filename,
          original_name: req.file.originalname,
          size:          req.file.size,
          mimetype:      req.file.mimetype,
          uploaded_by:   req.user.id,
        },
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { updated_at: new Date() },
      }),
    ]);

    res.status(201).json(attachment);
  } catch (err) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download / serve attachment
router.get('/attachments/:id/download', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const att = await prisma.ticketAttachment.findUnique({
      where: { id },
      include: { ticket: { select: { created_by: true } } },
    });

    if (!att) return res.status(404).json({ error: 'Attachment not found' });
    if (req.user.role === 'user' && att.ticket.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.resolve(UPLOAD_DIR, att.filename);
    if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    const safeFilename = encodeURIComponent(att.original_name.replace(/[\r\n]/g, ''));
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeFilename}`);
    res.setHeader('Content-Type', att.mimetype || 'application/octet-stream');
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete attachment
router.delete('/attachments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const att = await prisma.ticketAttachment.findUnique({
      where: { id },
      include: { ticket: { select: { created_by: true } } },
    });

    if (!att) return res.status(404).json({ error: 'Attachment not found' });
    if (req.user.role === 'user' && att.ticket.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.resolve(UPLOAD_DIR, att.filename);
    if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.ticketAttachment.delete({ where: { id: att.id } });
    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

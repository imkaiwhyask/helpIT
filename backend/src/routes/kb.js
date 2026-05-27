const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const FileType = require('file-type');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MAX_KB_LIMIT = 100;

// ── Image upload for KB articles ──────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `kb-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.post('/upload-image', (req, res) => {
  if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });

  uploadImage.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
      const detected = await FileType.fromFile(req.file.path);
      if (!detected || !ALLOWED_IMAGE_MIMES.has(detected.mime)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid file content' });
      }
      res.json({ url: `/api/kb/images/${req.file.filename}` });
    } catch {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
});

// ── Serve KB images ───────────────────────────────────────────────────────────
router.get('/images/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
}

function visibilityWhere(role) {
  if (role === 'user') return { visibility: 'public' };
  return {};
}

// ── List articles ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, visibility } = req.query;
    const safeLimit = Math.min(Number(limit), MAX_KB_LIMIT);
    const offset    = (Number(page) - 1) * safeLimit;

    const where = visibilityWhere(req.user.role);
    // IT staff may filter by specific visibility
    if (visibility && req.user.role !== 'user') {
      const valid = ['draft', 'internal', 'public'];
      if (valid.includes(visibility)) where.visibility = visibility;
    }
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title:   { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags:    { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, articles] = await prisma.$transaction([
      prisma.kbArticle.count({ where }),
      prisma.kbArticle.findMany({
        where,
        select: {
          id: true, title: true, category: true, tags: true,
          visibility: true, view_count: true, created_at: true, updated_at: true,
          author: { select: { name: true } },
          content: true,
        },
        orderBy: { updated_at: 'desc' },
        skip: offset,
        take: safeLimit,
      }),
    ]);

    const rows = articles.map(({ author, content, ...a }) => ({
      ...a,
      author_name: author?.name ?? null,
      excerpt: stripHtml(content).slice(0, 160),
    }));

    res.json({ articles: rows, total, page: Number(page), limit: safeLimit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get single article ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const article = await prisma.kbArticle.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    });

    if (!article) return res.status(404).json({ error: 'Article not found' });
    if (article.visibility !== 'public' && req.user.role === 'user') {
      return res.status(403).json({ error: 'Article not available' });
    }

    await prisma.kbArticle.update({
      where: { id: article.id },
      data: { view_count: { increment: 1 } },
    });

    const { author, ...rest } = article;
    res.json({ ...rest, author_name: author?.name ?? null, view_count: rest.view_count + 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Create article ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });
    const { title, content = '', category = 'General', tags = '', visibility = 'public' } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const validVisibility = ['draft', 'internal', 'public'];
    const vis = validVisibility.includes(visibility) ? visibility : 'public';

    const now = new Date();
    const article = await prisma.kbArticle.create({
      data: {
        title: title.trim(), content, category, tags,
        author_id:   req.user.id,
        is_published: vis === 'public',
        visibility:   vis,
        created_at:   now,
        updated_at:   now,
      },
      include: { author: { select: { name: true } } },
    });

    const { author, ...rest } = article;
    res.status(201).json({ ...rest, author_name: author?.name ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update article ────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const article = await prisma.kbArticle.findUnique({ where: { id } });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const { title, content, category, tags, visibility } = req.body;
    const validVisibility = ['draft', 'internal', 'public'];
    const vis = visibility !== undefined
      ? (validVisibility.includes(visibility) ? visibility : article.visibility)
      : article.visibility;

    const updated = await prisma.kbArticle.update({
      where: { id: article.id },
      data: {
        title:        title        ?? article.title,
        content:      content      ?? article.content,
        category:     category     ?? article.category,
        tags:         tags         ?? article.tags,
        visibility:   vis,
        is_published: vis === 'public',
        updated_at:   new Date(),
      },
      include: { author: { select: { name: true } } },
    });

    const { author, ...rest } = updated;
    res.json({ ...rest, author_name: author?.name ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Delete article ────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const article = await prisma.kbArticle.findUnique({ where: { id } });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    await prisma.kbArticle.delete({ where: { id: article.id } });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

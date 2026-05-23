const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MAX_KB_LIMIT = 100;

// List articles — all roles can read published; IT staff see all
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const isIT = req.user.role !== 'user';
    const safeLimit = Math.min(Number(limit), MAX_KB_LIMIT);
    const offset = (Number(page) - 1) * safeLimit;

    const where = {};
    if (!isIT) where.is_published = true;
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
          is_published: true, view_count: true, created_at: true, updated_at: true,
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
      excerpt: content.slice(0, 160),
    }));

    res.json({ articles: rows, total, page: Number(page), limit: safeLimit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single article (increments view count)
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const article = await prisma.kbArticle.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    });

    if (!article) return res.status(404).json({ error: 'Article not found' });
    if (!article.is_published && req.user.role === 'user') {
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

// Create article (IT staff only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });
    const { title, content = '', category = 'General', tags = '', is_published = true } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const now = new Date();
    const article = await prisma.kbArticle.create({
      data: {
        title: title.trim(), content, category, tags,
        author_id: req.user.id,
        is_published: Boolean(is_published),
        created_at: now,
        updated_at: now,
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

// Update article (IT staff only)
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' });
    const article = await prisma.kbArticle.findUnique({ where: { id } });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const { title, content, category, tags, is_published } = req.body;

    const updated = await prisma.kbArticle.update({
      where: { id: article.id },
      data: {
        title:        title        ?? article.title,
        content:      content      ?? article.content,
        category:     category     ?? article.category,
        tags:         tags         ?? article.tags,
        is_published: is_published !== undefined ? Boolean(is_published) : article.is_published,
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

// Delete article (admin only)
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

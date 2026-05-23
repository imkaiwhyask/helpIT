const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// List articles — all roles can read published; IT staff see all
router.get('/', (req, res) => {
  const db = getDb();
  const { category, search, page = 1, limit = 20 } = req.query;
  const isIT = req.user.role !== 'user';

  let where = isIT ? 'WHERE 1=1' : 'WHERE a.is_published = 1';
  const params = [];

  if (category) { where += ' AND a.category = ?'; params.push(category); }
  if (search)   { where += ' AND (a.title LIKE ? OR a.content LIKE ? OR a.tags LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const offset = (Number(page) - 1) * Number(limit);
  const total = db.prepare(`SELECT COUNT(*) AS cnt FROM kb_articles a ${where}`).get(...params).cnt;

  const rows = db.prepare(`
    SELECT a.id, a.title, a.category, a.tags, a.is_published, a.view_count,
           a.created_at, a.updated_at,
           u.name AS author_name,
           SUBSTR(a.content, 1, 160) AS excerpt
    FROM kb_articles a
    LEFT JOIN users u ON a.author_id = u.id
    ${where}
    ORDER BY a.updated_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ articles: rows, total, page: Number(page), limit: Number(limit) });
});

// Get single article (increments view count)
router.get('/:id', (req, res) => {
  const db = getDb();
  const article = db.prepare(`
    SELECT a.*, u.name AS author_name
    FROM kb_articles a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!article) return res.status(404).json({ error: 'Article not found' });
  if (!article.is_published && req.user.role === 'user') {
    return res.status(403).json({ error: 'Article not available' });
  }

  db.prepare('UPDATE kb_articles SET view_count = view_count + 1 WHERE id = ?').run(article.id);
  res.json({ ...article, view_count: article.view_count + 1 });
});

// Create article (IT staff only)
router.post('/', (req, res) => {
  if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });
  const { title, content = '', category = 'General', tags = '', is_published = 1 } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO kb_articles (title,content,category,tags,author_id,is_published,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'
  ).run(title.trim(), content, category, tags, req.user.id, is_published ? 1 : 0, now, now);

  const article = db.prepare('SELECT a.*, u.name AS author_name FROM kb_articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.id = ?').get(result.lastInsertRowid);
  res.status(201).json(article);
});

// Update article (IT staff only)
router.put('/:id', (req, res) => {
  if (req.user.role === 'user') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();
  const article = db.prepare('SELECT * FROM kb_articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  const { title, content, category, tags, is_published } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE kb_articles SET title=?, content=?, category=?, tags=?, is_published=?, updated_at=? WHERE id=?
  `).run(
    title ?? article.title,
    content ?? article.content,
    category ?? article.category,
    tags ?? article.tags,
    is_published !== undefined ? (is_published ? 1 : 0) : article.is_published,
    now, article.id
  );

  const updated = db.prepare('SELECT a.*, u.name AS author_name FROM kb_articles a LEFT JOIN users u ON a.author_id = u.id WHERE a.id = ?').get(article.id);
  res.json(updated);
});

// Delete article (admin only)
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const db = getDb();
  const article = db.prepare('SELECT id FROM kb_articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  db.prepare('DELETE FROM kb_articles WHERE id = ?').run(article.id);
  res.json({ message: 'Article deleted' });
});

module.exports = router;

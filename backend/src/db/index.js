const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/helpit.db');

function flatParams(args) {
  if (args.length === 0) return [];
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return [...args];
}

class Database {
  constructor(sqlJs, buffer) {
    this._db = buffer ? new sqlJs.Database(buffer) : new sqlJs.Database();
    this._inTx = false;
  }

  pragma(str) {
    this._db.run(`PRAGMA ${str}`);
    return this;
  }

  exec(sql) {
    // run each non-empty statement individually to avoid edge cases
    const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of stmts) this._db.run(stmt);
    return this;
  }

  withTransaction(fn) {
    this._db.run('BEGIN');
    this._inTx = true;
    try {
      fn();
      this._db.run('COMMIT');
    } catch (e) {
      this._db.run('ROLLBACK');
      throw e;
    } finally {
      this._inTx = false;
    }
    this._save();
  }

  prepare(sql) {
    const self = this;
    return {
      get(...args) {
        const params = flatParams(args);
        const stmt = self._db.prepare(sql);
        if (params.length) stmt.bind(params);
        const has = stmt.step();
        const row = has ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },
      all(...args) {
        const params = flatParams(args);
        const rows = [];
        const stmt = self._db.prepare(sql);
        if (params.length) stmt.bind(params);
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
      run(...args) {
        const params = flatParams(args);
        if (params.length) {
          self._db.run(sql, params);
        } else {
          self._db.run(sql);
        }
        const res = self._db.exec('SELECT last_insert_rowid()');
        const lastInsertRowid = res[0]?.values[0]?.[0] ?? 0;
        if (!self._inTx) self._save();
        return { lastInsertRowid };
      },
    };
  }

  _save() {
    const data = this._db.export();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

let _db;

async function initDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const buffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
  _db = new Database(SQL, buffer);

  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function getDb() {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

function initSchema(db) {
  const d = db._db;

  d.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician',
    department TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  d.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Other',
    subcategory TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    response_due DATETIME NOT NULL,
    resolution_due DATETIME NOT NULL,
    first_response_at DATETIME,
    sla_response_breached INTEGER NOT NULL DEFAULT 0,
    sla_resolution_breached INTEGER NOT NULL DEFAULT 0
  )`);

  d.run(`CREATE TABLE IF NOT EXISTS ticket_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  d.run(`CREATE TABLE IF NOT EXISTS ticket_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    mimetype TEXT DEFAULT '',
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  d.run(`CREATE TABLE IF NOT EXISTS kb_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'General',
    tags TEXT DEFAULT '',
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_published INTEGER NOT NULL DEFAULT 1,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

module.exports = { initDb, getDb };

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { prisma } = require('./db');

const { checkConfig: checkEmailConfig } = require('./services/emailService');

const authRoutes       = require('./routes/auth');
const usersRoutes      = require('./routes/users');
const ticketsRoutes    = require('./routes/tickets');
const dashboardRoutes  = require('./routes/dashboard');
const kbRoutes         = require('./routes/kb');
const attachmentRoutes = require('./routes/attachments');
const reportsRoutes    = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Trust the first proxy (nginx) so rate limiters use real client IP
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// HTTP request logging
app.use(morgan(isProd ? 'combined' : 'dev'));

// GZIP compression
app.use(compression());

// CORS — requires CORS_ORIGIN in production
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

// Cookie parser
app.use(cookieParser());

// Body limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global rate limiter — 300 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use('/api', globalLimiter);

// Serve uploaded files (attachments + KB images)
const UPLOAD_DIR = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check — no auth required, used by Docker/k8s
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/tickets',   ticketsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/kb',        kbRoutes);
app.use('/api',           attachmentRoutes);
app.use('/api/reports',   reportsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
});

const server = app.listen(PORT, () => {
  console.log(`HelpIT API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  checkEmailConfig();
});

// Auto-close tickets that have been on_hold for more than 8 hours
async function autoCloseOnHoldTickets() {
  try {
    const cutoff = new Date(Date.now() - 8 * 3600 * 1000);
    const stale = await prisma.ticket.findMany({
      where: { status: 'on_hold', on_hold_since: { lt: cutoff } },
      select: { id: true },
    });
    if (!stale.length) return;
    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { id: { in: stale.map(t => t.id) } },
        data:  { status: 'closed', updated_at: new Date() },
      }),
      ...stale.map(t => prisma.ticketComment.create({
        data: {
          ticket_id:   t.id,
          user_id:     1, // system — fallback to first admin; comment is marked internal
          content:     'Ticket automatically closed after being on hold for more than 8 hours.',
          is_internal: true,
        },
      })),
    ]);
    console.info(JSON.stringify({ audit: 'AUTO_CLOSE_ON_HOLD', count: stale.length, ids: stale.map(t => t.id), ts: new Date() }));
  } catch (err) {
    console.error('[auto-close]', err.message);
  }
}

// Run on startup then every 30 minutes
autoCloseOnHoldTickets();
const autoCloseInterval = setInterval(autoCloseOnHoldTickets, 30 * 60 * 1000);

async function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully`);
  clearInterval(autoCloseInterval);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force exit if not done in 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

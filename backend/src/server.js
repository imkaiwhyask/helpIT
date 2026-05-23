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

// Rate limiting on auth endpoints — 10 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/tickets',   ticketsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/kb',        kbRoutes);
app.use('/api',           attachmentRoutes);
app.use('/api/reports',   reportsRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
});

const server = app.listen(PORT, () => {
  console.log(`HelpIT API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

async function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force exit if not done in 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

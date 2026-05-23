const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const ticketsRoutes = require('./routes/tickets');
const dashboardRoutes = require('./routes/dashboard');
const kbRoutes = require('./routes/kb');
const attachmentRoutes = require('./routes/attachments');
const reportsRoutes = require('./routes/reports');

async function main() {
  await initDb();
  console.log('Database ready');

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/tickets', ticketsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/kb', kbRoutes);
  app.use('/api', attachmentRoutes);
  app.use('/api/reports', reportsRoutes);

  // Serve uploaded files (for inline image previews)
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.listen(PORT, () => {
    console.log(`HelpIT API running on http://localhost:${PORT}`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });

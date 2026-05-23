const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      // Append pool settings if not already in the URL
      url: (() => {
        const base = process.env.DATABASE_URL || '';
        if (base.includes('connection_limit')) return base;
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}connection_limit=20&pool_timeout=10`;
      })(),
    },
  },
});

module.exports = { prisma };

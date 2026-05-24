# helpIT — IT Service Desk

A full-stack IT helpdesk and ticketing system for small-to-medium IT teams. Supports three distinct roles (Admin, Technician, End User), automatic SLA tracking, a self-service portal, and a knowledge base.

---

## Features

- **Role-based access** — Admin, Technician, and End User portals with separate layouts and enforced server-side permissions
- **Ticket management** — Create, assign, update, comment, and close tickets with full activity history
- **SLA engine** — Automatically sets response and resolution deadlines by priority:

  | Priority | Response | Resolution |
  |----------|----------|------------|
  | Critical | 1 hour   | 4 hours    |
  | High     | 4 hours  | 8 hours    |
  | Medium   | 8 hours  | 24 hours   |
  | Low      | 24 hours | 72 hours   |

- **Auto-assign** — Round-robin assignment to the least-loaded active technician on ticket creation
- **Dashboard** — Live stats, SLA compliance chart (7-day), status/priority breakdown, recent tickets
- **Knowledge Base** — IT staff can publish articles; end users can read and search them
- **Reports** — Technician performance metrics and ticket trend charts
- **File attachments** — Upload images, PDFs, Office docs, and ZIPs (10 MB limit, magic-byte validated)
- **Account lockout** — Accounts lock for 30 minutes after 5 failed login attempts
- **Remember me** — Optional persistent session: 30-day cookie vs. 8-hour default
- **Forced password change** — New accounts must set a new password (≥ 12 characters) on first login
- **Self-service portal** — End users submit tickets, track progress, and read KB articles without accessing the IT console

---

## Tech Stack

| Layer        | Technologies                                          |
|--------------|-------------------------------------------------------|
| **Frontend** | Vue 3, Vite, Element Plus, Pinia, ApexCharts, Vue Router |
| **Backend**  | Node.js, Express, Prisma ORM                          |
| **Database** | PostgreSQL 16                                         |
| **Auth**     | JWT via httpOnly cookie                               |
| **Infra**    | Docker, Docker Compose, Nginx (frontend)              |

---

## Quick Start

### Option 1 — Docker Compose (recommended)

**Prerequisites:** Docker and Docker Compose installed.

1. Clone the repo:

   ```bash
   git clone https://github.com/imkaiwhyask/helpIT.git
   cd helpIT
   ```

2. Create a `.env` file in the project root:

   ```env
   DB_USER=helpit
   DB_PASSWORD=change_me_strong_password
   DB_NAME=helpit
   JWT_SECRET=generate_a_64_char_random_hex_string_here
   CORS_ORIGIN=http://localhost
   PORT=80
   ```

3. Start all services:

   ```bash
   docker compose up -d
   ```

   The backend automatically runs `prisma migrate deploy` on startup.

4. Open **http://localhost** in your browser.

To stop: `docker compose down`
To stop and wipe data: `docker compose down -v`

---

### Option 2 — Local Development

**Prerequisites:** Node.js v18+, PostgreSQL 16 running locally.

#### Backend

1. Create `backend/.env`:

   ```env
   DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/helpit"
   JWT_SECRET="generate_a_64_char_random_hex_string_here"
   PORT=3001
   NODE_ENV=development
   ```

2. Install dependencies and run migrations:

   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   ```

3. Seed demo accounts (**development only** — blocked in production):

   ```bash
   npm run seed
   ```

4. Start the dev server:

   ```bash
   npm run dev   # http://localhost:3001
   ```

#### Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Open **http://localhost:5173**.

---

## Environment Variables

| Variable      | Required | Description                                                       |
|---------------|----------|-------------------------------------------------------------------|
| `DATABASE_URL`| Yes      | PostgreSQL connection string                                      |
| `JWT_SECRET`  | Yes      | Secret for signing JWTs — use a long random string in production  |
| `PORT`        | No       | API port (default: `3001`)                                        |
| `NODE_ENV`    | No       | Set to `production` to enable secure cookies and harden responses |
| `CORS_ORIGIN` | No       | Allowed frontend origin (default: `http://localhost:5173`)        |

Docker Compose also reads these variables from the root `.env`:

| Variable      | Description                                 |
|---------------|---------------------------------------------|
| `DB_USER`     | PostgreSQL username (default: `helpit`)     |
| `DB_PASSWORD` | PostgreSQL password — **required**          |
| `DB_NAME`     | Database name (default: `helpit`)           |

---

## Demo Accounts

Created by `npm run seed` (development only):

| Email                  | Password   | Role      | Access                          |
|------------------------|------------|-----------|---------------------------------|
| `admin@helpit.local`   | `admin123` | Admin     | Full access — users, all tickets, reports |
| `user@helpit.local`    | `user1234` | End User  | Self-service portal only        |

> All seeded accounts have `must_change_password = true`, so you will be prompted to set a new password (≥ 12 characters) immediately after first login.

> Create Technician accounts from the User Management page after logging in as Admin. New accounts created via User Management also require a password change on first login.

---

## Role Permissions

| Action                        | Admin | Technician | End User |
|-------------------------------|-------|------------|----------|
| View all tickets              | Yes   | Yes        | Own only |
| Create tickets                | Yes   | Yes        | Yes      |
| Update ticket status/priority | Yes   | Yes (owned)| No       |
| Reassign tickets              | Yes   | Yes (owned)| No       |
| Delete tickets                | Yes   | No         | No       |
| Internal comments             | Yes   | Yes        | No       |
| Manage users                  | Yes   | No         | No       |
| View reports & dashboard      | Yes   | Yes        | No       |
| Create/edit KB articles       | Yes   | Yes        | No       |
| Delete KB articles            | Yes   | No         | No       |

---

## Project Structure

```
helpIT/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js        # Prisma client + connection pool
│   │   │   └── seed.js         # Demo data seeder (dev only)
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT cookie middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # Login, logout, /me
│   │   │   ├── tickets.js      # Tickets CRUD + comments
│   │   │   ├── users.js        # User management (admin)
│   │   │   ├── attachments.js  # File upload/download
│   │   │   ├── dashboard.js    # Stats endpoint
│   │   │   ├── reports.js      # Trends + technician metrics
│   │   │   └── kb.js           # Knowledge base CRUD
│   │   └── server.js           # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── uploads/                # Uploaded attachments (gitignored)
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js              # Axios instance
│   │   ├── router/             # Vue Router (role-based guards)
│   │   ├── stores/             # Pinia stores (auth)
│   │   ├── components/         # AppLayout, Sidebar, Header, etc.
│   │   └── views/
│   │       ├── portal/         # Self-service portal views
│   │       └── *.vue           # IT/Admin views
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

**Made by [imkaiwhyask](https://github.com/imkaiwhyask)**

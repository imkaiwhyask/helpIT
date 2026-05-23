# helpIT – IT Service Desk

A full-stack IT ticketing system built with Vue 3 + Node.js/Express + SQLite (sql.js).

## Stack
- **Frontend**: Vue 3, Vite, Element Plus, ApexCharts, Pinia, Vue Router
- **Backend**: Node.js, Express, sql.js (WebAssembly SQLite), JWT auth

## Quick Start

### 1. Backend
```bash
cd backend
npm install
npm run seed     # seed demo data
npm run dev      # starts on http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev      # starts on http://localhost:5173
```

Open **http://localhost:5173** and log in with:
- Email: `admin@helpit.local`
- Password: `admin123`

## Features
- **Dashboard** — stat cards, SLA compliance chart (7 days), status donut, priority bar, recent tickets
- **Tickets** — list with search/filter, SLA status, create/view/edit/close tickets, comments & activity log
- **User Management** — create and delete users, role-based (Admin / Technician)
- **SLA Engine** — auto-calculates response/resolution due dates per priority (Critical 4h, High 8h, Medium 24h, Low 72h)

## Default Users
| Email | Password | Role |
|-------|----------|------|
| admin@helpit.local | admin123 | Admin |
| john.doe@helpit.local | pass123 | Technician |
| jane.smith@helpit.local | pass123 | Technician |
| mark.wilson@helpit.local | pass123 | Technician |

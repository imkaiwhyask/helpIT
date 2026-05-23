# helpIT – IT Service Desk

> A clean and modern full-stack IT ticketing / helpdesk system.

helpIT is a functional IT Service Desk application built to manage support tickets, track SLAs, and handle team roles efficiently. It features a responsive dashboard, ticket management with activity logging, and an automatic SLA engine.

## ✨ Features

- **Dashboard** — Statistics cards, SLA compliance chart, status donut, priority breakdown, and recent tickets
- **Ticket Management** — Create, view, edit, comment, and close tickets with full activity history
- **Smart SLA Engine** — Automatically calculates response and resolution due dates based on priority:
  - **Critical**: 4 hours
  - **High**: 8 hours
  - **Medium**: 24 hours
  - **Low**: 72 hours
- **User Management** — Create and manage users with role-based access (`Admin` / `Technician`)
- **Search & Filtering** on the tickets list
- Clean UI powered by **Element Plus**

## 🛠 Tech Stack

| Layer        | Technologies                                                          |
| ------------ | --------------------------------------------------------------------- |
| **Frontend** | Vue 3, Vite, Element Plus, ApexCharts, Pinia, Vue Router              |
| **Backend**  | Node.js, Express, sql.js (SQLite via WebAssembly), JWT Authentication |

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/imkaiwhyask/helpIT.git
cd helpIT
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run seed     # Seed demo data + default users
npm run dev      # Runs on http://localhost:3001
```

### 3. Start the Frontend (in a new terminal)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev      # Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## 👥 Default Demo Accounts

| Email                    | Password | Role       |
| ------------------------ | -------- | ---------- |
| admin@helpit.local       | admin123 | **Admin**  |
| john.doe@helpit.local    | pass123  | Technician |
| jane.smith@helpit.local  | pass123  | Technician |
| mark.wilson@helpit.local | pass123  | Technician |

> **Note:** This project uses `sql.js` (in-memory SQLite). All data will reset when the backend server restarts. The `npm run seed` command re-populates demo data.

## 📸 Screenshots

_Add screenshots here (Dashboard, Ticket List, Ticket Detail, User Management)_

## 📁 Project Structure

```
helpIT/
├── backend/                 # Express API + sql.js
│   ├── src/
│   ├── seed.js
│   └── package.json
├── frontend/                # Vue 3 + Vite
│   ├── src/
│   ├── components/
│   └── package.json
└── README.md
```

## 🔧 Configuration

- Backend runs on port `3001`
- Frontend runs on port `5173`
- JWT secret is currently set in code (recommended to move to environment variables for production use)

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a pull request.

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

**Made by [imkaiwhyask](https://github.com/imkaiwhyask)**

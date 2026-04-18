# Sentinel API

**Sentinel API** is a full-stack **real-time API reliability monitoring** platform. Developers register public HTTP endpoints, run automated health checks on a schedule, detect degradation and outages, persist history in PostgreSQL, and receive email alerts when status changes. A React dashboard summarizes live status, uptime, response times, and charts recent latency.

This repository is a **portfolio project** built by **Andrew Nnani**.

---

## Live demo

| Layer | URL |
| --- | --- |
| **Frontend** (Vercel) | [https://sentinel-api-xi.vercel.app](https://sentinel-api-xi.vercel.app) |
| **Backend** (Render) | [https://sentinel-api-5cf7.onrender.com](https://sentinel-api-5cf7.onrender.com) |

Health check: `GET https://sentinel-api-5cf7.onrender.com/api/health`

---

## Screenshots

> _Add screenshots here after deployment._

| Area | Placeholder |
| --- | --- |
| Dashboard | `![Dashboard](./docs/screenshots/dashboard.png)` |
| Add endpoint form | `![Add endpoint](./docs/screenshots/add-endpoint.png)` |

_Create a `docs/screenshots/` folder, drop images in, and uncomment or replace the markdown image links above._

---

## Tech stack

| Category | Technologies |
| --- | --- |
| **Runtime & API** | Node.js, Express.js |
| **Database** | PostgreSQL ([Neon](https://neon.tech)) |
| **Scheduler** | node-cron |
| **HTTP client (checks)** | node-fetch |
| **Email alerts** | Nodemailer (Gmail SMTP) |
| **Frontend** | React (Vite), Axios, Recharts |
| **Hosting** | Render (API), Vercel (SPA) |
| **Config** | dotenv |

---

## Architecture overview

The system is organized into **four layers**:

1. **Ingestion & monitoring**  
   Scheduled jobs (`node-cron`) and manual triggers call `monitorService`: HTTP requests to registered URLs, timing, status classification (UP / DEGRADED / DOWN), and optional alert evaluation (`alertService` + Nodemailer).

2. **Database**  
   Neon-hosted PostgreSQL stores endpoints, health check history, alert records, and derived-friendly aggregates used by analytics queries. Raw SQL via the `pg` driver (no ORM).

3. **API**  
   Express exposes REST routes for CRUD on endpoints, manual checks, health, dashboard summaries, per-endpoint stats/history, and JSON error handling.

4. **Client**  
   The Vite React app calls the API (via `VITE_API_URL` in production), shows a dashboard with cards and charts, polls on an interval, and includes a form to register new endpoints.

```text
[ Browser ]  --HTTPS-->  [ Vercel: React SPA ]
                              |
                              v
[ Render: Express API ]  <----  Axios (VITE_API_URL)
      |         |
      |         +--> [ Neon PostgreSQL ]
      |
      +--> [ node-cron ] --> monitorService --> outbound HTTP checks
      |
      +--> [ Nodemailer ] --> Gmail SMTP (alerts)
```

---

## Features

- Register endpoints (URL, HTTP method, check interval, optional alert email).
- Scheduled health checks per endpoint interval; dynamic scheduling when endpoints are added or removed.
- Manual health check trigger for any endpoint.
- Status rules: UP (2xx and fast), DEGRADED (2xx but slow), DOWN (errors or non-2xx).
- Email alerts for DOWN, sustained DEGRADED, and recovery; alert history stored in the database.
- Dashboard API and UI: current status, uptime %, average response time, last check time.
- Per-endpoint history for charts (e.g. response time over the last 24 hours on the frontend).
- PostgreSQL schema with cascading deletes for clean endpoint removal.

---

## Project structure (high level)

```text
sentinel-api/
├── backend/                 # Express API
│   └── src/
│       ├── config/          # DB pool
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/        # monitor, alerts, DB queries
│       ├── scheduler/       # cron jobs
│       └── index.js
├── frontend/                # Vite + React
│   └── src/
│       ├── components/
│       ├── hooks/
│       └── services/        # Axios client (VITE_API_URL)
└── README.md
```

---

## Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- A **Neon** (or compatible) PostgreSQL database and connection string
- For local email testing: a Gmail account with an **app password** (optional)

---

## How to run locally

### 1. Database

Create a database and run the schema (e.g. in Neon SQL Editor). Schema file:

`backend/sql/schema.sql`

### 2. Backend

```bash
cd backend
cp .env.example .env   # if you maintain one; otherwise create .env (see below)
npm install
npm run start
```

Default API URL: `http://localhost:3000`

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` (optional for local; defaults work if API is on port 3000):

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

---

## API reference

Base URL (local): `http://localhost:3000`  
Base URL (production): `https://sentinel-api-5cf7.onrender.com`

All JSON bodies use `Content-Type: application/json` unless noted.

### Health

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness: `{ "status": "ok" }` |

### Endpoints (CRUD + analytics)

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/endpoints` | Create endpoint. Body: `name`, `url`, optional `method`, `checkIntervalMinutes`, `alertEmail`. |
| `GET` | `/api/endpoints` | List all endpoints. |
| `GET` | `/api/endpoints/:id` | Single endpoint (includes recent check summary in response). |
| `PUT` | `/api/endpoints/:id` | Update fields (e.g. `name`, `url`, `method`, `checkIntervalMinutes`, `alertEmail`, `isActive`). |
| `DELETE` | `/api/endpoints/:id` | Delete endpoint and related data. |
| `GET` | `/api/endpoints/:id/stats` | Uptime %, average response time, total checks. |
| `GET` | `/api/endpoints/:id/history` | Recent health checks (up to 100) for charting. |

### Checks & dashboard

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/checks/:endpointId` | Run one health check now; returns saved check row. |
| `GET` | `/api/dashboard` | Summary row per endpoint: status, uptime, averages, last check. |

### Root

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Short JSON message that the API is running. |

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon). |
| `PORT` | No | Server port (default `3000`). |
| `GMAIL_USER` | For email | Gmail address used to send alerts. |
| `GMAIL_APP_PASSWORD` | For email | Gmail app password (not your normal login password). |
| `ALERT_COOLDOWN_MINUTES` | No | Reserved for alert throttling / future use (e.g. `30`). |

Never commit real `.env` files. Use `.gitignore` and secrets only in Render/hosting dashboards.

### Frontend (`frontend/.env` / Vercel)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Recommended in prod | Backend base URL, e.g. `https://sentinel-api-5cf7.onrender.com`. If unset, the app falls back to `http://localhost:3000` (local dev). |

---

## Deployment notes (short)

- **Render (backend):** Set `DATABASE_URL`, `PORT` (often provided), Gmail vars, and start command e.g. `node src/index.js` or `npm start` from `backend/`.
- **Vercel (frontend):** Set `VITE_API_URL` to the Render API URL. Ensure Render CORS allows your Vercel origin (the app uses `cors` with `origin: true` for flexibility).

---

## License / author

Portfolio project by **Andrew Nnani**. Use and learn from the code; attribution is appreciated if you fork or showcase it.

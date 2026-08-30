# SupportFlow

**AI-Powered Support. Human-Driven Resolution.**

SupportFlow is a full-stack, AI-assisted customer-support ticket management platform.
A customer submits a ticket, an AI triage engine suggests a **category, priority and
summary**, a human agent reviews and finalizes that classification, and customer and
agent then resolve the issue through a **real-time conversation** — with every dashboard
statistic computed live from the database.

Built for the **AI Factory 2.0 — SupportFlow** hackathon.

---

## Table of contents

1. [The workflow](#the-workflow)
2. [Feature list](#feature-list)
3. [Tech stack](#tech-stack)
4. [Architecture](#architecture)
5. [Repository layout](#repository-layout)
6. [Prerequisites](#prerequisites)
7. [Setup & run (step by step)](#setup--run-step-by-step)
8. [Environment variables](#environment-variables)
9. [Demo accounts](#demo-accounts)
10. [User procedure / how to use the app](#user-procedure--how-to-use-the-app)
11. [Hackathon demo script](#hackathon-demo-script)
12. [REST API reference](#rest-api-reference)
13. [Real-time (Socket.IO) events](#real-time-socketio-events)
14. [Database schema](#database-schema)
15. [AI triage engine](#ai-triage-engine)
16. [Security](#security)
17. [Deployment](#deployment)
18. [Troubleshooting](#troubleshooting)
19. [AI tools used](#ai-tools-used)

---

## The workflow

```
Customer submits ticket
      │
      ▼
AI analyses / triages ticket  ──►  suggests Category + Priority + Summary
      │
      ▼
Human agent reviews / edits the AI suggestion   (AI is never the final word)
      │
      ▼
Agent accepts  ──►  final Category + Priority stored, ticket marked "human reviewed"
      │
      ▼
Agent assigns ticket to self  (New → Assigned)
      │
      ▼
Customer ↔ Agent exchange messages in real time  (Socket.IO)
      │
      ▼
Agent advances status  (Assigned → In Progress)
      │
      ▼
Agent writes a resolution note  ──►  Resolve  (In Progress → Resolved)
      │
      ▼
Customer sees "Resolved" live · dashboard statistics recompute from MongoDB
```

---

## Feature list

### Authentication & accounts
- Email + password **sign up** with a **role picker** (Customer or Support Agent).
- **Confirm-password** field with client-side match validation.
- **Show / hide password** eye toggle on every password field (login & signup).
- After sign up the user is sent to the **login page** to sign in explicitly
  (no silent auto-login).
- **JWT** sessions (bcrypt-hashed passwords), persisted in the browser; the token is
  re-validated against `/auth/me` on every app load and cleared on 401.
- Demo accounts and one-click **"Use Customer / Agent / Admin"** buttons on the login page.

### Ticketing
- Customers create tickets with **subject, description and an optional category**.
- Every ticket gets a **unique, human-readable number** — `SF-2026-000001` — generated
  atomically from a per-year counter.
- Enforced status workflow: **New → Assigned → In Progress → Resolved**, plus an explicit
  **Reopen** action (Resolved → In Progress). Illegal jumps are rejected by the server.
- **Resolution rule:** a ticket cannot be resolved without a non-empty resolution note;
  the resolution is also posted into the conversation.
- Resolved tickets are locked against normal edits until reopened.

### AI triage
- On creation the ticket is sent to a **backend triage engine** that returns a structured
  `{ category, priority, summary }`.
- The result is **validated with Zod** before it is stored — invalid output is never
  persisted.
- AI values are stored on **separate fields** (`aiCategory`, `aiPriority`, `aiSummary`)
  and flagged **"AI Suggested — Human Review Required"**.
- The agent's **AI Review Panel** lets them edit category / priority / summary and
  **Accept**, which writes the final `category` / `priority` and sets `aiReviewed = true`.
- **Re-run AI** button to re-triage at any time.
- **Failure is non-blocking:** if triage throws, the ticket is still created, an `aiError`
  is recorded, sensible defaults are applied, and the UI shows
  *"AI triage is temporarily unavailable — you can classify this ticket manually."*
- A staged **"AI is analysing your ticket…"** animation
  (Reading → Identifying category → Assessing priority → Generating summary).

### Real-time
- **Socket.IO** connection authenticated with the same JWT as the REST API.
- Per-ticket rooms; joining a room is access-checked server-side.
- Live events: **new message**, **status changed**, **ticket updated**, **ticket created**
  (the last for agent dashboards).
- New messages and status changes appear **without a page refresh**; a **Live / Offline**
  indicator on the ticket page; automatic reconnection; messages de-duplicated by id.
- Every message is **persisted in MongoDB** — Socket.IO is delivery only.

### Dashboards (statistics come from live DB aggregation, never hard-coded)
- **Customer:** total / new / in-progress / resolved / active tickets, recent tickets,
  prominent **Create New Ticket** button.
- **Agent:** assigned / new / assigned / in-progress / resolved / high-priority counts,
  an unassigned-queue banner, recent activity, live-refreshing on socket events.
- **Admin:** totals plus **by status / by priority / by category** bar charts, user &
  agent counts, and the full agent view underneath.

### Agent workspace
- Ticket list with **filters** (status, priority, category), **"assigned to me"** toggle,
  and **search** by ticket number, subject or customer name (debounced).
- Ticket detail: header badges, description, status **timeline**, conversation, ticket
  info, AI review panel, and an agent action panel (assign / advance / resolve / reopen).

### UI / UX
- Premium **black + shiny-gold** design system.
- Real **Dark / Light mode** toggle — persisted to `localStorage`, respects the OS
  preference on first visit, no flash on load, applied to every surface.
- **Fully responsive** from 320 px up — tables collapse to cards on mobile, the sidebar
  becomes a drawer, forms go full-width.
- Loading, success, error and empty states everywhere; toast notifications;
  accessible semantic markup, labelled inputs, visible focus rings, keyboard-usable
  modals.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, React Hook Form + Zod, Zustand, lucide-react, socket.io-client, axios |
| Backend   | Node.js, Express, TypeScript, REST, Socket.IO, `tsx` runtime |
| Database  | MongoDB + Mongoose |
| Auth      | `jsonwebtoken` (JWT), `bcryptjs`, role-based authorization middleware |
| Validation| Zod — request bodies, query params **and** AI output |
| AI triage | Local deterministic heuristic engine (offline, no API key); same Zod-validated contract a remote LLM would use |

Deliberately **not** included (kept simple on purpose): Redis, job queues, Docker,
CI/CD pipelines, GraphQL.

---

## Architecture

```
┌─────────────┐   REST (axios, JWT)     ┌──────────────┐    Mongoose     ┌──────────┐
│  Next.js    │ ──────────────────────► │  Express API │ ──────────────► │ MongoDB  │
│  frontend   │ ◄────────────────────── │              │ ◄────────────── │          │
│             │      JSON responses     │  routes      │                 └──────────┘
│  Zustand    │                         │  controllers │
│  (auth,     │   Socket.IO (JWT auth)  │  services ───┼──► Local AI triage engine
│   toasts)   │ ◄══════════════════════►│  middleware  │      { category, priority,
│             │   new-message /         │  sockets     │        summary } → Zod
└─────────────┘   ticket-status-updated └──────────────┘        validation
```

- The **frontend never calls the AI engine** and never holds any secret.
- The API validates the JWT on **every** protected REST request **and** on **every**
  socket connection, then re-checks ticket ownership before returning or mutating data.
- MongoDB is the source of truth for messages and status; Socket.IO only broadcasts.

---

## Repository layout

```
supportflow/
├── backend/
│   ├── src/
│   │   ├── config/        env validation, db connection (with retry), CORS policy
│   │   ├── controllers/   auth · ticket · message · dashboard
│   │   ├── middleware/     requireAuth / requireRole · validate (Zod) · error handler
│   │   ├── models/         User · Ticket · Message · Counter
│   │   ├── routes/         REST route definitions (+ DB-ready guard)
│   │   ├── services/       ai.service · message.service · ticketAccess · token · ticketNumber
│   │   ├── sockets/        Socket.IO init, JWT auth, rooms, emit helpers
│   │   ├── validators/     Zod schemas (auth · ticket · ai output)
│   │   ├── utils/          ApiError · asyncHandler · serializers
│   │   ├── index.ts        server entrypoint
│   │   └── seed.ts         demo data seeder
│   └── .env                single env file (gitignored)
├── frontend/
│   ├── app/                landing · login · signup · dashboard/* (App Router)
│   ├── components/         ui/ · landing/ · layout/ · tickets/ · dashboard/ · auth/
│   ├── hooks/              useTheme · useRequireAuth · useSocket
│   ├── lib/                api client · socket · types · constants · validation · utils
│   ├── store/              auth (persisted) · toast
│   └── .env                single env file (gitignored)
├── postman/SupportFlow.postman_collection.json
├── package.json            root convenience scripts
└── README.md
```

---

## Prerequisites

- **Node.js 18+** (works on current releases).
- **MongoDB** — one of:
  - a local server (`mongod`) listening on `mongodb://127.0.0.1:27017`, **or**
  - a **MongoDB Atlas** cluster connection string.

The project defaults to **local MongoDB** because it needs no account, no IP allow-list
and no TLS negotiation — ideal for a live demo. Atlas is a one-line switch (see
[Environment variables](#environment-variables)).

---

## Setup & run (step by step)

### 1. Install dependencies

```bash
# from the repo root
npm run install:all
# — or manually —
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Create the env files

`backend/.env`:

```ini
MONGODB_URI=mongodb://127.0.0.1:27017/supportflow
JWT_SECRET=change-me-to-a-long-random-string-min-16-chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
AI_PROVIDER=local
AI_MODEL=supportflow-heuristic-v1
PORT=4000
NODE_ENV=development
```

`frontend/.env`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Seed demo data (once)

```bash
cd backend
npm run seed
```

Expected output ends with the demo account list. The `⚠️  MongoDB disconnected` line at
the very end is normal — the seed script closes its own connection.

### 4. Start the backend  (terminal 1)

```bash
cd backend
npm run dev
```

Wait for:

```
✅  MongoDB connected (db: supportflow)
🚀  SupportFlow API listening on http://localhost:4000
```

### 5. Start the frontend  (terminal 2)

```bash
cd frontend
npm run dev
```

Wait for `✓ Ready` then open **http://localhost:3000** (use `localhost`, not `127.0.0.1`).

### Root convenience scripts

| Command | Effect |
|---------|--------|
| `npm run install:all` | install backend + frontend |
| `npm run seed`        | reseed demo data |
| `npm run dev:backend` | `npm run dev` in `backend/` |
| `npm run dev:frontend`| `npm run dev` in `frontend/` |
| `npm run build`       | production build of the frontend |
| `npm run typecheck`   | `tsc --noEmit` on both packages |

> **Important:** the backend runs with `tsx watch`, which reloads on **`.ts`** changes but
> **not** on `.env` changes. After editing `backend/.env`, stop the backend (Ctrl+C) and
> `npm run dev` again.

---

## Environment variables

### `backend/.env`

| Variable | Meaning / where it comes from |
|----------|-------------------------------|
| `MONGODB_URI` | MongoDB connection string. **Local:** `mongodb://127.0.0.1:27017/supportflow`. **Atlas:** *Atlas → Connect → Drivers*, then append a database name — `mongodb+srv://USER:PASSWORD@cluster0.xxxx.mongodb.net/supportflow?retryWrites=true&w=majority` (exactly one `/` before `supportflow`, no spaces). URL-encode `@ : / ? #` in the password. |
| `JWT_SECRET` | Long random string, **≥ 16 characters**. Generate: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`. |
| `JWT_EXPIRES_IN` | Access-token lifetime, e.g. `7d`. |
| `CLIENT_URL` | Allowed browser origin(s) for CORS / Socket.IO in production. Comma-separate for several. In **development every localhost origin is allowed automatically.** |
| `AI_PROVIDER` | `local` — the only implemented engine. |
| `AI_MODEL` | Label stored on triage results for traceability, e.g. `supportflow-heuristic-v1`. |
| `PORT` | API port. Default `4000`. |
| `NODE_ENV` | `development` \| `production` \| `test`. |

### `frontend/.env`

| Variable | Meaning |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the API, no trailing slash. Default `http://localhost:4000`. |

Both `.env` files are gitignored. No secret is ever referenced from frontend code.

---

## Demo accounts

Created by `npm run seed`. **Password for all: `Passw0rd!`** (capital `P`, digit `0`, `!`).

| Email | Role |
|-------|------|
| `customer@supportflow.demo` | customer |
| `riley@supportflow.demo`    | customer |
| `agent@supportflow.demo`    | agent |
| `jordan@supportflow.demo`   | agent |
| `admin@supportflow.demo`    | admin |

The login page has **Use Customer / Use Agent / Use Admin** buttons that fill these in.

---

## User procedure / how to use the app

### New user
1. Open the app → **Sign Up**.
2. Choose a role (**Customer** or **Support Agent**), enter name, email, password, and
   **confirm password** (use the eye icon to reveal it).
3. Submit → you are redirected to the **Login** page with a confirmation message.
4. **Log in** with the email and password you just chose → your role dashboard opens.

### Customer
1. Dashboard shows your ticket counts and recent tickets.
2. **Create New Ticket** → enter a subject and description, optionally pick a category
   (or leave it to the AI) → **Create Ticket & Analyze with AI**.
3. Watch the AI analysis animation, then see the suggested **category / priority /
   summary**, marked *AI Suggested — Human Review Required*.
4. Open the ticket to follow its status timeline and **chat with the agent in real time**.
5. When the agent resolves it you see **Resolved** and the resolution note appear live.

### Agent
1. Dashboard shows your assigned workload and the unassigned queue.
2. **Tickets** → filter / search the queue → open a ticket.
3. In the **AI Review Panel**: edit category / priority / summary if needed → **Accept**
   (this finalizes the values and marks the ticket human-reviewed).
4. **Agent actions** panel: **Assign to me** → **Move to In Progress**.
5. Reply to the customer in the conversation (delivered instantly).
6. Enter a **resolution note** → **Resolve Ticket** (blocked if the note is empty).
7. Reopen later if required.

### Admin
- Sees org-wide analytics (by status / priority / category) plus the full agent view.

---

## Hackathon demo script

1. **Login as Customer** — `customer@supportflow.demo` / `Passw0rd!`.
2. **Create ticket** — Subject *"Charged twice for my order"*, Description *"I was charged
   twice for the same order and need one payment refunded."*
3. **AI analyses** → Category **Billing**, Priority **High**, Summary
   **"Possible duplicate payment reported by customer."**
4. Result shown as **AI Suggested — Human Review Required**.
5. **Login as Agent** — `agent@supportflow.demo` (second browser / incognito window).
6. Agent opens the ticket, reviews the AI panel, optionally edits, clicks **Accept**.
7. Agent **Assign to me** → **Move to In Progress**.
8. Agent replies: *"Hello, we've reviewed your issue and are checking the duplicate
   payment. We'll process the appropriate refund."*
9. **Customer receives the message in real time** — no refresh.
10. Agent enters resolution note *"Duplicate payment confirmed and refund initiated."*
11. Agent **Resolves** the ticket (empty note is rejected).
12. **Customer sees `Resolved`** update live.
13. **Both dashboards' statistics update** from real database data.

---

## REST API reference

Base URL `http://localhost:4000/api`. Protected routes require
`Authorization: Bearer <token>`. Errors: `{ "error": { "message": string, "details"?: [...] } }`.
A ready-to-run **Postman collection** is in `postman/SupportFlow.postman_collection.json`
(variables `baseUrl`, `token`, `ticketId`; the Login and Create-ticket requests populate
`token` / `ticketId` automatically).

### Auth
| Method | Path | Body | Notes |
|--------|------|------|-------|
| `POST` | `/auth/register` | `{ name, email, password, role: "customer"\|"agent" }` | Returns `{ token, user }`. The web app ignores the token and routes to `/login`. Admins are seed-only. |
| `POST` | `/auth/login` | `{ email, password }` | Returns `{ token, user }`. |
| `GET`  | `/auth/me` | — | Current user from the bearer token. |

### Tickets
| Method | Path | Role | Notes |
|--------|------|------|-------|
| `POST` | `/tickets` | customer | Creates the ticket **and** runs AI triage. Returns `{ ticket, aiAvailable, message }`. |
| `GET`  | `/tickets` | any | Customers see only their own; agents/admins see the queue. Query: `status, priority, category, q, mine, page, limit`. |
| `GET`  | `/tickets/:id` | owner / agent / admin | `{ ticket, canModify }`. Other customers get `403`. |
| `PATCH`| `/tickets/:id` | assigned agent / admin | Edit `category, priority, status, aiSummary, aiReviewed, resolutionNote`. Illegal status transitions rejected. |
| `POST` | `/tickets/:id/assign` | agent / admin | Body `{ agentId? }`. Agents self-assign; only admin assigns others. `New → Assigned`. |
| `POST` | `/tickets/:id/triage` | assigned agent / admin | Re-runs AI triage, resets `aiReviewed`. |
| `POST` | `/tickets/:id/resolve` | assigned agent / admin | Body `{ resolutionNote }` (required). Ticket must be `In Progress`. |
| `POST` | `/tickets/:id/reopen` | assigned agent / admin | `Resolved → In Progress`. |

### Messages
| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/tickets/:id/messages` | Chronological; access-checked. |
| `POST` | `/tickets/:id/messages` | Body `{ message }`. Persists, then emits `new-message` to the ticket room. |

### Dashboard
| Method | Path | Role |
|--------|------|------|
| `GET` | `/dashboard/customer` | customer / admin |
| `GET` | `/dashboard/agent` | agent / admin |
| `GET` | `/dashboard/admin` | admin |
| `GET` | `/agents` | agent / admin — roster for the assignment UI |
| `GET` | `/health` | public — `{ status, database: "connected"\|"disconnected", time }` |

---

## Real-time (Socket.IO) events

Client connects to the API origin with `auth: { token }`. The server verifies the JWT in
`io.use(...)` and attaches the user.

**Client → server:** `join-ticket(ticketId)`, `leave-ticket(ticketId)`,
`ticket-message({ ticketId, message })`.

**Server → client:** `new-message`, `ticket-status-updated`, `ticket-updated`,
`ticket-created` (to the `agents` room).

Flow: *connect → authenticate → `join-ticket` (access-checked) → message sent →
backend stores it in MongoDB → backend emits to the room → every participant's UI updates
instantly.*

---

## Database schema

**User** — `_id, name, email (unique), passwordHash (never serialized),
role: customer|agent|admin, createdAt, updatedAt`

**Ticket** — `_id, ticketNumber (unique, "SF-YYYY-NNNNNN"), customerId → User,
assignedAgentId → User|null, subject, description, category, priority (Low|Medium|High),
status (New|Assigned|In Progress|Resolved), aiCategory, aiPriority, aiSummary,
aiReviewed (bool), aiError (string|null), resolutionNote, createdAt, updatedAt`
Indexes: `ticketNumber`, `customerId`, `assignedAgentId`, `status`, `priority`,
`createdAt`, compound `status+priority`.

**Message** — `_id, ticketId → Ticket, senderId → User, senderRole, message, createdAt`
Index: `ticketId`.

**Counter** — `_id ("ticket-<year>"), seq` — atomic `$inc` upsert backs the unique
ticket numbers.

---

## AI triage engine

`backend/src/services/ai.service.ts` — a **local, deterministic** classifier. No external
service, no API key, so the demo is offline-safe and reproducible. Its function signature
and Zod-validated output contract are identical to what a remote LLM integration would
use, so swapping in a provider is a single-file change.

- **Category** — keyword scoring across Billing / Payment / Technical / Account / Order /
  Delivery, falling back to the customer's choice or `General`.
- **Priority** — `High` on signals such as *"charged twice", "locked out", "urgent",
  "refund", "security"*; `Low` on *"how do I…", "feature request", "no rush"*; otherwise
  `Medium`.
- **Summary** — a concise sentence; duplicate-payment reports collapse to
  *"Possible duplicate payment reported by customer."*
- **Validation** — the result is parsed with `aiTriageResultSchema` (Zod); invalid output
  raises `AiUnavailableError` and is never stored.
- **Failure fallback** — ticket creation catches the error, records `aiError`, applies
  defaults, and the workflow continues manually.

---

## Security

- **Passwords** hashed with bcrypt (cost 10); `passwordHash` is `select:false` and
  stripped from every response.
- **JWT** signed with `JWT_SECRET` (≥ 16 chars, enforced at boot), verified on every
  protected REST route **and** every socket connection.
- **Server-side authorization** — never "hide the button":
  - customers may read / act on only their own tickets (`403` otherwise);
  - an agent may modify a ticket only if it is assigned to them or unassigned; another
    agent's ticket is blocked unless the actor is an admin;
  - role gates on every dashboard and on ticket create / patch / assign / resolve / reopen.
- **Input validation** with Zod on all bodies and query params; **AI output validation**
  with Zod before persistence.
- **CORS** — permissive for localhost in development, restricted to `CLIENT_URL` in
  production. JSON body capped at 1 MB.
- **No secrets in the frontend**; `backend/.env` and `frontend/.env` are gitignored.
- Errors return a clean message — no stack traces to clients; 5xx are logged server-side.
- If MongoDB is unreachable the API stays up and returns a clear **503** ("Database is not
  connected…") instead of an opaque failure, and reconnects automatically.

---

## Deployment

**Backend** (Render / Railway / Fly.io / any Node host)
1. Root directory `backend/`, start command `npm start` (`tsx src/index.ts`).
2. Env vars: `MONGODB_URI` (Atlas), `JWT_SECRET`, `JWT_EXPIRES_IN`,
   `CLIENT_URL` = your deployed frontend URL, `AI_PROVIDER=local`, `AI_MODEL`,
   `NODE_ENV=production`, `PORT` (host-provided).
3. Ensure the host allows WebSocket upgrades (Render / Railway do by default).
4. Run `npm run seed` once from a shell.

**Frontend** (Vercel recommended)
1. Root directory `frontend/`, framework preset **Next.js**, build `next build`.
2. Env var `NEXT_PUBLIC_API_URL` = deployed API base URL.
3. After both are live, set the backend's `CLIENT_URL` to the Vercel domain and redeploy.

**MongoDB** — a free MongoDB Atlas cluster: create a DB user, add your host IP (or
`0.0.0.0/0` for a demo) under Network Access, use the SRV string with a database name
appended.

---

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Browser shows **"Network Error"** on login/signup | The backend isn't running or the DB connection failed. Check terminal 1 for `🚀 listening` and `MongoDB connected`. Hit `http://localhost:4000/api/health`. |
| **`EADDRINUSE :::4000`** | A previous backend is still running. Kill it: `Get-NetTCPConnection -LocalPort 4000 -State Listen \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` (PowerShell), then `npm run dev`. |
| **"Invalid email or password"** with a demo account | The password is `Passw0rd!` (capital `P`, digit `0`, `!`). Use the login page's Use-Customer/Agent/Admin buttons. |
| **"option retrywrites is not supported"** | The `MONGODB_URI` has a stray space (`? retryWrites`) or `//` before the db name. Use one `/` and no spaces. |
| **`SSL alert number 80` / Atlas won't connect** (Compass fails too) | Network path to Atlas is blocked — a VPN, antivirus "HTTPS scanning", or corporate proxy. Disable it / add a localhost exception / try another network, **or just use local MongoDB** (`MONGODB_URI=mongodb://127.0.0.1:27017/supportflow`). |
| Edited `backend/.env` but nothing changed | `tsx watch` doesn't reload env files. Stop the backend and `npm run dev` again. |
| API returns **503 "Database is not connected"** | `MONGODB_URI` is wrong or the DB is down. Fix it; the server reconnects automatically. |
| `⚠️ MongoDB disconnected` at the end of `npm run seed` | Normal — the seed script closes its own connection when finished. |

---

## AI tools used

- **In the running application:** the in-repo **local heuristic triage engine**
  (`backend/src/services/ai.service.ts`). No third-party AI service is called at runtime.
- **During development:** Claude (Anthropic), via Claude Code, for scaffolding,
  implementation and review.

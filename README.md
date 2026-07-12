# EcoSphere — Enterprise ESG Management Platform

**EcoSphere** integrates Environmental, Social, and Governance (ESG) tracking into day-to-day operations: carbon accounting, CSR participation, compliance, and employee gamification — with live department scores and executive reporting.

| | |
|--|--|
| **Stack** | Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Better Auth · Drizzle · Neon Postgres |
| **Repo** | [https://github.com/labishbardiya/ecosphere-esg-platform](https://github.com/manishprasad9156/ecosphere-esg-platform) |
| **Production** | [https://ecosphere-esg-platform-roan.vercel.app](https://ecosphere-esg-platform-9o.vercel.app/) |

---

## Core modules

| Module | What it does |
|--------|----------------|
| **Dashboard** | Mission control: ESG scores, KPIs, insights, rankings, deadlines, activity feed |
| **Environmental** | Emission factors, carbon ledger (auto CO₂e), resources, waste, goals, charts |
| **Social** | CSR activities, join + proof, manager approve/reject → points |
| **Governance** | Policies + acknowledgements, audits, compliance issues (owner + due date) |
| **Gamification** | Challenges, XP/points, auto badges, rewards, leaderboard |
| **Reports** | E / S / G / summary + CSV export (admin) |
| **Settings** | ESG weights, feature toggles, departments, categories (admin) |

---

## ESG scoring

Default weights (configurable in **Settings**):

```
Overall ESG = 0.4 × Environmental + 0.3 × Social + 0.3 × Governance
```

Scores are computed from live operational data (carbon, CSR approvals, policy acks, open/overdue issues), not hardcoded UI values.

---

## Architecture

```
Browser (UI)
    ↓
Next.js App Router (Server Actions + Better Auth API routes)
    ↓
Drizzle ORM
    ↓
PostgreSQL (Neon)
```

- **Frontend + backend** for the product live in this Next.js app.
- The optional `backend/` Python (FastAPI) folder is **not** wired into the UI; do not treat it as the production API.

Soft real-time: authenticated layout refreshes about every **8 seconds** so admin views (e.g. leaderboard) pick up employee actions.

---

## Tech requirements

- Node.js 20+
- npm (or pnpm)
- PostgreSQL (local Docker **or** Neon)

---

## Setup (local)

```bash
git clone https://github.com/labishbardiya/ecosphere-esg-platform.git
cd ecosphere-esg-platform
npm install
```

Create `.env.local`:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=generate-a-long-random-string
```

Apply schema (if tables are missing), then start:

```bash
# Optional: apply Phase 3+ SQL against your DB
# psql "$DATABASE_URL" -f scripts/migrate-phase3.sql

npm run dev
```

Open http://localhost:3000

### Local Postgres via Docker (optional)

```bash
docker run -d --name ecosphere-pg \
  -e POSTGRES_USER=ecosphere \
  -e POSTGRES_PASSWORD=ecosphere \
  -e POSTGRES_DB=ecosphere \
  -p 5433:5432 \
  postgres:16-alpine

# DATABASE_URL=postgresql://ecosphere:ecosphere@127.0.0.1:5433/ecosphere
```

---

## Demo accounts

After seeding (or creating users via sign-up), use:

| Role | Email | Password |
|------|--------|----------|
| **Admin** | `admin@ecosphere.demo` | `password123` |
| **Employee** | `employee1@ecosphere.demo` | `password123` |
| **Employee** | `employee2@ecosphere.demo` | `password123` |

Alternate admin (if present): `verify@ecosphere.local` / `password123`

**First user** registered on an empty DB becomes **admin** automatically.

---

## Key business rules

1. **Carbon auto-calc** — total CO₂e = quantity × emission factor (factor snapshotted on the transaction).
2. **CSR evidence** — when enabled, approval requires a proof URL/file reference.
3. **Badge auto-award** — when XP / completed-challenge thresholds are met.
4. **Reward redeem** — deducts points and stock atomically.
5. **Compliance** — every issue needs an **owner** and **due date**; overdue items surface on the dashboard.
6. **ESG weights** — configurable under Settings (admin).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Lint |

SQL helpers live under `scripts/` (e.g. `migrate-phase3.sql`).

---

## Deploy (Vercel)

1. Connect the GitHub repo to Vercel.
2. Set environment variables (Production):

```bash
DATABASE_URL=          # Neon pooled connection string
BETTER_AUTH_URL=       # https://your-deployment.vercel.app
BETTER_AUTH_SECRET=    # long random secret
```

3. Deploy. Auth-related routes use `force-dynamic` so they are not statically prerendered.

---

## Project structure (high level)

```
app/
  (app)/           # Authenticated shell (dashboard, modules, reports, settings)
  actions/         # Server actions (domain logic)
  api/auth/        # Better Auth handler
  sign-in|sign-up/ # Auth pages
components/        # UI (auth, environmental, social, governance, layout, …)
lib/               # auth, db (schema + pool), esg-scoring, session, settings
public/videos/     # Auth background video
scripts/           # SQL migrations / notes
```

---

## License

See [LICENSE](./LICENSE).

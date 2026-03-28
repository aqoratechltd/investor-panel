# InvestorPanel — Multi-Tenant SaaS Investment Platform

A premium, production-grade multi-tenant SaaS investment platform with three role-based panels: **Super Admin**, **Seller Portal**, and **Investor Hub**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS, Shadcn UI, Framer Motion, Recharts |
| Backend | NestJS (Node.js), TypeScript |
| Database | PostgreSQL + Prisma ORM |
| State | Zustand |
| Auth | JWT + Refresh Tokens + RBAC |
| Payments | Stripe (+ EasyPaisa/JazzCash ready) |
| Monorepo | Turborepo + Workspaces |

---

## Project Structure

```
investor-panel/
├── apps/
│   ├── frontend/                    # Next.js 14 App (Port 3000)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/          # Login, Register, Forgot Password
│   │       │   ├── (dashboard)/
│   │       │   │   ├── admin/       # Super Admin panel pages
│   │       │   │   ├── seller/      # Seller portal pages
│   │       │   │   └── investor/    # Investor hub pages
│   │       │   ├── page.tsx         # Landing page
│   │       │   └── pricing/         # Pricing page
│   │       ├── components/
│   │       │   ├── ui/              # MetricCard, DataTable, Button, Input, etc.
│   │       │   ├── layout/          # Sidebar, Topbar, DashboardLayout
│   │       │   └── charts/          # AreaChart, DonutChart, BarChart
│   │       ├── stores/              # Zustand stores (auth, dashboard, notifications)
│   │       ├── lib/                 # api.ts (axios), utils.ts
│   │       └── styles/              # globals.css (Tailwind + custom CSS)
│   │
│   └── backend/                     # NestJS API (Port 4000)
│       └── src/
│           ├── modules/
│           │   ├── auth/            # JWT auth, refresh, 2FA-ready
│           │   ├── dashboard/       # Role-specific metrics endpoints
│           │   ├── sellers/         # Seller CRUD
│           │   ├── investors/       # Investor management
│           │   ├── investments/     # Investment allocation
│           │   ├── coins/           # Custom coin system
│           │   ├── withdrawals/     # Withdrawal workflow
│           │   ├── transactions/    # Transaction ledger
│           │   ├── subscriptions/   # Stripe billing
│           │   ├── ads/             # Ad network
│           │   ├── notifications/   # In-app notifications
│           │   └── analytics/       # Platform analytics
│           ├── guards/              # JwtAuthGuard, RolesGuard
│           └── decorators/          # @Roles()
│
└── packages/
    ├── database/                    # Prisma schema + client
    │   └── prisma/schema.prisma     # Full PostgreSQL schema
    └── shared/                      # TypeScript types shared frontend↔backend
        └── types/index.ts
```

---

## Database Schema

Core tables (all include `tenant_id` for multi-tenancy):

- `tenants` — Platform tenants (one per seller organization)
- `users` — All users (SUPER_ADMIN, SELLER, INVESTOR)
- `sellers` — Seller profile + company info
- `investors` — Investor profile + balances
- `investments` — Individual investment allocations
- `investment_performance` — Time-series performance data
- `coins` — Custom investment tokens per seller
- `coin_ledger` — Coin transaction history
- `transactions` — Financial transaction ledger
- `withdrawals` — Withdrawal requests + approval flow
- `subscriptions` — Per-seat SaaS billing
- `subscription_payments` — Payment history
- `ads` — Ad network placements
- `activity_logs` — Audit trail (all major actions)
- `notifications` — In-app notification system
- `tasks` — Team task management
- `meetings` — Meeting scheduler
- `messages` — Internal messaging
- `badges` + `investor_badges` — Gamification system
- `plan_configs` — Subscription plan definitions

---

## API Routes

All routes are prefixed with `/api/v1`

| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Email/password login |
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/refresh` | Auth | Refresh access token |
| POST | `/auth/logout` | Auth | Logout + clear token |
| POST | `/auth/forgot-password` | Public | Request reset email |
| GET | `/auth/me` | Auth | Get current user |
| GET | `/dashboard/super-admin` | SUPER_ADMIN | Admin metrics |
| GET | `/dashboard/seller` | SELLER | Seller metrics |
| GET | `/dashboard/investor` | INVESTOR | Investor metrics |
| GET | `/sellers` | SUPER_ADMIN | List all sellers |
| PATCH | `/sellers/:id/approve` | SUPER_ADMIN | Approve seller |
| PATCH | `/sellers/:id/suspend` | SUPER_ADMIN | Suspend seller |
| GET | `/investors` | SELLER | List investors |
| POST | `/investors` | SELLER | Add investor |
| GET | `/investments` | SELLER/INVESTOR | List investments |
| POST | `/investments` | SELLER | Create investment |
| GET | `/coins` | SELLER | List coins |
| POST | `/coins` | SELLER | Create coin |
| GET | `/withdrawals` | Multi | List withdrawals |
| POST | `/withdrawals` | INVESTOR | Request withdrawal |
| PATCH | `/withdrawals/:id/approve` | SELLER | Approve withdrawal |
| GET | `/subscriptions/plans` | Public | List plans |
| GET | `/notifications` | Auth | Get notifications |
| GET | `/ads` | Multi | Get ads |
| GET | `/analytics` | Admin/Seller | Analytics data |

Swagger UI: `http://localhost:4000/api/docs`

---

## Frontend Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/pricing` | Pricing & plans |
| `/login` | Sign in |
| `/register` | Create account |
| `/forgot-password` | Password reset |
| `/admin` | Super Admin dashboard |
| `/admin/sellers` | Seller management |
| `/admin/subscriptions` | Subscription overview |
| `/admin/withdrawals` | Withdrawal monitoring |
| `/admin/ads` | Ad network management |
| `/admin/analytics` | Platform analytics |
| `/admin/logs` | Activity audit logs |
| `/seller` | Seller dashboard |
| `/seller/investors` | Investor management |
| `/seller/investments` | Investment allocations |
| `/seller/coins` | Custom coin system |
| `/seller/withdrawals` | Pending withdrawals |
| `/seller/reports` | Export reports |
| `/seller/team` | Team messaging |
| `/seller/meetings` | Meeting scheduler |
| `/seller/tasks` | Task management |
| `/investor` | Investor portfolio |
| `/investor/investments` | My investments |
| `/investor/performance` | Performance charts |
| `/investor/withdrawals` | My withdrawals |
| `/investor/transactions` | Transaction history |
| `/investor/coins` | My coins |
| `/investor/badges` | Achievement badges |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm / yarn / pnpm

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

Edit the `.env` files with your actual values.

### 3. Database Setup

```bash
npm run db:push       # Push schema to database
npm run db:generate   # Generate Prisma client
npm run db:studio     # Open Prisma Studio (optional)
```

### 4. Run Development

```bash
# Run all apps in parallel
npm run dev

# Or individually:
cd apps/backend && npm run dev     # Port 4000
cd apps/frontend && npm run dev    # Port 3000
```

### 5. Access

| URL | Description |
|---|---|
| `http://localhost:3000` | Frontend app |
| `http://localhost:4000/api/docs` | Swagger API docs |
| `http://localhost:5555` | Prisma Studio |

---

## Demo Accounts (Development)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@investorpanel.io | Admin@1234 |
| Seller | seller@demo.io | Seller@1234 |
| Investor | investor@demo.io | Investor@1234 |

---

## Security Architecture

- **JWT Authentication** — 15-min access tokens + 7-day refresh tokens
- **Bcrypt** — Password hashing (12 rounds)
- **RBAC** — Role-based route guards (`SUPER_ADMIN`, `SELLER`, `INVESTOR`)
- **Tenant Isolation** — All queries scoped by `tenant_id`
- **2FA Ready** — TOTP architecture in place (`otplib`)
- **Audit Logs** — All critical actions logged to `activity_logs`
- **Rate Limiting** — 100 req/min via `@nestjs/throttler`
- **Helmet** — Security headers via `helmet`
- **Input Validation** — `class-validator` + `zod` (frontend)

---

## Multi-Tenant Architecture

```
Platform
└── Tenant A (Seller: Alpha Investments)
│   ├── Investor 1 → sees only Tenant A data
│   ├── Investor 2 → sees only Tenant A data
│   └── Coins: MetaCoin, TikTokCoin
└── Tenant B (Seller: Growth Partners)
    ├── Investor 3 → sees only Tenant B data
    └── Coins: GrowthCoin
```

Every database query is filtered by `tenant_id`. Investors never see data from other tenants.

---

## Deployment

### Frontend (Vercel)
```bash
vercel deploy apps/frontend
```

### Backend (Railway / Render)
```bash
# Set environment variables in dashboard
railway up
```

### Database (Supabase / Neon / RDS)
```
DATABASE_URL=postgresql://...
```

---

## License

MIT — Built for the InvestorPanel project.

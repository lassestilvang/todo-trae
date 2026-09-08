# Daily Task Planner

A full-featured task management web application built with Next.js 16, React 19, and PostgreSQL.

## Features

- **Task Management** — Create, edit, delete tasks with subtasks, labels, priorities, deadlines, and time tracking
- **Multi-user Authentication** — GitHub OAuth and email/password sign-in via NextAuth.js with JWT sessions
- **Real-time Collaboration** — Share task lists with your team via real-time Socket.io rooms
- **Analytics Dashboard** — Visualize productivity trends, completion rates, and time allocation with Recharts
- **AI-Powered Prioritization** — Heuristic-based smart task suggestions (Top 3 priority picks)
- **Focus Mode** — Full-screen Pomodoro timer with generative particle canvas background
- **Task Templates** — Save and reuse task configurations
- **PWA Support** — Install as a progressive web app
- **Keyboard Shortcuts** — `N` for new task, `/` for search, `F` for focus mode, `1-4` for views, `?` for help
- **Dark/Light/System Theme** — Automatic OS preference sync with localStorage persistence

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Radix UI, Framer Motion |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 (persisted) |
| Database | PostgreSQL via Drizzle ORM |
| Auth | NextAuth.js 5 (GitHub + Credentials) |
| Real-time | Socket.io 4 |
| Charts | Recharts |
| Validation | Zod |
| Error Tracking | Sentry |
| Search | Fuse.js + React Virtuoso |
| PWA | @ducanh2912/next-pwa |

## Getting Started

### Prerequisites

- Node.js 20+ (or Bun)
- PostgreSQL 14+
- A GitHub OAuth app (optional, for GitHub sign-in)

### Installation

```bash
git clone <repo-url>
cd todo-trae
bun install
```

### Environment Setup

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL` — App URL (localhost:3000 for dev)
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `GITHUB_ID` / `GITHUB_SECRET` — GitHub OAuth credentials (optional if not using GitHub auth)
- `NEXT_PUBLIC_SOCKET_URL` — Socket.io server URL (for real-time collaboration)

### Database Setup

```bash
# Generate and run migrations
bunx drizzle-kit migrate

# Seed a test user (password: password123)
bun run seed-user.ts
```

### Running the App

```bash
# Start the Next.js dev server
bun dev

# In a separate terminal, start the Socket.io server
bun run socket
```

### Testing

```bash
# Unit/integration tests
bun test

# E2E tests (dev server must be running)
bun run test:e2e
```

### Docker

A `docker-compose.yml` is available for quick local setup with PostgreSQL:

```bash
docker-compose up -d
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/              # REST API routes (all authenticated)
│   │   ├── analytics/        # Analytics dashboard page
│   │   ├── login/            # Login page (Credentials + GitHub)
│   │   ├── register/         # Registration page
│   │   ├── api-docs/         # Swagger UI
│   │   ├── layout.tsx        # Root layout (providers, fonts, global styles)
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── ui/               # UI primitives (Button, Card, Dialog, etc.)
│   │   └── ...               # Feature components
│   ├── db/
│   │   ├── schema.ts         # Drizzle PostgreSQL schema (13 tables)
│   │   └── index.ts          # Drizzle db instance
│   ├── lib/
│   │   ├── api.ts            # Data access layer (PostgreSQL)
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── logger.ts         # Structured logger with Sentry
│   │   ├── analytics.ts      # Analytics aggregation
│   │   ├── ai.ts             # Heuristic task prioritization
│   │   ├── socket-server.ts  # Socket.io server
│   │   ├── socket-client.ts  # Socket.io client
│   │   └── ...
│   ├── stores/               # Zustand state management stores
│   ├── types/                # TypeScript type definitions
│   └── globals.css           # Global styles
├── test/                     # Bun unit/integration tests
├── tests/                    # Playwright E2E tests
└── drizzle/                  # Drizzle migration files
```

## API Documentation

API docs are available at `/api-docs` when the app is running. The OpenAPI spec defines schemas for Task, TaskList, Label, TaskTemplate, and ActivityLog.

## License

MIT

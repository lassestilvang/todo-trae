# Architecture Guide: Daily Task Planner

This document describes the high-level architecture, data flow, and technical implementation of the Daily Task Planner.

## 🏗️ System Overview

The application is built as a modern, local-first-ready web application using **Next.js 16**. It leverages a hybrid approach where state is managed locally for responsiveness, but persisted to a server-side SQLite database for reliability and multi-device potential.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Drizzle ORM](https://orm.drizzle.team/))
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Glassmorphism
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Validation**: [Zod](https://zod.dev/)
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/)

---

## 🔄 Data Flow

A typical user action (e.g., creating a task) follows this path:

1.  **UI Component**: User interacts with a component (e.g., `TaskForm`).
2.  **Zustand Store**: The component calls an action in `taskStore.ts`.
3.  **Optimistic Update**: The store updates the local state immediately for 0ms perceived latency.
4.  **API Call**: The store triggers an asynchronous fetch request to a Next.js API route (e.g., `POST /api/tasks`).
5.  **Validation**: The API route validates the payload using a **Zod** schema (from `lib/validations.ts`).
6.  **Persistence Layer**: The API route calls a function in `lib/api.ts`.
7.  **Database**: `lib/api.ts` uses **Drizzle ORM** to execute queries against PostgreSQL.
8.  **Activity Log**: Upon success, an activity record is created in the `activity_log` table via `lib/activityLog.ts`.
9.  **Sync**: The API returns the persisted object, and the store ensures the local state matches the server truth.

---

## 🗄️ Database Schema

The database consists of the following core tables:

- **`task_lists`**: Folders or categories for tasks (e.g., "Inbox", "Personal").
- **`tasks`**: The primary entity. Contains name, status, priority, and dates.
- **`labels`**: Tags that can be applied to tasks (many-to-many via `task_labels`).
- **`subtasks`**: Smaller items nested within a task.
- **`activity_log`**: A chronological record of all modifications (created, updated, deleted).

### Relationships
- `tasks` belongs to a `task_list`.
- `tasks` can have multiple `labels` (and vice-versa).
- `tasks` can have many `subtasks`, `reminders`, and `attachments`.

---

## 🧠 State Management (Zustand)

### Task Store (`taskStore.ts`)
Manages tasks, lists, labels, and the current view filters.
- **`tasks`**: Array of all loaded tasks.
- **`lists`**: Array of available task lists.
- **`labels`**: Array of available tags.
- **`selectedView`**: Current filter (Today, Upcoming, All, etc.).

### Theme Store (`themeStore.ts`)
Manages the visual appearance of the application.
- **`theme`**: `'light'`, `'dark'`, or `'system'`.
- **`isDarkMode`**: Boolean reflecting the actual applied mode.
- **Reactivity**: Automatically listens to OS-level theme changes when set to `system`.

---

## 📝 Activity Logging

The application maintains a detailed audit trail. Every significant change (CRUD operations) is logged with:
- `taskId`, `listId`, or `labelId`
- `action` (e.g., "created", "updated", "deleted")
- `field` (if an update)
- `old_value` and `new_value`
- `timestamp`

This enables features like activity feeds and potential "Undo" functionality in the future.

---

## 🧪 Testing

The project uses **Bun Test** for unit and integration testing.

- **Database Tests**: Located in `test/database.test.ts`, these tests verify CRUD operations using the actual database.
- **Store Tests**: Located in `test/store.test.ts` and `test/store-simple.test.ts`, these verify the Zustand store logic.
- **E2E Tests**: Located in `tests/`, these use **Playwright** to test the full application flow in the browser.

### Test Database Environment
To run database tests, ensure you have a `.env` file with a valid `DATABASE_URL` pointing to a PostgreSQL instance. The tests will automatically manage the schema using Drizzle.

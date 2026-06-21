# Asikaso — Task Management App

A fullstack task management application that lets users create, organize, search, and track tasks by category, with a live analytics dashboard. Built as a practical fullstack assessment submission.

**Repo:** [github.com/Mark91121/Task-Manager](https://github.com/Mark91121/Task-Manager)
**Stack:** Next.js (`task-frontend`) · Express / Node.js (`task-api`) · Supabase (PostgreSQL database) · Prisma (ORM)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Set up Supabase](#2-set-up-supabase)
  - [3. Backend setup](#3-backend-setup)
  - [4. Frontend setup](#4-frontend-setup)
  - [5. Run the app](#5-run-the-app)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Error Handling & Validation](#error-handling--validation)
- [Design Notes](#design-notes)

---

## Features

- **Add Task** — create a task with a title, optional description, optional due date, and optional category.
- **Mark task as complete / incomplete** — toggling a task records (or clears) a `completedAt` timestamp, which feeds the dashboard analytics.
- **Edit task** — update title, description, due date, or category.
- **Delete task** — with a confirmation dialog to prevent accidental deletes.
- **Search** — search tasks by title (case-insensitive, debounced).
- **Filter** — filter by `All`, `Active`, or `Completed`; filters compose with search and with the selected category, so e.g. searching "groceries" while on the "Home" category with the "Active" filter only returns active, uncategorized-matching results from that category.
- **Categories** — create, rename (with color), and delete categories. Deleting a category that still has tasks is blocked by default (`409 Conflict`); the UI then offers to reassign those tasks to "No category" instead of deleting them.
- **Dashboard / Analytics** — live stats (total, active, completed, overdue, due today, completion rate), a created-vs-completed trend chart (7d / 30d / 90d / year / all-time), a per-category breakdown, and a recent-activity list.
- **Responsive UI** — collapsible mobile sidebar drawer, sticky header with search/filter, skeleton loading states, toast notifications, and reduced-motion support.

## Tech Stack

**Frontend**

- [Next.js](https://nextjs.org) (App Router) + React 19
- Tailwind CSS v4
- [Framer Motion](https://www.framer.com/motion/) for list/transition animations

**Backend**

- Node.js + [Express](https://expressjs.com)
- [Prisma ORM](https://www.prisma.io) with the `@prisma/adapter-pg` driver adapter
- [`pg`](https://node-postgres.com) as the underlying Postgres driver

**Database**

- [Supabase](https://supabase.com) (managed PostgreSQL)

## Project Structure

```
Task-Manager/
├── task-api/                      # backend
│   ├── prisma/
│   │   ├── schema.prisma          # Category & Task models
│   │   └── seed.js                # seeds default categories (Work, Home, Personal)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── tasks.controller.js
│   │   │   └── categories.controller.js
│   │   ├── routes/
│   │   │   ├── tasks.routes.js
│   │   │   └── categories.routes.js
│   │   ├── lib/
│   │   │   └── prismaClient.js    # Prisma client wired to the Supabase pooled connection
│   │   └── index.js               # app entrypoint, middleware, error handler
│   ├── prisma.config.ts
│   ├── package.json
│   └── .env                       # not committed — see Environment Variables
│
└── task-frontend/                 # frontend
    ├── app/
    │   ├── components/
    │   │   ├── Dashboard.js / DashboardSkeleton.js
    │   │   ├── Sidebar.js
    │   │   ├── TaskForm.js
    │   │   ├── TaskList.js / TaskItem.js / TaskListSkeleton.js
    │   │   ├── SearchFilterBar.js
    │   │   ├── MobileTopbar.js
    │   │   ├── ConfirmDialog.js
    │   │   ├── ToastProvider.js
    │   │   └── Providers.js
    │   ├── hooks/
    │   │   └── useAnalytics.js
    │   ├── lib/
    │   │   └── api.js             # shared fetch wrapper + error normalization
    │   ├── layout.js
    │   ├── page.js                # main view: dashboard / task list
    │   └── globals.css
    ├── jsconfig.json
    ├── package.json
    └── .env.local                 # not committed — see Environment Variables
```

## Database Schema

Two models, managed via Prisma and hosted on Supabase Postgres:

**`Category`**
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | primary key |
| `name` | `String` | unique |
| `color` | `String` | hex color, defaults to `#5b5bd6` |
| `createdAt` / `updatedAt` | `DateTime` | |

**`Task`**
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | primary key |
| `title` | `String` | required |
| `description` | `String?` | optional |
| `completed` | `Boolean` | defaults to `false` |
| `completedAt` | `DateTime?` | set/cleared when `completed` is toggled, powers analytics |
| `dueDate` | `DateTime?` | optional |
| `categoryId` | `String?` | FK → `Category.id`, `onDelete: SetNull` |
| `createdAt` / `updatedAt` | `DateTime` | |

A task's category is set to `null` (not deleted) if its parent category is removed — this is what allows the "reassign to Uncategorized" delete flow described above.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) account/project

### 1. Clone the repository

```bash
git clone https://github.com/Mark91121/Task-Manager.git
cd Task-Manager
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. In your project, go to **Project Settings → Database** and copy:
   - the **Connection pooling** string (port `6543`) → this becomes `DATABASE_URL`
   - the **Direct connection** string (port `5432`) → this becomes `DIRECT_URL`

### 3. Backend setup

```bash
cd task-api
npm install
```

Create a `.env` file in `task-api/` (see [Environment Variables](#environment-variables) below), then run:

```bash
npm run prisma:generate   # generate the Prisma client
npm run prisma:migrate    # create the tables in Supabase
node prisma/seed.js       # seed default categories: Work, Home, Personal
```

### 4. Frontend setup

```bash
cd task-frontend
npm install
```

Create a `.env.local` file in `task-frontend/` (see [Environment Variables](#environment-variables) below).

### 5. Run the app

In one terminal:

```bash
cd task-api
npm run dev          # starts the API on http://localhost:5000
```

In another terminal:

```bash
cd task-frontend
npm run dev           # starts the app on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

**`task-api/.env`**

```bash
# Supabase pooled connection (used by the app at runtime)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase direct connection (used by Prisma Migrate)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Server
PORT=5000
```

**`task-frontend/.env.local`**

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> Both `.env` files are git-ignored. Never commit real Supabase credentials.

## API Reference

Base URL: `http://localhost:5000`

### Tasks — `/tasks`

| Method   | Endpoint                                         | Description                                                                                                                                                                                             |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/tasks`                                         | List tasks. Supports query params: `search` (title, case-insensitive), `filter` (`Active` \| `Completed`), `categoryId` (or `none` for uncategorized). All params compose together.                     |
| `POST`   | `/tasks`                                         | Create a task. Body: `{ title, description?, dueDate?, categoryId? }`. `title` is required.                                                                                                             |
| `PUT`    | `/tasks/:id`                                     | Update a task (partial). Toggling `completed` automatically sets/clears `completedAt`.                                                                                                                  |
| `DELETE` | `/tasks/:id`                                     | Delete a task.                                                                                                                                                                                          |
| `GET`    | `/tasks/analytics?range=7d\|30d\|90d\|year\|all` | Dashboard stats: totals, due-today list, completed-today/this-week counts, per-category breakdown, recent activity, and a created-vs-completed trend bucketed by day/week/month depending on the range. |

### Categories — `/categories`

| Method   | Endpoint          | Description                                                                                                                                                                                     |
| -------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/categories`     | List categories, each with a `taskCount`.                                                                                                                                                       |
| `POST`   | `/categories`     | Create a category. Body: `{ name, color? }`. `color` must be a valid hex code if provided.                                                                                                      |
| `PUT`    | `/categories/:id` | Rename and/or recolor a category.                                                                                                                                                               |
| `DELETE` | `/categories/:id` | Delete a category. Returns `409 Conflict` with `{ code: "CATEGORY_HAS_TASKS", taskCount }` if it still has tasks. Pass `?reassign=true` to delete anyway and move those tasks to "No category". |

## Error Handling & Validation

- **Backend:** every controller validates required fields (e.g. task title, category name, hex color format) and returns `400` with a descriptive `{ error }` message on bad input, `404` for missing resources, and `409` for conflicts (duplicate category name, category-has-tasks). A centralized Express error handler catches anything unhandled and returns a generic `500` so the frontend always gets a consistent JSON error shape.
- **Frontend:** a shared `api.js` fetch wrapper normalizes both network failures (e.g. backend unreachable) and non-2xx API responses into a single `ApiError`, which every form and action surfaces to the user via inline messages and toast notifications — never a silent failure or a raw stack trace.

## Design Notes

- **Driver adapters:** Prisma is configured with `@prisma/adapter-pg` over a `pg` connection pool, which is the recommended setup for Supabase's pooled (PgBouncer) connection string.
- **Optimistic-feeling UX:** completing/toggling a task updates local state immediately and re-sorts the list client-side (active tasks first, most recent first) instead of waiting on a full refetch, with Framer Motion animating the reorder.
- **Search debouncing:** task search/filter requests are debounced (350ms) to avoid firing a request on every keystroke.
- **URL-synced view state:** the current view (`dashboard`/`tasks`) and selected category are reflected in the URL query string, so refreshing or sharing a link preserves where the user was.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CMU Activity Match — a web app for CMU students to create, discover, and join activities with other students. Built incrementally by a student team as part of an Agile course; not a finished product.

- **Live app:** https://cmu-activity-match-alpha.vercel.app
- **Live API:** https://cmu-activity-match-backend.onrender.com/api/health (Render free tier — sleeps after inactivity, first request can take 30–60s)

## Commands

**Backend** (`backend/`, Express + `pg`, CommonJS):
```
cd backend
npm install
node server.js        # runs on http://localhost:3001
```

**Frontend** (`frontend/`, React 19 + Vite + Tailwind v4):
```
cd frontend
npm install
npm run dev            # runs on http://localhost:5173
npm run build           # production build
npm run lint             # eslint
npm run preview          # preview a production build
```

Both must be running simultaneously for local development (two terminals). There is currently no automated test suite in this repo (no test runner configured, no `*.test.*`/`*.spec.*` files) — verify changes by running the app manually.

### Required local env files (not committed — ask a teammate for values)

`backend/.env`:
```
DATABASE_URL=postgresql://...supabase pooler URL...
```

`frontend/.env`:
```
VITE_API_URL=http://localhost:3001
```

**Important:** the database is a single **shared Supabase Postgres instance** used by every teammate's local backend *and* production. There is no per-developer or seed database. Use obviously-fake data when testing locally, and clean it up via Supabase's Table Editor.

## Architecture

### Two independent apps, one shared DB
- `backend/server.js` — a single-file Express API (no router/controller split). On boot it runs `CREATE TABLE IF NOT EXISTS` for `users`, `activities`, `applications` directly against Postgres (`pg` `Pool`) — there is no separate migration system.
- `frontend/` — a Vite/React SPA that talks to the backend only through `frontend/src/api.js` (a thin `fetch` wrapper hitting `VITE_API_URL/api/...`).
- Deployment: frontend → Vercel, backend → Render, both auto-deploy on push to `main`. Env vars (`DATABASE_URL`, `VITE_API_URL`) are set in the Vercel/Render dashboards, not in git.

### Auth model (currently none — by design, tracked in TODO.md)
`POST /api/users/login` takes a name + email with no password: if the email exists it returns that user, otherwise it creates one. Every subsequent request (create/edit/delete activity, apply, accept/decline) identifies "who's asking" via a `user_id`/`creator_id` value the **client sends in the request body or query string** — the backend trusts it rather than verifying a session/token. Ownership checks (e.g. "only the creator can edit") exist in `server.js` but only compare this client-supplied id against the row's `user_id`; they do not authenticate the caller. Real authentication is an explicit backlog item (see `TODO.md`), not an oversight to silently "fix" as a side effect of unrelated work.

### Backend routes (`backend/server.js`)
All routes are flat in one file, in this order: health check → user login/get/update/photo-upload (`multer`, disk storage under `backend/uploads/`) → activities CRUD → apply-to-activity → list applications for an activity (creator-only) → accept/decline an application (creator-only). Every route follows the same manual pattern: parameterized `pg` query → inline `try/catch` → `res.status(500).json({ error: err.message })` on failure. All SQL uses parameterized (`$1`) placeholders — keep it that way; never string-concatenate user input into a query.

`GET /api/activities` is the main feed query: it joins `users` and adds three correlated subqueries per row for the viewer's application status, total application count, and accepted count.

### Frontend data flow
- `frontend/src/context/AppProvider.jsx` is the single source of app state: current user/session (persisted to `localStorage` under `cmu_activity_match_user`), the activities list, per-activity application lists, and which profile modal is open. It calls `frontend/src/api.js` and exposes actions (`login`, `createActivity`, `sendJoinRequest`, `acceptRequest`, etc.) via the `useApp()` hook — components don't call `api.js` directly except for one-off profile fetches.
- `mapActivity()` in `AppProvider.jsx` is the one place that translates raw backend rows (snake_case, e.g. `gender_restriction`, `max_people`) into the shape the UI uses (camelCase, e.g. `whoCanJoin`, `capacity`). When adding a backend field, wire it through here.
- Real component tree, driven from `App.jsx`: `AppProvider` → (`LoginScreen` | `AppShell`). `AppShell` switches between `DiscoverFeed`, `MyActivities`, and `CreateActivity`, and always renders `ProfileModal`. `DiscoverFeed`/`MyActivities` render `ActivityCard`, which composes `CategoryChip`, `SpotsIndicator`, `JoinControl` (discover variant) or `RequestList` (host variant).

### ⚠️ Legacy/unused files — do not extend these
A UI redesign (`Redisign of the UI` commit) replaced several components but left the old ones in the tree, unreferenced by any import: `BrowseActivities.jsx`, `CreateActivityForm.jsx` + `ActivityFields.jsx`, `Login.jsx`, `Profile.jsx`. These look like working duplicates of `DiscoverFeed`/`JoinControl`, `CreateActivity`, `LoginScreen`, and `ProfileModal` respectively, but nothing imports them. Before editing any component whose name sounds like a feature area ("Login", "Profile", "Create...", "Browse..."), confirm it's actually reachable from `App.jsx` — grep for its import — rather than assuming the first file you find by that name is live.

### Styling
Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.js` — v4 is CSS-config-driven; see `frontend/src/tailwind.css`). `frontend/src/lib/utils.js` exports `cn()` (clsx + tailwind-merge) for conditional class composition, used throughout components.

## Product/process principles (from `PROJECT_CONTEXT.md`)

This is an Agile-course project built **sprint by sprint** — treat `TODO.md` as the product backlog, not as pending work to implement unprompted:

- Do not build ahead of the current sprint. Features listed in `TODO.md`/`PROJECT_CONTEXT.md` (real auth, chat, recommendations, applicant-management extras, notifications, etc.) are intentionally deferred — leave them as TODOs unless asked to implement them.
- Prefer incremental changes; don't rewrite working functionality unless explicitly requested.
- Before a significant change, state which files/components will be touched and why.
- Keep the stack and abstractions simple — this is meant to stay approachable for a team with limited software-development experience.

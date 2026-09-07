# CMU Activity Match

A web app for CMU students to create, discover, and join activities with other students.

## Live app

- **App (frontend):** https://cmu-activity-match-alpha.vercel.app
- **API (backend):** https://cmu-activity-match-backend.onrender.com/api/health

Note: the backend is on Render's free tier, which "sleeps" after a period of no traffic. The first request after a while can take 30-60 seconds to wake up — that's normal, not a bug.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS, deployed on Vercel
- **Backend:** Node.js + Express, deployed on Render
- **Database:** PostgreSQL (shared, hosted on Supabase) — everyone's local dev environment connects to the **same** database as production. Be mindful when testing: use obviously fake data, and clean it up in Supabase's Table Editor when needed.

## Project Structure
cmu-activity-match/
├── frontend/ # React app (Vite + Tailwind)
├── backend/ # Express API
├── PROJECT_CONTEXT.md # Full product scope and roadmap
└── TODO.md # Future features not yet implemented

## Running the project locally

You need two terminals open at the same time, and two `.env` files that are **not** committed to git (ask a teammate for the values, don't share them in chat/Slack in plain text if you can avoid it — use a password manager or a private note).

**`backend/.env`:**
DATABASE_URL=postgresql://postgres.ndjusnwtimqseeumdfpc:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

**`frontend/.env`:**
VITE_API_URL=http://localhost:3001
(Use this value to test against your own local backend. If you want your local frontend to hit the live backend instead, use `https://cmu-activity-match-backend.onrender.com`.)

**Terminal 1 — Backend:**
cd backend
npm install
node server.js
Runs on http://localhost:3001

**Terminal 2 — Frontend:**
cd frontend
npm install
npm run dev
Runs on http://localhost:5173

## Deploying changes

- **Frontend:** push to `main` → Vercel rebuilds automatically.
- **Backend:** push to `main` → Render rebuilds automatically.
- Environment variables (`DATABASE_URL`, `VITE_API_URL`) are set directly in the Render/Vercel dashboards, not in git.

## Current Sprint Progress

- [x] Create, browse, filter, edit, delete activities
- [x] Simple user identification (name + CMU email, no password yet)
- [x] User profile (display name, bio, school year, major, languages, photo)
- [x] Request to join an activity (with optional note)
- [x] Manage applications (accept/decline)
- [x] Visual redesign (Tailwind-based design system, avatars, category colors, mobile nav)
- [ ] Real authentication (password) — next up

See `TODO.md` for the full backlog.
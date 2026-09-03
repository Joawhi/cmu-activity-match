# CMU Activity Match

A web app for CMU students to create, discover, and join activities with other students.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** SQLite (local file, `backend/activities.db`, not tracked by git)

## Project Structure

cmu-activity-match/
├── frontend/ # React app
├── backend/ # Express API + SQLite database
├── PROJECT_CONTEXT.md # Full product scope and roadmap
└── TODO.md # Future features not yet implemented

## Running the project locally

You need two terminals open at the same time.

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

## Current Sprint

- [x] Create an activity (title, description, date/time, location, max people, category, gender restriction)
- [x] View all activities in a list

See `TODO.md` for planned features not yet built.
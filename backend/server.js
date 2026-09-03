const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./activities.db');

// Users table. NOTE: no password yet — this is a simplified identity step,
// not real authentication. TODO: add password + real login in a future sprint.
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    datetime TEXT,
    location TEXT,
    max_people INTEGER,
    category TEXT,
    gender_restriction TEXT DEFAULT 'none',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: add user_id to activities if this local database was created
// before this feature existed. Safe to run every time the server starts.
db.run('ALTER TABLE activities ADD COLUMN user_id INTEGER', () => {
  // If the column already exists, SQLite errors here — that's fine, we ignore it.
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// "Log in": if this email already exists, return that user.
// Otherwise create a new one. TODO: replace with real authentication.
app.post('/api/users/login', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (existingUser) {
      return res.json(existingUser);
    }

    db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, name, email });
    });
  });
});

// Create a new activity
app.post('/api/activities', (req, res) => {
  const { title, description, datetime, location, max_people, category, gender_restriction, user_id } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const sql = `
    INSERT INTO activities (title, description, datetime, location, max_people, category, gender_restriction, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    sql,
    [title, description, datetime, location, max_people, category, gender_restriction || 'none', user_id || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Get all activities, including the creator's name
app.get('/api/activities', (req, res) => {
  const sql = `
    SELECT activities.*, users.name AS creator_name
    FROM activities
    LEFT JOIN users ON activities.user_id = users.id
    ORDER BY activities.created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
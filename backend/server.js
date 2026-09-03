const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Connect to (or create) the database file
const db = new sqlite3.Database('./activities.db');

// Create the activities table if it doesn't exist yet
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

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Create a new activity
app.post('/api/activities', (req, res) => {
  const { title, description, datetime, location, max_people, category, gender_restriction } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const sql = `
    INSERT INTO activities (title, description, datetime, location, max_people, category, gender_restriction)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [title, description, datetime, location, max_people, category, gender_restriction || 'none'], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Get all activities
app.get('/api/activities', (req, res) => {
  db.all('SELECT * FROM activities ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});
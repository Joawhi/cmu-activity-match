require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

fs.mkdirSync('uploads', { recursive: true });
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Connect to the shared Postgres database (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setupTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT,
      bio TEXT,
      school_year TEXT,
      major TEXT,
      languages TEXT,
      profile_image TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      datetime TEXT,
      location TEXT,
      max_people INTEGER,
      category TEXT,
      gender_restriction TEXT DEFAULT 'none',
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      activity_id INTEGER REFERENCES activities(id),
      user_id INTEGER REFERENCES users(id),
      note TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

setupTables().catch((err) => console.error('Error setting up tables:', err));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// "Log in": if this email already exists, return that user.
// Otherwise create a new one. TODO: replace with real authentication.
app.post('/api/users/login', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { display_name, bio, school_year, major, languages } = req.body;
    await pool.query(
      `UPDATE users SET display_name = $1, bio = $2, school_year = $3, major = $4, languages = $5 WHERE id = $6`,
      [display_name, bio, school_year, major, languages, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }
    await pool.query('UPDATE users SET profile_image = $1 WHERE id = $2', [req.file.filename, req.params.id]);
    res.json({ success: true, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const { title, description, datetime, location, max_people, category, gender_restriction, user_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO activities (title, description, datetime, location, max_people, category, gender_restriction, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [title, description, datetime, location, max_people || null, category, gender_restriction || 'none', user_id || null]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const viewerId = req.query.viewer_id || null;

    const result = await pool.query(
      `
      SELECT activities.*,
        users.name AS creator_name,
        users.display_name AS creator_display_name,
        (SELECT status FROM applications WHERE applications.activity_id = activities.id AND applications.user_id = $1) AS my_application_status,
        (SELECT COUNT(*)::int FROM applications WHERE applications.activity_id = activities.id) AS application_count
      FROM activities
      LEFT JOIN users ON activities.user_id = users.id
      ORDER BY activities.created_at DESC
      `,
      [viewerId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, datetime, location, max_people, category, gender_restriction, user_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const existing = await pool.query('SELECT * FROM activities WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if (existing.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'You can only edit your own activities' });
    }

    await pool.query(
      `UPDATE activities
       SET title = $1, description = $2, datetime = $3, location = $4, max_people = $5, category = $6, gender_restriction = $7
       WHERE id = $8`,
      [title, description, datetime, location, max_people || null, category, gender_restriction || 'none', id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(req.query.user_id);

    const existing = await pool.query('SELECT * FROM activities WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if (existing.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own activities' });
    }

    await pool.query('DELETE FROM activities WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activities/:id/apply', async (req, res) => {
  try {
    const activityId = req.params.id;
    const { user_id, note } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const activityResult = await pool.query('SELECT * FROM activities WHERE id = $1', [activityId]);
    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if (activityResult.rows[0].user_id === user_id) {
      return res.status(400).json({ error: "You can't apply to your own activity" });
    }

    const existing = await pool.query(
      'SELECT * FROM applications WHERE activity_id = $1 AND user_id = $2',
      [activityId, user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already applied to this activity' });
    }

    const result = await pool.query(
      'INSERT INTO applications (activity_id, user_id, note) VALUES ($1, $2, $3) RETURNING id',
      [activityId, user_id, note || '']
    );
    res.status(201).json({ id: result.rows[0].id, status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
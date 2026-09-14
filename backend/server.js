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
      budget_total NUMERIC(10,2) DEFAULT 0,
      budget_note TEXT,
      transport_method TEXT,
      transport_note TEXT,
      duration_hours NUMERIC(4,1),
      application_deadline TIMESTAMPTZ,
      participation_requirements TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // CREATE TABLE IF NOT EXISTS does not add columns to a table that already
  // exists, so any column added after the first deploy must also be declared
  // here. Idempotent and additive — safe to run on every boot.
  await pool.query(`
    ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS budget_total NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS budget_note TEXT,
      ADD COLUMN IF NOT EXISTS transport_method TEXT,
      ADD COLUMN IF NOT EXISTS transport_note TEXT,
      ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(4,1),
      ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS participation_requirements TEXT
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

// Returns { ok: true, value } or { ok: false, error }.
// 0 is a valid budget (a free activity), so only missing, non-numeric or
// negative values are rejected — never a falsy check.
function parseBudgetTotal(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: false, error: 'Estimated budget is required' };
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: 'Estimated budget must be a number of 0 or more' };
  }
  return { ok: true, value };
}

// Group size (max_people) is the TOTAL headcount and includes the organizer,
// so the most applicants that can be accepted is max_people - 1.
// null/0 (legacy rows) means the activity has no limit.
// Must stay in sync with isActivityFull() in frontend/src/lib/helpers.js.
function isActivityFull(maxPeople, acceptedCount) {
  const limit = Number(maxPeople) || 0;
  return limit > 0 && (Number(acceptedCount) || 0) + 1 >= limit;
}

// Must stay in sync with TRANSPORT_OPTIONS in frontend/src/constants.js.
const TRANSPORT_METHODS = ['walk', 'transit', 'drive', 'rideshare', 'bike'];

// The three fields below are optional: missing/null/'' parses to null.
// But a value that IS supplied must be valid — never silently dropped.

function parseTransportMethod(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string' || !TRANSPORT_METHODS.includes(raw)) {
    return { ok: false, error: `Transport method must be one of: ${TRANSPORT_METHODS.join(', ')}` };
  }
  return { ok: true, value: raw };
}

function parseDurationHours(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 24) {
    return { ok: false, error: 'Estimated duration must be a number of hours between 0 and 24' };
  }
  return { ok: true, value };
}

// Only accepts an absolute instant. A zone-less string like '2026-10-03T18:00'
// would be read in the server's timezone, which silently shifts the cutoff in
// production — reject it so that class of bug cannot reach the database.
function parseApplicationDeadline(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string' || !/(Z|[+-]\d{2}:?\d{2})$/.test(raw)) {
    return { ok: false, error: 'Application deadline must include a timezone offset' };
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: 'Application deadline is not a valid date' };
  }
  return { ok: true, value: date };
}

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
    const { title, description, datetime, location, max_people, category, gender_restriction, user_id, budget_total, budget_note, transport_method, transport_note, duration_hours, application_deadline, participation_requirements } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const budget = parseBudgetTotal(budget_total);
    if (!budget.ok) {
      return res.status(400).json({ error: budget.error });
    }

    const transport = parseTransportMethod(transport_method);
    if (!transport.ok) {
      return res.status(400).json({ error: transport.error });
    }

    const duration = parseDurationHours(duration_hours);
    if (!duration.ok) {
      return res.status(400).json({ error: duration.error });
    }

    const deadline = parseApplicationDeadline(application_deadline);
    if (!deadline.ok) {
      return res.status(400).json({ error: deadline.error });
    }

    const result = await pool.query(
      `INSERT INTO activities (title, description, datetime, location, max_people, category, gender_restriction, user_id, budget_total, budget_note, transport_method, transport_note, duration_hours, application_deadline, participation_requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [title, description, datetime, location, max_people || null, category, gender_restriction || 'none', user_id || null, budget.value, (budget_note || '').trim() || null,
       transport.value, (transport_note || '').trim() || null, duration.value, deadline.value, (participation_requirements || '').trim() || null]
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
        users.profile_image AS creator_photo,
        -- A person can withdraw and apply again, so (activity_id, user_id) is NOT
        -- unique. LIMIT 1 is what keeps this scalar subquery legal — without it a
        -- single re-application 500s this whole feed for every user. Order by id,
        -- not created_at: created_at defaults to NOW(), which is the transaction
        -- timestamp, so a withdraw and an immediate re-apply can tie.
        (SELECT status FROM applications
         WHERE applications.activity_id = activities.id AND applications.user_id = $1
         ORDER BY applications.id DESC LIMIT 1) AS my_application_status,
        (SELECT COUNT(*)::int FROM applications
         WHERE applications.activity_id = activities.id
           AND applications.status IS DISTINCT FROM 'withdrawn') AS application_count,
        (SELECT COUNT(*)::int FROM applications WHERE applications.activity_id = activities.id AND applications.status = 'accepted') AS accepted_count
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
    const { title, description, datetime, location, max_people, category, gender_restriction, user_id, budget_total, budget_note, transport_method, transport_note, duration_hours, application_deadline, participation_requirements } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const budget = parseBudgetTotal(budget_total);
    if (!budget.ok) {
      return res.status(400).json({ error: budget.error });
    }

    const transport = parseTransportMethod(transport_method);
    if (!transport.ok) {
      return res.status(400).json({ error: transport.error });
    }

    const duration = parseDurationHours(duration_hours);
    if (!duration.ok) {
      return res.status(400).json({ error: duration.error });
    }

    const deadline = parseApplicationDeadline(application_deadline);
    if (!deadline.ok) {
      return res.status(400).json({ error: deadline.error });
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
       SET title = $1, description = $2, datetime = $3, location = $4, max_people = $5, category = $6, gender_restriction = $7,
           budget_total = $9, budget_note = $10,
           transport_method = $11, transport_note = $12, duration_hours = $13, application_deadline = $14,
           participation_requirements = $15
       WHERE id = $8`,
      [title, description, datetime, location, max_people || null, category, gender_restriction || 'none', id, budget.value, (budget_note || '').trim() || null,
       transport.value, (transport_note || '').trim() || null, duration.value, deadline.value, (participation_requirements || '').trim() || null]
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

    const activityResult = await pool.query(
      `SELECT activities.*,
         (SELECT COUNT(*)::int FROM applications
          WHERE applications.activity_id = activities.id
            AND applications.status = 'accepted') AS accepted_count
       FROM activities WHERE activities.id = $1`,
      [activityId]
    );
    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if (activityResult.rows[0].user_id === user_id) {
      return res.status(400).json({ error: "You can't apply to your own activity" });
    }

    // node-postgres parses TIMESTAMPTZ into a Date, so both sides here are
    // epoch milliseconds — the result cannot shift with the server's timezone.
    const deadlineValue = activityResult.rows[0].application_deadline;
    if (deadlineValue && deadlineValue.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'The deadline to apply for this activity has passed' });
    }

    // A withdrawn row is history, not a live application — that person may apply
    // again. Anything else (pending/accepted/declined, or a legacy NULL) still
    // blocks; re-applying after a decline stays disallowed. IS DISTINCT FROM is
    // NULL-safe, where `<> 'withdrawn'` would yield NULL and let the row through.
    const existing = await pool.query(
      `SELECT 1 FROM applications
       WHERE activity_id = $1 AND user_id = $2
         AND status IS DISTINCT FROM 'withdrawn'
       LIMIT 1`,
      [activityId, user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already applied to this activity' });
    }

    // Evaluated live on every request — statuses are never batch-written, so a
    // decline frees the spot again immediately.
    const activity = activityResult.rows[0];
    if (isActivityFull(activity.max_people, activity.accepted_count)) {
      return res.status(400).json({ error: 'This activity is already full' });
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

// Withdraw your own application: "Withdraw" a pending request, or "Leave" an
// accepted place. Leaving frees the spot for free — accepted_count is derived
// live, and a withdrawn row is not accepted.
// The row is located by (activity_id, user_id), so a caller can only ever reach
// their own application; there is no id to guess.
// Deliberately NOT gated on the deadline: leaving must always be possible.
app.delete('/api/activities/:id/apply', async (req, res) => {
  try {
    const activityId = req.params.id;
    const userId = Number(req.query.user_id);

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const activityResult = await pool.query('SELECT id FROM activities WHERE id = $1', [activityId]);
    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // One conditional statement, so there is no window between finding the row
    // and writing it. Newest row wins, matching my_application_status.
    // 'declined' is excluded on purpose: letting someone launder a rejection
    // into a withdrawal would let them re-apply and undo the organizer.
    const result = await pool.query(
      `UPDATE applications SET status = 'withdrawn'
       WHERE id = (
         SELECT id FROM applications
         WHERE activity_id = $1 AND user_id = $2
           AND status IN ('pending', 'accepted')
         ORDER BY id DESC
         LIMIT 1
       )
       RETURNING id`,
      [activityId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "You don't have an active request for this activity" });
    }

    res.json({ success: true, status: 'withdrawn' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all applications for one activity (only the creator can view this)
app.get('/api/activities/:id/applications', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(req.query.user_id);

    const activityResult = await pool.query('SELECT * FROM activities WHERE id = $1', [id]);
    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if (activityResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Only the creator can view applications' });
    }

    const result = await pool.query(
      `
      SELECT applications.*, users.name AS applicant_name, users.display_name AS applicant_display_name,
      users.profile_image AS applicant_photo, users.school_year AS applicant_school_year
      FROM applications
      JOIN users ON applications.user_id = users.id
      WHERE applications.activity_id = $1
      ORDER BY applications.created_at ASC
      `,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept or decline an application (only the activity's creator can do this)
app.put('/api/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, creator_id } = req.body;

    // 'withdrawn' is intentionally absent and this check is load-bearing: only
    // the applicant can withdraw, via DELETE /api/activities/:id/apply.
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or declined' });
    }

    const appResult = await pool.query(
      `SELECT applications.*,
         activities.user_id AS activity_owner_id,
         activities.max_people,
         (SELECT COUNT(*)::int FROM applications AS accepted
          WHERE accepted.activity_id = applications.activity_id
            AND accepted.status = 'accepted') AS accepted_count
       FROM applications
       JOIN activities ON applications.activity_id = activities.id
       WHERE applications.id = $1`,
      [id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (appResult.rows[0].activity_owner_id !== creator_id) {
      return res.status(403).json({ error: 'Only the activity creator can manage this application' });
    }

    const application = appResult.rows[0];
    // The organizer must not be able to pull someone back into a spot they
    // chose to leave.
    if (application.status === 'withdrawn') {
      return res.status(400).json({ error: 'This person withdrew their request' });
    }

    // Declining must always work, even when full — that is how a spot is freed.
    // Re-accepting someone already accepted is a no-op: accepted_count already
    // counts this row, so skipping the check avoids a false "full".
    // Not transactional: the only realistic race is one organizer double-clicking
    // two different rows, whose worst case is one extra accepted person (the UI
    // clamps and still reads "Full"). A conditional UPDATE would not fix it —
    // under READ COMMITTED both statements read the pre-commit count — and the
    // real fix (SELECT ... FOR UPDATE on the activity) is not worth it here.
    if (status === 'accepted' && application.status !== 'accepted'
        && isActivityFull(application.max_people, application.accepted_count)) {
      return res.status(400).json({ error: 'This activity is already full' });
    }

    await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
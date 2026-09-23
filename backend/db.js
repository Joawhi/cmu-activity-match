const { Pool } = require('pg');

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id SERIAL PRIMARY KEY,
      activity_id INTEGER UNIQUE NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE chat_rooms
      DROP CONSTRAINT IF EXISTS chat_rooms_activity_id_fkey,
      ADD CONSTRAINT chat_rooms_activity_id_fkey
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
  `);

  await pool.query(`
    INSERT INTO chat_rooms (activity_id)
    SELECT activities.id
    FROM activities
    LEFT JOIN chat_rooms ON chat_rooms.activity_id = activities.id
    WHERE chat_rooms.id IS NULL
    ON CONFLICT (activity_id) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_room_members (
      chat_room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (chat_room_id, user_id)
    )
  `);

  await pool.query(`
    ALTER TABLE chat_room_members
      ADD COLUMN IF NOT EXISTS left_at TIMESTAMP
  `);

  await pool.query(`
    INSERT INTO chat_room_members (chat_room_id, user_id)
    SELECT chat_rooms.id, activities.user_id
    FROM chat_rooms
    JOIN activities ON activities.id = chat_rooms.activity_id
    WHERE activities.user_id IS NOT NULL
    ON CONFLICT (chat_room_id, user_id) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO chat_room_members (chat_room_id, user_id)
    SELECT chat_rooms.id, applications.user_id
    FROM applications
    JOIN chat_rooms ON chat_rooms.activity_id = applications.activity_id
    WHERE applications.status = 'accepted'
      AND applications.user_id IS NOT NULL
    ON CONFLICT (chat_room_id, user_id) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_user_created_idx
      ON notifications (user_id, created_at DESC)
  `);

  // One upcoming reminder per person per activity. A later visit must not
  // create a second copy of the same reminder.
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS notifications_one_reminder_idx
      ON notifications (user_id, activity_id)
      WHERE type = 'activity_reminder'
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      chat_room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

module.exports = { pool, setupTables };
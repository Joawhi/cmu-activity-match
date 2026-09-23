const { NOTIFICATION_TYPE } = require('../constants');

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

async function insertNotification(db, { userId, type, title, body, activityId }) {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, body, activity_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, title, body || '', activityId ?? null]
  );
}

async function displayName(db, userId) {
  const result = await db.query(
    `SELECT COALESCE(NULLIF(display_name, ''), NULLIF(name, ''), 'Someone') AS name
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0]?.name || 'Someone';
}

// People with a live application (pending or accepted), except the person
// who caused the change.
async function notifyApplicants(db, { activityId, excludeUserId, statuses, type, title, body }) {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, body, activity_id)
     SELECT DISTINCT applications.user_id, $2, $3, $4, $5::int
     FROM applications
     WHERE applications.activity_id = $1::int
       AND applications.status = ANY($6::text[])
       AND applications.user_id IS NOT NULL
       AND ($7::int IS NULL OR applications.user_id IS DISTINCT FROM $7::int)`,
    [activityId, type, title, body || '', activityId, statuses, excludeUserId ?? null]
  );
}

function eventTime(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

// Creates at most one reminder when an activity the user is attending
// (as organizer or accepted participant) starts within the next 24 hours.
async function ensureUpcomingReminders(db, userId) {
  const result = await db.query(
    `SELECT DISTINCT activities.id, activities.title, activities.datetime
     FROM activities
     LEFT JOIN applications
       ON applications.activity_id = activities.id
      AND applications.user_id = $1
      AND applications.status = 'accepted'
     WHERE activities.user_id = $1
        OR applications.user_id = $1`,
    [userId]
  );

  const now = Date.now();
  const horizon = now + REMINDER_WINDOW_MS;

  for (const activity of result.rows) {
    const when = eventTime(activity.datetime);
    if (when == null || when <= now || when > horizon) continue;

    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, activity_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, activity_id) WHERE type = 'activity_reminder' DO NOTHING`,
      [
        userId,
        NOTIFICATION_TYPE.ACTIVITY_REMINDER,
        'Coming up',
        `${activity.title} starts within 24 hours.`,
        activity.id,
      ]
    );
  }
}

module.exports = {
  insertNotification,
  displayName,
  notifyApplicants,
  ensureUpcomingReminders,
};

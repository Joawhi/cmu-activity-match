const express = require('express');
const { pool } = require('../db');
const { handleServerError } = require('../utils/errors');
const { GENDER_RESTRICTION, APPLICATION_STATUS, ACTIVITY_STATUS, NOTIFICATION_TYPE } = require('../constants');
const { insertNotification, displayName, notifyApplicants } = require('../utils/notifications');
const {
  parseRequiredText,
  parseOptionalText,
  parseBudgetTotal,
  parseTransportMethod,
  parseDurationHours,
  parseApplicationDeadline,
  isActivityFull,
} = require('../utils/validators');

const router = express.Router();

function validateActivityInput(body) {
  const title = parseRequiredText(body.title, 'title');
  if (!title.ok) return title;

  const description = parseOptionalText(body.description, 'description');
  if (!description.ok) return description;

  const location = parseOptionalText(body.location, 'location');
  if (!location.ok) return location;

  const budget = parseBudgetTotal(body.budget_total);
  if (!budget.ok) return budget;

  const budgetNote = parseOptionalText(body.budget_note, 'budgetNote');
  if (!budgetNote.ok) return budgetNote;

  const transport = parseTransportMethod(body.transport_method);
  if (!transport.ok) return transport;

  const transportNote = parseOptionalText(body.transport_note, 'transportNote');
  if (!transportNote.ok) return transportNote;

  const duration = parseDurationHours(body.duration_hours);
  if (!duration.ok) return duration;

  const deadline = parseApplicationDeadline(body.application_deadline);
  if (!deadline.ok) return deadline;

  const requirements = parseOptionalText(body.participation_requirements, 'participationRequirements');
  if (!requirements.ok) return requirements;

  return {
    ok: true,
    value: {
      title: title.value,
      description: description.value,
      location: location.value,
      budgetTotal: budget.value,
      budgetNote: budgetNote.value,
      transportMethod: transport.value,
      transportNote: transportNote.value,
      durationHours: duration.value,
      applicationDeadline: deadline.value,
      requirements: requirements.value,
    },
  };
}

function asText(value) {
  return value == null ? '' : String(value).trim();
}

function asNumber(value) {
  if (value == null || value === '') return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : asText(value);
}

function asTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? asText(value) : String(parsed.getTime());
}

function activityDetailsChanged(existing, next) {
  return (
    asText(existing.title) !== asText(next.title) ||
    asText(existing.description) !== asText(next.description) ||
    asText(existing.datetime) !== asText(next.datetime) ||
    asText(existing.location) !== asText(next.location) ||
    asNumber(existing.max_people) !== asNumber(next.maxPeople) ||
    asText(existing.category) !== asText(next.category) ||
    asText(existing.gender_restriction) !== asText(next.genderRestriction) ||
    asNumber(existing.budget_total) !== asNumber(next.budgetTotal) ||
    asText(existing.budget_note) !== asText(next.budgetNote) ||
    asText(existing.transport_method) !== asText(next.transportMethod) ||
    asText(existing.transport_note) !== asText(next.transportNote) ||
    asNumber(existing.duration_hours) !== asNumber(next.durationHours) ||
    asTime(existing.application_deadline) !== asTime(next.applicationDeadline) ||
    asText(existing.participation_requirements) !== asText(next.requirements)
  );
}

router.post('/', async (req, res) => {
  let client;
  try {
    const { datetime, max_people, category, gender_restriction, user_id } = req.body;

    const parsed = validateActivityInput(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const a = parsed.value;

    client = await pool.connect();
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO activities (title, description, datetime, location, max_people, category, gender_restriction, user_id, budget_total, budget_note, transport_method, transport_note, duration_hours, application_deadline, participation_requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [a.title, a.description, datetime, a.location, max_people || null, category, gender_restriction || GENDER_RESTRICTION.NONE, user_id || null,
      a.budgetTotal, a.budgetNote, a.transportMethod, a.transportNote, a.durationHours, a.applicationDeadline, a.requirements]
    );

    const chatRoomResult = await client.query(
      'INSERT INTO chat_rooms (activity_id) VALUES ($1) ON CONFLICT (activity_id) DO UPDATE SET activity_id = EXCLUDED.activity_id RETURNING id',
      [result.rows[0].id]
    );

    if (user_id) {
      await client.query(
        `INSERT INTO chat_room_members (chat_room_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (chat_room_id, user_id) DO NOTHING`,
        [chatRoomResult.rows[0].id, user_id]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => { });
    }
    handleServerError(err, res);
  } finally {
    client?.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const viewerId = req.query.viewer_id || null;

    // Optimized: per-activity applicant counts are now computed once via a
    // GROUP BY (not re-scanned per row), and the viewer's own status uses a
    // LEFT JOIN LATERAL instead of a correlated subquery in the SELECT list —
    // both are set-based operations the Postgres planner executes far more
    // efficiently than the previous 3-correlated-subqueries-per-row version.
    const result = await pool.query(
      `
      SELECT activities.*,
        users.name AS creator_name,
        users.display_name AS creator_display_name,
        users.profile_image AS creator_photo,
        my_app.status AS my_application_status,
        COALESCE(counts.application_count, 0) AS application_count,
        COALESCE(counts.accepted_count, 0) AS accepted_count
      FROM activities
      LEFT JOIN users ON activities.user_id = users.id
      LEFT JOIN LATERAL (
        SELECT status FROM applications
        WHERE applications.activity_id = activities.id AND applications.user_id = $1
        ORDER BY applications.id DESC
        LIMIT 1
      ) my_app ON true
      LEFT JOIN (
        SELECT activity_id,
          COUNT(*) FILTER (WHERE status IS DISTINCT FROM 'withdrawn')::int AS application_count,
          COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted_count
        FROM applications
        GROUP BY activity_id
      ) counts ON counts.activity_id = activities.id
      ORDER BY activities.created_at DESC
      `,
      [viewerId]
    );
    res.json(result.rows);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.put('/:id', async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    const { datetime, max_people, category, gender_restriction, user_id } = req.body;

    const parsed = validateActivityInput(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const a = parsed.value;
    const stored = {
      ...a,
      datetime,
      maxPeople: max_people || null,
      category,
      genderRestriction: gender_restriction || GENDER_RESTRICTION.NONE,
    };

    const existing = await pool.query('SELECT * FROM activities WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if (existing.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'You can only edit your own activities' });
    }
    if (existing.rows[0].status === ACTIVITY_STATUS.CANCELLED) {
      return res.status(400).json({ error: 'This activity was cancelled' });
    }

    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(
      `UPDATE activities
       SET title = $1, description = $2, datetime = $3, location = $4, max_people = $5, category = $6, gender_restriction = $7,
           budget_total = $9, budget_note = $10,
           transport_method = $11, transport_note = $12, duration_hours = $13, application_deadline = $14,
           participation_requirements = $15
       WHERE id = $8`,
      [stored.title, stored.description, stored.datetime, stored.location, stored.maxPeople, stored.category, stored.genderRestriction, id,
      stored.budgetTotal, stored.budgetNote, stored.transportMethod, stored.transportNote, stored.durationHours, stored.applicationDeadline, stored.requirements]
    );

    if (activityDetailsChanged(existing.rows[0], stored)) {
      await notifyApplicants(client, {
        activityId: id,
        excludeUserId: user_id,
        statuses: [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.PENDING],
        type: NOTIFICATION_TYPE.ACTIVITY_UPDATED,
        title: 'Activity updated',
        body: `${stored.title} was updated.`,
      });
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => { });
    }
    handleServerError(err, res);
  } finally {
    client?.release();
  }
});

router.delete('/:id', async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    const userId = Number(req.query.user_id);

    const existing = await pool.query('SELECT * FROM activities WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if (existing.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only remove your own activities' });
    }
    if (existing.rows[0].status === ACTIVITY_STATUS.CANCELLED) {
      return res.status(400).json({ error: 'This activity is already cancelled' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    const accepted = await client.query(
      `SELECT COUNT(*)::int AS accepted_count
       FROM applications
       WHERE activity_id = $1 AND status = 'accepted'`,
      [id]
    );

    if (accepted.rows[0].accepted_count > 0) {
      await client.query(
        `UPDATE activities SET status = $1 WHERE id = $2`,
        [ACTIVITY_STATUS.CANCELLED, id]
      );
      await notifyApplicants(client, {
        activityId: id,
        excludeUserId: userId,
        statuses: [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.PENDING],
        type: NOTIFICATION_TYPE.ACTIVITY_CANCELLED,
        title: 'Activity cancelled',
        body: `${existing.rows[0].title} was cancelled.`,
      });
      await client.query('COMMIT');
      res.json({ success: true, status: ACTIVITY_STATUS.CANCELLED });
      return;
    }

    await notifyApplicants(client, {
      activityId: id,
      excludeUserId: userId,
      statuses: [APPLICATION_STATUS.PENDING],
      type: NOTIFICATION_TYPE.ACTIVITY_DELETED,
      title: 'Activity deleted',
      body: `${existing.rows[0].title} was deleted.`,
      keepActivityLink: false,
    });
    await client.query('DELETE FROM applications WHERE activity_id = $1', [id]);
    await client.query('DELETE FROM activities WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true, status: 'deleted' });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => { });
    }
    handleServerError(err, res);
  } finally {
    client?.release();
  }
});

router.post('/:id/apply', async (req, res) => {
  let client;
  try {
    const activityId = req.params.id;
    const { user_id, note } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const noteParsed = parseOptionalText(note, 'note');
    if (!noteParsed.ok) {
      return res.status(400).json({ error: noteParsed.error });
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
    if (activityResult.rows[0].status === ACTIVITY_STATUS.CANCELLED) {
      return res.status(400).json({ error: 'This activity was cancelled' });
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

    const applicantName = await displayName(pool, user_id);
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO applications (activity_id, user_id, note) VALUES ($1, $2, $3) RETURNING id',
      [activityId, user_id, noteParsed.value || '']
    );
    await insertNotification(client, {
      userId: user_id,
      type: NOTIFICATION_TYPE.APPLICATION_SUBMITTED,
      title: 'Application sent',
      body: `You applied to ${activity.title}.`,
      activityId,
    });
    if (activity.user_id) {
      await insertNotification(client, {
        userId: activity.user_id,
        type: NOTIFICATION_TYPE.APPLICATION_RECEIVED,
        title: 'New application',
        body: `${applicantName} applied to ${activity.title}.`,
        activityId,
      });
    }
    await client.query('COMMIT');
    res.status(201).json({ id: result.rows[0].id, status: APPLICATION_STATUS.PENDING });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => { });
    }
    handleServerError(err, res);
  } finally {
    client?.release();
  }
});

// Withdraw your own application: "Withdraw" a pending request, or "Leave" an
// accepted place. Leaving frees the spot for free — accepted_count is derived
// live, and a withdrawn row is not accepted.
// The row is located by (activity_id, user_id), so a caller can only ever reach
// their own application; there is no id to guess.
// Deliberately NOT gated on the deadline: leaving must always be possible.
router.delete('/:id/apply', async (req, res) => {
  let client;
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

    client = await pool.connect();
    await client.query('BEGIN');

    // Lock the newest active request so the membership timestamp and status
    // change happen together.
    const applicationResult = await client.query(
      `SELECT applications.id, applications.status,
              activities.user_id AS organizer_id,
              activities.title
       FROM applications
       JOIN activities ON activities.id = applications.activity_id
       WHERE applications.activity_id = $1 AND applications.user_id = $2
         AND applications.status IN ('pending', 'accepted')
       ORDER BY applications.id DESC
       LIMIT 1
       FOR UPDATE OF applications`,
      [activityId, userId]
    );

    if (applicationResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "You don't have an active request for this activity" });
    }

    if (applicationResult.rows[0].status === APPLICATION_STATUS.ACCEPTED) {
      await client.query(
        `UPDATE chat_room_members
         SET left_at = NOW()
         WHERE user_id = $1
           AND chat_room_id = (SELECT id FROM chat_rooms WHERE activity_id = $2)
           AND left_at IS NULL`,
        [userId, activityId]
      );
    }

    const application = applicationResult.rows[0];
    await client.query(
      'UPDATE applications SET status = \'withdrawn\' WHERE id = $1',
      [application.id]
    );

    if (application.organizer_id && application.organizer_id !== userId) {
      const applicantName = await displayName(client, userId);
      const left = application.status === APPLICATION_STATUS.ACCEPTED;
      await insertNotification(client, {
        userId: application.organizer_id,
        type: left ? NOTIFICATION_TYPE.PARTICIPANT_LEFT : NOTIFICATION_TYPE.APPLICATION_WITHDRAWN,
        title: left ? 'Someone left' : 'Application withdrawn',
        body: left
          ? `${applicantName} left ${application.title}.`
          : `${applicantName} withdrew their application to ${application.title}.`,
        activityId,
      });
    }

    await client.query('COMMIT');

    res.json({ success: true, status: APPLICATION_STATUS.WITHDRAWN });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => { });
    }
    handleServerError(err, res);
  } finally {
    client?.release();
  }
});

// Get all applications for one activity (only the creator can view this)
router.get('/:id/applications', async (req, res) => {
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
    handleServerError(err, res);
  }
});

module.exports = router;
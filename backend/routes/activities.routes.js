const express = require('express');
const { pool } = require('../db');
const { handleServerError } = require('../utils/errors');
const { GENDER_RESTRICTION, APPLICATION_STATUS } = require('../constants');
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

router.post('/', async (req, res) => {
  try {
    const { datetime, max_people, category, gender_restriction, user_id } = req.body;

    const parsed = validateActivityInput(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const a = parsed.value;

    const result = await pool.query(
      `INSERT INTO activities (title, description, datetime, location, max_people, category, gender_restriction, user_id, budget_total, budget_note, transport_method, transport_note, duration_hours, application_deadline, participation_requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [a.title, a.description, datetime, a.location, max_people || null, category, gender_restriction || GENDER_RESTRICTION.NONE, user_id || null,
       a.budgetTotal, a.budgetNote, a.transportMethod, a.transportNote, a.durationHours, a.applicationDeadline, a.requirements]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    handleServerError(err, res);
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
  try {
    const { id } = req.params;
    const { datetime, max_people, category, gender_restriction, user_id } = req.body;

    const parsed = validateActivityInput(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const a = parsed.value;

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
      [a.title, a.description, datetime, a.location, max_people || null, category, gender_restriction || GENDER_RESTRICTION.NONE, id,
       a.budgetTotal, a.budgetNote, a.transportMethod, a.transportNote, a.durationHours, a.applicationDeadline, a.requirements]
    );
    res.json({ success: true });
  } catch (err) {
    handleServerError(err, res);
  }
});

router.delete('/:id', async (req, res) => {
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
    handleServerError(err, res);
  }
});

router.post('/:id/apply', async (req, res) => {
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
      [activityId, user_id, noteParsed.value || '']
    );
    res.status(201).json({ id: result.rows[0].id, status: APPLICATION_STATUS.PENDING });
  } catch (err) {
    handleServerError(err, res);
  }
});

// Withdraw your own application: "Withdraw" a pending request, or "Leave" an
// accepted place. Leaving frees the spot for free — accepted_count is derived
// live, and a withdrawn row is not accepted.
// The row is located by (activity_id, user_id), so a caller can only ever reach
// their own application; there is no id to guess.
// Deliberately NOT gated on the deadline: leaving must always be possible.
router.delete('/:id/apply', async (req, res) => {
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

    res.json({ success: true, status: APPLICATION_STATUS.WITHDRAWN });
  } catch (err) {
    handleServerError(err, res);
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
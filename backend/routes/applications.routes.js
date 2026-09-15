const express = require('express');
const { pool } = require('../db');
const { handleServerError } = require('../utils/errors');
const { APPLICATION_STATUS } = require('../constants');
const { isActivityFull } = require('../utils/validators');

const router = express.Router();

// Accept or decline an application (only the activity's creator can do this)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, creator_id } = req.body;

    // 'withdrawn' is intentionally absent and this check is load-bearing: only
    // the applicant can withdraw, via DELETE /api/activities/:id/apply.
    if (![APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.DECLINED].includes(status)) {
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
    if (application.status === APPLICATION_STATUS.WITHDRAWN) {
      return res.status(400).json({ error: 'This person withdrew their request' });
    }

    // Declining must always work, even when full — that is how a spot is freed.
    // Not transactional: the only realistic race is one organizer double-clicking
    // two different rows; the real fix (SELECT ... FOR UPDATE) is not worth it here.
    if (status === APPLICATION_STATUS.ACCEPTED && application.status !== APPLICATION_STATUS.ACCEPTED
        && isActivityFull(application.max_people, application.accepted_count)) {
      return res.status(400).json({ error: 'This activity is already full' });
    }

    await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    handleServerError(err, res);
  }
});

module.exports = router;
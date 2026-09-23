const express = require('express');
const { pool } = require('../db');
const { handleServerError } = require('../utils/errors');
const { APPLICATION_STATUS, ACTIVITY_STATUS, NOTIFICATION_TYPE } = require('../constants');
const { isActivityFull } = require('../utils/validators');
const { insertNotification } = require('../utils/notifications');

const router = express.Router();

// Accept or decline an application (only the activity's creator can do this)
router.put('/:id', async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    const { status, creator_id } = req.body;

    // 'withdrawn' is intentionally absent and this check is load-bearing: only
    // the applicant can withdraw, via DELETE /api/activities/:id/apply.
    if (![APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.DECLINED].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or declined' });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    const appResult = await client.query(
      `SELECT applications.*,
         activities.user_id AS activity_owner_id,
         activities.max_people,
         activities.title AS activity_title,
         activities.status AS activity_status,
         COALESCE(NULLIF(users.display_name, ''), NULLIF(users.name, ''), 'Someone') AS applicant_name
       FROM applications
       JOIN activities ON applications.activity_id = activities.id
       JOIN users ON users.id = applications.user_id
       WHERE applications.id = $1
       FOR UPDATE OF applications, activities`,
      [id]
    );

    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found' });
    }
    if (appResult.rows[0].activity_owner_id !== creator_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the activity creator can manage this application' });
    }

    const application = appResult.rows[0];
    // The organizer must not be able to pull someone back into a spot they
    // chose to leave.
    if (application.status === APPLICATION_STATUS.WITHDRAWN) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This person withdrew their request' });
    }
    if (application.activity_status === ACTIVITY_STATUS.CANCELLED) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This activity was cancelled' });
    }

    if (status === APPLICATION_STATUS.ACCEPTED && application.status !== APPLICATION_STATUS.ACCEPTED) {
      const acceptedCountResult = await client.query(
        `SELECT COUNT(*)::int AS accepted_count
         FROM applications
         WHERE activity_id = $1 AND status = 'accepted'`,
        [application.activity_id]
      );
      const acceptedCount = acceptedCountResult.rows[0].accepted_count;
      if (isActivityFull(application.max_people, acceptedCount)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This activity is already full' });
      }
    }

    await client.query('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);

    if (status === APPLICATION_STATUS.ACCEPTED) {
      await client.query(
        `INSERT INTO chat_room_members (chat_room_id, user_id)
         SELECT chat_rooms.id, applications.user_id
         FROM chat_rooms
         JOIN applications ON applications.activity_id = chat_rooms.activity_id
         WHERE applications.id = $1
         ON CONFLICT (chat_room_id, user_id) DO UPDATE SET left_at = NULL`,
        [id]
      );
    } else if (application.status === APPLICATION_STATUS.ACCEPTED) {
      await client.query(
        `UPDATE chat_room_members
         SET left_at = NOW()
         WHERE chat_room_id = (SELECT id FROM chat_rooms WHERE activity_id = $1)
           AND user_id = $2`,
        [application.activity_id, application.user_id]
      );
    }

    if (status !== application.status) {
      if (status === APPLICATION_STATUS.ACCEPTED) {
        await insertNotification(client, {
          userId: application.user_id,
          type: NOTIFICATION_TYPE.APPLICATION_ACCEPTED,
          title: "You're in",
          body: `You were accepted to ${application.activity_title}.`,
          activityId: application.activity_id,
        });

        const acceptedNow = await client.query(
          `SELECT COUNT(*)::int AS accepted_count
           FROM applications
           WHERE activity_id = $1 AND status = 'accepted'`,
          [application.activity_id]
        );
        if (isActivityFull(application.max_people, acceptedNow.rows[0].accepted_count)) {
          await insertNotification(client, {
            userId: application.activity_owner_id,
            type: NOTIFICATION_TYPE.ACTIVITY_FULL,
            title: 'Activity is full',
            body: `${application.activity_title} has reached capacity.`,
            activityId: application.activity_id,
          });
        }
      } else if (status === APPLICATION_STATUS.DECLINED) {
        await insertNotification(client, {
          userId: application.user_id,
          type: NOTIFICATION_TYPE.APPLICATION_DECLINED,
          title: 'Application update',
          body: `Your application to ${application.activity_title} was declined.`,
          activityId: application.activity_id,
        });
      }
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

module.exports = router;
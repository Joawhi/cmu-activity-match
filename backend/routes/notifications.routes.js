const express = require('express');
const { pool } = require('../db');
const { handleServerError } = require('../utils/errors');
const { ensureUpcomingReminders } = require('../utils/notifications');

const router = express.Router();

function parseUserId(value) {
  const userId = Number(value);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return userId;
}

router.get('/', async (req, res) => {
  try {
    const userId = parseUserId(req.query.user_id);
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    await ensureUpcomingReminders(pool, userId);

    const list = await pool.query(
      `SELECT id, type, title, body, activity_id, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 50`,
      [userId]
    );
    const count = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    res.json({
      notifications: list.rows,
      unread_count: count.rows[0].unread_count,
    });
  } catch (err) {
    handleServerError(err, res);
  }
});

router.put('/read-all', async (req, res) => {
  try {
    const userId = parseUserId(req.body.user_id);
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await pool.query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );
    res.json({ success: true, updated: result.rowCount });
  } catch (err) {
    handleServerError(err, res);
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    const userId = parseUserId(req.body.user_id);
    if (!Number.isInteger(notificationId) || notificationId <= 0 || !userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const result = await pool.query(
      `UPDATE notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE id = $1 AND user_id = $2
       RETURNING id, read_at`,
      [notificationId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true, read_at: result.rows[0].read_at });
  } catch (err) {
    handleServerError(err, res);
  }
});

module.exports = router;

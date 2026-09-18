const express = require('express');
const { pool } = require('../db');
const { handleServerError } = require('../utils/errors');

const router = express.Router();

async function findChatAccess(client, activityId, userId) {
    const result = await client.query(
        `SELECT chat_rooms.id AS chat_room_id,
            activities.user_id AS organizer_id,
            chat_room_members.left_at,
            chat_room_members.user_id AS member_id
     FROM activities
     JOIN chat_rooms ON chat_rooms.activity_id = activities.id
     LEFT JOIN chat_room_members
       ON chat_room_members.chat_room_id = chat_rooms.id
      AND chat_room_members.user_id = $2
     WHERE activities.id = $1`,
        [activityId, userId]
    );

    if (result.rows.length === 0) return null;

    const access = result.rows[0];
    const isOrganizer = access.organizer_id === userId;
    const isMember = access.member_id === userId;
    const canReadHistory = isOrganizer || isMember;
    const canReadNew = isOrganizer || (isMember && access.left_at === null);

    return { ...access, canReadHistory, canReadNew };
}

router.get('/:activityId/messages', async (req, res) => {
    const client = await pool.connect();
    try {
        const activityId = Number(req.params.activityId);
        const userId = Number(req.query.user_id);
        const afterId = Number(req.query.after_id) || 0;

        if (!userId) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        const access = await findChatAccess(client, activityId, userId);
        if (!access || !access.canReadHistory) {
            return res.status(access ? 403 : 404).json({ error: access ? 'You are not a member of this chat' : 'Activity chat not found' });
        }

        const result = await client.query(
            `SELECT chat_messages.id,
              chat_messages.content,
              chat_messages.created_at,
              chat_messages.sender_id,
              COALESCE(users.display_name, users.name) AS sender_name
       FROM chat_messages
       JOIN users ON users.id = chat_messages.sender_id
       WHERE chat_messages.chat_room_id = $1
         AND chat_messages.id > $2
         AND ($3 OR chat_messages.created_at <= $4)
       ORDER BY chat_messages.created_at ASC, chat_messages.id ASC`,
            [access.chat_room_id, afterId, access.canReadNew, access.left_at]
        );
        res.json(result.rows);
    } catch (err) {
        handleServerError(err, res);
    } finally {
        client.release();
    }
});

router.post('/:activityId/messages', async (req, res) => {
    const client = await pool.connect();
    try {
        const activityId = Number(req.params.activityId);
        const userId = Number(req.body.user_id);
        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

        if (!userId) {
            return res.status(400).json({ error: 'user_id is required' });
        }
        if (!content) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        if (content.length > 500) {
            return res.status(400).json({ error: 'Message cannot exceed 500 characters' });
        }

        const access = await findChatAccess(client, activityId, userId);
        if (!access) {
            return res.status(404).json({ error: 'Activity chat not found' });
        }
        if (!access.canReadNew) {
            return res.status(403).json({ error: 'You cannot send messages in this chat' });
        }

        const result = await client.query(
            `INSERT INTO chat_messages (chat_room_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at, sender_id`,
            [access.chat_room_id, userId, content]
        );
        const message = result.rows[0];
        const sender = await client.query(
            'SELECT COALESCE(display_name, name) AS sender_name FROM users WHERE id = $1',
            [userId]
        );
        res.status(201).json({ ...message, sender_name: sender.rows[0].sender_name });
    } catch (err) {
        handleServerError(err, res);
    } finally {
        client.release();
    }
});

module.exports = router;
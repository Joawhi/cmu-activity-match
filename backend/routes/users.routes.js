const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { handleServerError } = require('../utils/errors');
const { parseOptionalText } = require('../utils/validators');
const { loginLimiter } = require('../utils/security');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const router = express.Router();

// "Log in": if this email already exists, return that user.
// Otherwise create a new one. TODO: replace with real authentication.
router.post('/login', loginLimiter, async (req, res) => {
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
    handleServerError(err, res);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    handleServerError(err, res);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const displayName = parseOptionalText(req.body.display_name, 'displayName');
    if (!displayName.ok) return res.status(400).json({ error: displayName.error });

    const bio = parseOptionalText(req.body.bio, 'bio');
    if (!bio.ok) return res.status(400).json({ error: bio.error });

    const major = parseOptionalText(req.body.major, 'major');
    if (!major.ok) return res.status(400).json({ error: major.error });

    const languages = parseOptionalText(req.body.languages, 'languages');
    if (!languages.ok) return res.status(400).json({ error: languages.error });

    const schoolYear = req.body.school_year || null;

    await pool.query(
      `UPDATE users SET display_name = $1, bio = $2, school_year = $3, major = $4, languages = $5 WHERE id = $6`,
      [displayName.value, bio.value, schoolYear, major.value, languages.value, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }
    await pool.query('UPDATE users SET profile_image = $1 WHERE id = $2', [req.file.filename, req.params.id]);
    res.json({ success: true, filename: req.file.filename });
  } catch (err) {
    handleServerError(err, res);
  }
});

module.exports = router;
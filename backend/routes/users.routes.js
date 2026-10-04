const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { pool } = require('../db');
const { handleServerError } = require('../utils/errors');
const {
  parseOptionalText,
  parseAccountName,
  parseAccountEmail,
  parseAccountPassword,
  parseSchoolYear,
  parseLanguages,
  publicUser,
} = require('../utils/validators');
const { loginLimiter } = require('../utils/security');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const router = express.Router();

router.post('/register', loginLimiter, async (req, res) => {
  try {
    const name = parseAccountName(req.body.name);
    if (!name.ok) return res.status(400).json({ error: name.error });

    const email = parseAccountEmail(req.body.email);
    if (!email.ok) return res.status(400).json({ error: email.error });

    const password = parseAccountPassword(req.body.password);
    if (!password.ok) return res.status(400).json({ error: password.error });

    const displayName = parseOptionalText(req.body.display_name, 'displayName');
    if (!displayName.ok) return res.status(400).json({ error: displayName.error });

    const bio = parseOptionalText(req.body.bio, 'bio');
    if (!bio.ok) return res.status(400).json({ error: bio.error });

    const major = parseOptionalText(req.body.major, 'major');
    if (!major.ok) return res.status(400).json({ error: major.error });

    const schoolYear = parseSchoolYear(req.body.school_year);
    if (!schoolYear.ok) return res.status(400).json({ error: schoolYear.error });

    const languages = parseLanguages(req.body.languages);
    if (!languages.ok) return res.status(400).json({ error: languages.error });

    const passwordHash = await bcrypt.hash(password.value, 10);
    const existing = await pool.query(
      'SELECT * FROM users WHERE lower(email) = $1',
      [email.value]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].password_hash) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const updated = await pool.query(
        `UPDATE users
         SET name = $1,
             email = $2,
             password_hash = $3,
             display_name = COALESCE($4, display_name),
             bio = COALESCE($5, bio),
             school_year = COALESCE($6, school_year),
             major = COALESCE($7, major),
             languages = COALESCE($8, languages)
         WHERE id = $9
         RETURNING *`,
        [
          name.value,
          email.value,
          passwordHash,
          displayName.value,
          bio.value,
          schoolYear.value,
          major.value,
          languages.value,
          existing.rows[0].id,
        ]
      );
      return res.status(201).json(publicUser(updated.rows[0]));
    }

    const created = await pool.query(
      `INSERT INTO users (name, email, password_hash, display_name, bio, school_year, major, languages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name.value,
        email.value,
        passwordHash,
        displayName.value,
        bio.value,
        schoolYear.value,
        major.value,
        languages.value,
      ]
    );
    res.status(201).json(publicUser(created.rows[0]));
  } catch (err) {
    handleServerError(err, res);
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = parseAccountEmail(req.body.email);
    if (!email.ok) return res.status(400).json({ error: email.error });

    const password = parseAccountPassword(req.body.password);
    if (!password.ok) return res.status(400).json({ error: password.error });

    const existing = await pool.query(
      'SELECT * FROM users WHERE lower(email) = $1',
      [email.value]
    );
    const user = existing.rows[0];

    if (user && !user.password_hash) {
      return res.status(401).json({
        error: 'This account does not have a password yet. Register with this email to set one.',
      });
    }

    const matches = user ? await bcrypt.compare(password.value, user.password_hash) : false;
    if (!user || !matches) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    res.json(publicUser(user));
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
    res.json(publicUser(result.rows[0]));
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
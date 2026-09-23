require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { setupTables } = require('./db');
const { corsOriginCheck, apiLimiter } = require('./utils/security');

const usersRoutes = require('./routes/users.routes');
const activitiesRoutes = require('./routes/activities.routes');
const applicationsRoutes = require('./routes/applications.routes');
const chatRoutes = require('./routes/chat.routes');
const notificationsRoutes = require('./routes/notifications.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: corsOriginCheck }));
app.use(express.json());
app.use('/api/', apiLimiter);

fs.mkdirSync('uploads', { recursive: true });
app.use('/uploads', express.static('uploads'));

setupTables().catch((err) => console.error('Error setting up tables:', err));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.use('/api/users', usersRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
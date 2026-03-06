const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes   = require('./routes/auth');
const apiRoutes    = require('./routes/api');
const pvpRoutes    = require('./routes/pvp');
const schoolRoutes = require('./routes/school');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1); // Railway/Render stoi za reverse proxy
app.use(session({
  secret: process.env.SESSION_SECRET || 'piratmath-tajny-klucz-zmien-to-na-produkcji',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dni
  }
}));

// ── Routes ──────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/pvp', pvpRoutes);
app.use('/api', schoolRoutes);

// Panel nauczyciela — osobna strona
app.get('/teacher', (req, res) => {
  res.sendFile(require('path').join(__dirname, 'public', 'teacher.html'));
});

// Wszystkie inne ścieżki → index.html (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🐀 Pi-ratMath działa na http://localhost:${PORT}\n`);
});
process.on('SIGTERM', () => {
  process.exit(0);
});

const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const apiRoutes  = require('./routes/api');
const pvpRoutes  = require('./routes/pvp');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'piratmath-tajny-klucz-zmien-to-na-produkcji',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dni
  }
}));

// ── Routes ──────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/pvp', pvpRoutes);

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

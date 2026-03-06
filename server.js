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

// TYMCZASOWY ENDPOINT — usuń po użyciu
app.get('/admin/add-class', (req, res) => {
  const { secret, teacher, grade, name, school } = req.query;
  if (secret !== (process.env.ADMIN_SECRET || 'zmien-mnie')) return res.status(403).send('Brak dostępu');
  const db = require('./db');
  const user = db.prepare('SELECT id FROM users WHERE name = ?').get(teacher || 'soli');
  if (!user) return res.status(404).send('Nie znaleziono nauczyciela');
  let schoolRow = db.prepare('SELECT id FROM schools WHERE name = ?').get(school || 'Szkoła Przykładowa nr 1');
  if (!schoolRow) {
    const r = db.prepare('INSERT INTO schools (name, city) VALUES (?, ?)').run(school || 'Szkoła Przykładowa nr 1', '');
    schoolRow = { id: r.lastInsertRowid };
  }
  const cls = db.prepare('INSERT INTO classes (school_id, name, grade, teacher_id) VALUES (?, ?, ?, ?)').run(schoolRow.id, name || '1a', parseInt(grade) || 1, user.id);
  res.send(`OK — klasa ${name || '1a'} (grade ${grade || 1}) utworzona dla ${teacher || 'soli'} (id klasy: ${cls.lastInsertRowid})`);
});

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

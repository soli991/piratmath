const express = require('express');
const bcrypt  = require('bcrypt');
const crypto  = require('crypto');
const db      = require('../db');
const { checkAndUnlock } = require('../achievements');
const { containsBadWord } = require('../badwords');

const router = express.Router();
const SALT_ROUNDS = 12;

// ── Dzienny bonus logowania ──────────────────────────────────
function checkAndAwardDailyBonus(userId) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const row = db.prepare(
    'SELECT daily_streak, last_login_date FROM users WHERE id = ?'
  ).get(userId);

  const lastDate = row ? (row.last_login_date || '') : '';
  if (lastDate === today) {
    // Już dziś zalogowano – bez bonusu
    return { dailyBonus: 0, dailyStreak: row.daily_streak || 0 };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak  = lastDate === yesterday ? (row.daily_streak || 0) + 1 : 1;
  const dailyBonus = Math.min(newStreak * 5, 30); // max 30 pkt/dzień

  db.prepare(`
    UPDATE users
    SET daily_streak = ?, last_login_date = ?,
        season_points = season_points + ?,
        total_points  = total_points  + ?
    WHERE id = ?
  `).run(newStreak, today, dailyBonus, dailyBonus, userId);

  return { dailyBonus, dailyStreak: newStreak };
}

// Pomocnicza: odczyt listy odblokowanych i bonus_pts
function getAchData(userId) {
  const rows     = db.prepare('SELECT ach_id FROM user_achievements WHERE user_id = ?').all(userId);
  const unlocked = rows.map(r => r.ach_id);
  return { ach_unlocked: unlocked, bonus_pts: Math.floor(unlocked.length / 15) };
}

// ── POST /api/register ───────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password)
    return res.status(400).json({ error: 'Wypełnij oba pola!' });
  if (name.length < 3)
    return res.status(400).json({ error: 'Nazwa musi mieć min. 3 znaki!' });
  if (password.length < 4)
    return res.status(400).json({ error: 'Hasło musi mieć min. 4 znaki!' });
  if (containsBadWord(name))
    return res.status(400).json({ error: 'Ta nazwa zawiera niedozwolone słowa.' });

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(name) = LOWER(?)').get(name);
  if (existing)
    return res.status(409).json({ error: 'Ta nazwa jest już zajęta!' });

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = db.prepare(
    'INSERT INTO users (name, password_hash) VALUES (?, ?)'
  ).run(name, password_hash);

  req.session.userId = result.lastInsertRowid;
  const { dailyBonus, dailyStreak } = checkAndAwardDailyBonus(result.lastInsertRowid);
  const newAchs = checkAndUnlock(result.lastInsertRowid, {});
  const achData = getAchData(result.lastInsertRowid);

  const user = getUserFull(result.lastInsertRowid);
  res.json({ user: { ...user, topics: {}, ...achData }, dailyBonus, dailyStreak, newAchs });
});

// ── POST /api/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password)
    return res.status(400).json({ error: 'Wypełnij oba pola!' });

  const user = db.prepare('SELECT * FROM users WHERE LOWER(name) = LOWER(?)').get(name);
  if (!user)
    return res.status(401).json({ error: 'Nie znaleziono użytkownika!' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid)
    return res.status(401).json({ error: 'Błędne hasło!' });

  req.session.userId = user.id;
  const { dailyBonus, dailyStreak } = checkAndAwardDailyBonus(user.id);
  const newAchs = checkAndUnlock(user.id, {});
  const achData = getAchData(user.id);

  // Odczytaj aktualne punkty (mogły wzrosnąć o bonus)
  const fresh  = getUserFull(user.id);
  const topics = buildTopicsMap(user.id);
  res.json({
    user: { ...fresh, topics, ...achData },
    dailyBonus,
    dailyStreak,
    newAchs,
  });
});

// ── POST /api/change-password ────────────────────────────────
router.post('/change-password', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Wymagane logowanie' });
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Wypełnij wszystkie pola.' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Nowe hasło musi mieć min. 4 znaki.' });

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.session.userId);
  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Błędne aktualne hasło.' });

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.session.userId);
  res.json({ ok: true });
});

// ── POST /api/logout ─────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── GET /api/me ──────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: 'Niezalogowany' });

  const { dailyBonus, dailyStreak } = checkAndAwardDailyBonus(req.session.userId);
  const newAchs = checkAndUnlock(req.session.userId, {});
  const achData = getAchData(req.session.userId);

  const user = getUserFull(req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Niezalogowany' });
  }

  const topics = buildTopicsMap(user.id);
  res.json({ user: { ...user, topics, ...achData }, dailyBonus, dailyStreak, newAchs });
});

function getUserFull(userId) {
  const u = db.prepare(
    'SELECT id, name, season_points, total_points, class_season_points, class_total_points, week_points, class_week_points, dukaty, owned_avatars, owned_titles, active_title, avatar_emoji, galeony, pvp_wins, owned_galeon_items, active_frame, class_id, role FROM users WHERE id = ?'
  ).get(userId);
  if (!u) return null;
  const teacherClasses = db.prepare(`
    SELECT c.id, c.name, c.grade, s.name AS schoolName
    FROM classes c JOIN schools s ON s.id = c.school_id
    WHERE c.teacher_id = ? ORDER BY c.grade, c.name
  `).all(userId);
  return { ...u, teacher_classes: teacherClasses };
}

function buildTopicsMap(userId) {
  const rows = db.prepare(
    'SELECT topic, done, points FROM topic_progress WHERE user_id = ?'
  ).all(userId);
  const topics = {};
  for (const row of rows) {
    topics[row.topic] = { done: row.done, points: row.points };
  }
  return topics;
}

// ── POST /api/admin/reset-token ──────────────────────────────
// Tylko dla admina (zna ADMIN_SECRET). Zwraca jednorazowy kod.
router.post('/admin/reset-token', (req, res) => {
  const { secret, name } = req.body;
  if (!secret || secret !== process.env.ADMIN_SECRET)
    return res.status(403).json({ error: 'Brak dostępu' });

  const user = db.prepare('SELECT id FROM users WHERE LOWER(name) = LOWER(?)').get(name);
  if (!user)
    return res.status(404).json({ error: 'Nie znaleziono użytkownika' });

  // Usuń stare tokeny tego usera
  db.prepare('DELETE FROM reset_tokens WHERE user_id = ?').run(user.id);

  const token     = crypto.randomBytes(4).toString('hex').toUpperCase(); // np. A3F7C2B1
  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minut
  db.prepare('INSERT INTO reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, user.id, expiresAt);

  res.json({ token, expiresIn: '15 minut' });
});

// ── POST /api/reset-password ─────────────────────────────────
// Użytkownik wpisuje token (od admina) + nowe hasło
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res.status(400).json({ error: 'Wypełnij oba pola' });
  if (newPassword.length < 4)
    return res.status(400).json({ error: 'Hasło musi mieć min. 4 znaki' });

  const row = db.prepare('SELECT * FROM reset_tokens WHERE token = ?').get(token.toUpperCase().trim());
  if (!row)
    return res.status(400).json({ error: 'Nieprawidłowy kod' });
  if (row.used)
    return res.status(400).json({ error: 'Kod już został wykorzystany' });
  if (Math.floor(Date.now() / 1000) > row.expires_at)
    return res.status(400).json({ error: 'Kod wygasł' });

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
  db.prepare('UPDATE reset_tokens SET used = 1 WHERE token = ?').run(row.token);

  res.json({ ok: true });
});

module.exports = router;

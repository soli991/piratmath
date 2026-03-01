const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');
const { checkAndUnlock } = require('../achievements');

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

  const existing = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
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

  const user = db.prepare(
    'SELECT id, name, season_points, total_points, dukaty, owned_avatars, owned_titles, active_title FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);

  res.json({ user: { ...user, topics: {}, ...achData }, dailyBonus, dailyStreak, newAchs });
});

// ── POST /api/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password)
    return res.status(400).json({ error: 'Wypełnij oba pola!' });

  const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
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
  const fresh = db.prepare(
    'SELECT season_points, total_points, dukaty, owned_avatars, owned_titles, active_title FROM users WHERE id = ?'
  ).get(user.id);

  const topics = buildTopicsMap(user.id);
  res.json({
    user: { id: user.id, name: user.name, ...fresh, topics, ...achData },
    dailyBonus,
    dailyStreak,
    newAchs,
  });
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

  const user = db.prepare(
    'SELECT id, name, season_points, total_points, dukaty, owned_avatars, owned_titles, active_title FROM users WHERE id = ?'
  ).get(req.session.userId);

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Niezalogowany' });
  }

  const topics = buildTopicsMap(user.id);
  res.json({ user: { ...user, topics, ...achData }, dailyBonus, dailyStreak, newAchs });
});

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

module.exports = router;

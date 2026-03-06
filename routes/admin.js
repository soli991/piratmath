const express = require('express');
const crypto  = require('crypto');
const db      = require('../db');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Niezalogowany' });
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Brak uprawnień' });
  next();
}

// ── GET /api/admin/users?q=search ───────────────────────────
router.get('/admin/users', requireAdmin, (req, res) => {
  const q = (req.query.q || '').trim();
  const users = q
    ? db.prepare(
        'SELECT id, name, role, season_points, total_points, class_id FROM users WHERE LOWER(name) LIKE LOWER(?) ORDER BY name LIMIT 100'
      ).all(`%${q}%`)
    : db.prepare(
        'SELECT id, name, role, season_points, total_points, class_id FROM users ORDER BY id DESC LIMIT 100'
      ).all();
  res.json(users);
});

// ── PATCH /api/admin/users/:id/role ─────────────────────────
router.patch('/admin/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['student', 'teacher', 'admin'].includes(role))
    return res.status(400).json({ error: 'Nieprawidłowa rola' });
  const id = parseInt(req.params.id);
  if (id === req.session.userId)
    return res.status(400).json({ error: 'Nie możesz zmienić własnej roli' });
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  res.json({ ok: true });
});

// ── POST /api/admin/users/:id/reset-token ───────────────────
router.post('/admin/users/:id/reset-token', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });

  db.prepare('DELETE FROM reset_tokens WHERE user_id = ?').run(id);
  const token     = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h
  db.prepare('INSERT INTO reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, id, expiresAt);
  res.json({ token });
});

// ── POST /api/admin/schools ──────────────────────────────────
router.post('/admin/schools', requireAdmin, (req, res) => {
  const name = (req.body.name || '').trim();
  const city = (req.body.city || '').trim();
  if (!name) return res.status(400).json({ error: 'Nazwa szkoły jest wymagana' });
  const result = db.prepare('INSERT INTO schools (name, city) VALUES (?, ?)').run(name, city);
  res.json({ id: result.lastInsertRowid, name, city });
});

// ── GET /api/admin/stats ─────────────────────────────────────
router.get('/admin/stats', requireAdmin, (req, res) => {
  const totalUsers    = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  const totalTeachers = db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'teacher'").get().n;
  const totalAdmins   = db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'admin'").get().n;
  const totalSchools  = db.prepare('SELECT COUNT(*) as n FROM schools').get().n;
  const totalClasses  = db.prepare('SELECT COUNT(*) as n FROM classes').get().n;
  res.json({ totalUsers, totalTeachers, totalAdmins, totalSchools, totalClasses });
});

module.exports = router;

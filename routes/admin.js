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

// ── GET /api/admin/users?q=search&role=teacher ──────────────
router.get('/admin/users', requireAdmin, (req, res) => {
  const q    = (req.query.q    || '').trim();
  const role = (req.query.role || '').trim();
  const validRoles = ['student', 'teacher', 'admin'];

  let sql    = 'SELECT id, name, role, season_points, total_points, class_id FROM users';
  const cond = [];
  const args = [];

  if (q)    { cond.push('LOWER(name) LIKE LOWER(?)'); args.push(`%${q}%`); }
  if (role && validRoles.includes(role)) { cond.push('role = ?'); args.push(role); }

  if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
  sql += q ? ' ORDER BY name' : ' ORDER BY id DESC';
  sql += ' LIMIT 100';

  res.json(db.prepare(sql).all(...args));
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

// ── GET /api/admin/schools — lista szkół z klasami ──────────
router.get('/admin/schools', requireAdmin, (req, res) => {
  const schools = db.prepare('SELECT id, name, city FROM schools ORDER BY name').all();
  const classesStmt = db.prepare(`
    SELECT c.id, c.name, c.grade, u.name AS teacherName
    FROM classes c LEFT JOIN users u ON u.id = c.teacher_id
    WHERE c.school_id = ? ORDER BY c.grade, c.name
  `);
  res.json(schools.map(s => ({ ...s, classes: classesStmt.all(s.id) })));
});

// ── POST /api/admin/schools ──────────────────────────────────
router.post('/admin/schools', requireAdmin, (req, res) => {
  const name = (req.body.name || '').trim();
  const city = (req.body.city || '').trim();
  if (!name) return res.status(400).json({ error: 'Nazwa szkoły jest wymagana' });
  const result = db.prepare('INSERT INTO schools (name, city) VALUES (?, ?)').run(name, city);
  res.json({ id: result.lastInsertRowid, name, city });
});

// ── POST /api/admin/classes ──────────────────────────────────
router.post('/admin/classes', requireAdmin, (req, res) => {
  const { schoolId, name, grade, teacherName } = req.body;
  if (!schoolId || !name)
    return res.status(400).json({ error: 'Podaj szkołę i nazwę klasy' });
  const school = db.prepare('SELECT id FROM schools WHERE id = ?').get(parseInt(schoolId));
  if (!school) return res.status(404).json({ error: 'Nie znaleziono szkoły' });

  let teacherId = null;
  if (teacherName) {
    const teacher = db.prepare("SELECT id FROM users WHERE LOWER(name) = LOWER(?)").get(teacherName.trim());
    if (!teacher) return res.status(404).json({ error: `Nie znaleziono użytkownika: ${teacherName}` });
    teacherId = teacher.id;
    db.prepare("UPDATE users SET role = 'teacher' WHERE id = ?").run(teacherId);
  }

  const result = db.prepare(
    'INSERT INTO classes (school_id, name, grade, teacher_id) VALUES (?, ?, ?, ?)'
  ).run(parseInt(schoolId), name.trim(), parseInt(grade) || 0, teacherId);
  res.json({ id: result.lastInsertRowid });
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

// ── DELETE /api/admin/pvp-match/:id — usuń mecz (do testów) ──
router.delete('/admin/pvp-match/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM pvp_turns   WHERE match_id = ?').run(id);
  db.prepare('DELETE FROM pvp_matches WHERE id = ?').run(id);
  res.json({ ok: true });
});

// ── GET /api/admin/pvp-matches — lista aktywnych meczy ────────
router.get('/admin/pvp-matches', requireAdmin, (req, res) => {
  const matches = db.prepare(`
    SELECT m.*, u1.name AS p1_name, u2.name AS p2_name
    FROM pvp_matches m
    JOIN users u1 ON u1.id = m.p1_id
    JOIN users u2 ON u2.id = m.p2_id
    WHERE m.status NOT IN ('seen')
    ORDER BY m.id DESC LIMIT 20
  `).all();
  res.json({ matches });
});

module.exports = router;

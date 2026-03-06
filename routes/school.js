const express = require('express');
const crypto  = require('crypto');
const db      = require('../db');

const router = express.Router();

function getWeekStart() {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(now.getDate() + diff);
  const y = mon.getFullYear();
  const m = String(mon.getMonth() + 1).padStart(2, '0');
  const d = String(mon.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Lista wszystkich tematów dostępnych w aplikacji (musi odpowiadać sidebar w index.html)
const ALL_TOPICS = [
  // Klasy 1–3
  { level: 'Klasy 1–3', topic: 'Dodawanie i odejmowanie' },
  { level: 'Klasy 1–3', topic: 'Mnożenie i dzielenie' },
  { level: 'Klasy 1–3', topic: 'Tabliczka mnożenia' },
  { level: 'Klasy 1–3', topic: 'Porządkowanie liczb' },
  { level: 'Klasy 1–3', topic: 'Zegar i czas' },
  { level: 'Klasy 1–3', topic: 'Figury geometryczne' },
  // Klasy 4–6 — Liczby i obliczenia
  { level: 'Klasy 4–6', topic: 'Świat liczb' },
  { level: 'Klasy 4–6', topic: 'Liczenie w głowie' },
  { level: 'Klasy 4–6', topic: 'Własności działań' },
  { level: 'Klasy 4–6', topic: 'Dodawanie pisemne' },
  { level: 'Klasy 4–6', topic: 'Odejmowanie pisemne' },
  { level: 'Klasy 4–6', topic: 'Mnożenie pisemne' },
  { level: 'Klasy 4–6', topic: 'Dzielenie pisemne' },
  { level: 'Klasy 4–6', topic: 'Dzielenie z resztą' },
  { level: 'Klasy 4–6', topic: 'Mnożenie liczb z zerami na końcu' },
  { level: 'Klasy 4–6', topic: 'O ile? Ile razy?' },
  { level: 'Klasy 4–6', topic: 'Kolejność działań' },
  { level: 'Klasy 4–6', topic: 'Potęgowanie' },
  { level: 'Klasy 4–6', topic: 'Podzielność liczb' },
  { level: 'Klasy 4–6', topic: 'Zaokrąglanie' },
  { level: 'Klasy 4–6', topic: 'Systemy liczbowe' },
  { level: 'Klasy 4–6', topic: 'Porównywanie liczb całkowitych' },
  { level: 'Klasy 4–6', topic: 'Działania na liczbach całkowitych' },
  // Klasy 4–6 — Ułamki i procenty
  { level: 'Klasy 4–6', topic: 'Zapisywanie ułamka zwykłego' },
  { level: 'Klasy 4–6', topic: 'Skracanie i rozszerzanie ułamków' },
  { level: 'Klasy 4–6', topic: 'Zapisywanie liczby mieszanej' },
  { level: 'Klasy 4–6', topic: 'Zamiana liczb mieszanych na ułamki niewłaściwe' },
  { level: 'Klasy 4–6', topic: 'Dodawanie i odejmowanie ułamków' },
  { level: 'Klasy 4–6', topic: 'Mnożenie ułamków' },
  { level: 'Klasy 4–6', topic: 'Dzielenie ułamków' },
  { level: 'Klasy 4–6', topic: 'Zapisywanie i odczytywanie ułamków dziesiętnych' },
  { level: 'Klasy 4–6', topic: 'Dodawanie ułamków dziesiętnych' },
  { level: 'Klasy 4–6', topic: 'Odejmowanie ułamków dziesiętnych' },
  { level: 'Klasy 4–6', topic: 'Mnożenie ułamków dziesiętnych' },
  { level: 'Klasy 4–6', topic: 'Dzielenie ułamków dziesiętnych' },
  { level: 'Klasy 4–6', topic: 'Zamiana ułamków dziesiętnych na zwykłe i odwrotnie' },
  { level: 'Klasy 4–6', topic: 'Zamiana ułamków na procenty' },
  { level: 'Klasy 4–6', topic: 'Obliczanie ułamka danej liczby' },
  { level: 'Klasy 4–6', topic: 'Obliczanie liczby, gdy dany jest jej procent' },
  { level: 'Klasy 4–6', topic: 'Liczby wymierne' },
  // Klasy 4–6 — Algebra
  { level: 'Klasy 4–6', topic: 'Tworzenie i odczytywanie wyrażeń algebraicznych' },
  { level: 'Klasy 4–6', topic: 'Obliczanie wartości wyrażeń algebraicznych' },
  { level: 'Klasy 4–6', topic: 'Porządkowanie wyrażeń algebraicznych' },
  { level: 'Klasy 4–6', topic: 'Równania' },
  // Klasy 4–6 — Geometria płaska
  { level: 'Klasy 4–6', topic: 'Kąty i proste' },
  { level: 'Klasy 4–6', topic: 'Figury płaskie' },
  { level: 'Klasy 4–6', topic: 'Trójkąty' },
  { level: 'Klasy 4–6', topic: 'Czworokąty' },
  { level: 'Klasy 4–6', topic: 'Pola i obwody' },
  { level: 'Klasy 4–6', topic: 'Skala' },
  // Klasy 4–6 — Bryły
  { level: 'Klasy 4–6', topic: 'Graniastosłupy i ich podstawowe własności' },
  { level: 'Klasy 4–6', topic: 'Ostrosłupy i ich podstawowe własności' },
  { level: 'Klasy 4–6', topic: 'Walec, stożek, kula' },
  // Klasy 4–6 — Zastosowania
  { level: 'Klasy 4–6', topic: 'Czas i zegar' },
  { level: 'Klasy 4–6', topic: 'Jednostki miar' },
  { level: 'Klasy 4–6', topic: 'Szybkość, droga, czas' },
  { level: 'Klasy 4–6', topic: 'Średnia arytmetyczna' },
  // Klasy 7–8 — Liczby i działania
  { level: 'Klasy 7–8', topic: 'Liczby wymierne i rzeczywiste' },
  { level: 'Klasy 7–8', topic: 'Wartość bezwzględna' },
  { level: 'Klasy 7–8', topic: 'Liczby pierwsze i złożone' },
  { level: 'Klasy 7–8', topic: 'Rozkład liczby na czynniki pierwsze' },
  { level: 'Klasy 7–8', topic: 'Wyznaczanie NWD' },
  { level: 'Klasy 7–8', topic: 'Wyznaczanie NWW' },
  { level: 'Klasy 7–8', topic: 'Rozwinięcia dziesiętne' },
  // Klasy 7–8 — Procenty
  { level: 'Klasy 7–8', topic: 'Obliczanie procentu danej liczby' },
  { level: 'Klasy 7–8', topic: 'Obliczanie liczby na podstawie jej procentu' },
  { level: 'Klasy 7–8', topic: 'Jakim procentem jednej liczby jest druga?' },
  { level: 'Klasy 7–8', topic: 'Obliczenia procentowe w praktyce' },
  // Klasy 7–8 — Potęgi
  { level: 'Klasy 7–8', topic: 'Potęga liczby wymiernej' },
  { level: 'Klasy 7–8', topic: 'Mnożenie i dzielenie potęg (ta sama podstawa)' },
  { level: 'Klasy 7–8', topic: 'Mnożenie i dzielenie potęg (ten sam wykładnik)' },
  { level: 'Klasy 7–8', topic: 'Potęga potęgi' },
  { level: 'Klasy 7–8', topic: 'Notacja wykładnicza' },
  // Klasy 7–8 — Pierwiastki
  { level: 'Klasy 7–8', topic: 'Pierwiastek kwadratowy i sześcienny' },
  { level: 'Klasy 7–8', topic: 'Szacowanie pierwiastków' },
  { level: 'Klasy 7–8', topic: 'Działania na pierwiastkach' },
  // Klasy 7–8 — Wyrażenia algebraiczne
  { level: 'Klasy 7–8', topic: 'Dodawanie i odejmowanie sum algebraicznych' },
  { level: 'Klasy 7–8', topic: 'Mnożenie sumy przez jednomian' },
  { level: 'Klasy 7–8', topic: 'Mnożenie sum algebraicznych' },
  { level: 'Klasy 7–8', topic: 'Porządkowanie wyrażeń algebraicznych' },
  // Klasy 7–8 — Równania
  { level: 'Klasy 7–8', topic: 'Sprawdzanie, czy dana liczba spełnia równanie' },
  { level: 'Klasy 7–8', topic: 'Równania I stopnia z jedną niewiadomą' },
  { level: 'Klasy 7–8', topic: 'Przekształcanie wzorów' },
  // Klasy 7–8 — Proporcjonalność
  { level: 'Klasy 7–8', topic: 'Proporcja i jej własności' },
  { level: 'Klasy 7–8', topic: 'Wielkości wprost proporcjonalne' },
  { level: 'Klasy 7–8', topic: 'Podział proporcjonalny' },
  // Klasy 7–8 — Geometria płaska
  { level: 'Klasy 7–8', topic: 'Twierdzenie Pitagorasa' },
  { level: 'Klasy 7–8', topic: 'Twierdzenie odwrotne do twierdzenia Pitagorasa' },
  { level: 'Klasy 7–8', topic: 'Trójkąt 30-60-90' },
  { level: 'Klasy 7–8', topic: 'Trójkąt 45-45-90' },
  { level: 'Klasy 7–8', topic: 'Wielokąty i ich pola' },
  { level: 'Klasy 7–8', topic: 'Okrąg i koło — długość i pole' },
  { level: 'Klasy 7–8', topic: 'Układ współrzędnych' },
  // Klasy 7–8 — Bryły
  { level: 'Klasy 7–8', topic: 'Graniastosłupy — pole powierzchni i objętość' },
  { level: 'Klasy 7–8', topic: 'Ostrosłupy — pole powierzchni i objętość' },
  // Klasy 7–8 — Statystyka i prawdopodobieństwo
  { level: 'Klasy 7–8', topic: 'Średnia arytmetyczna' },
  { level: 'Klasy 7–8', topic: 'Prawdopodobieństwo zdarzenia' },
  { level: 'Klasy 7–8', topic: 'Reguła mnożenia i dodawania' },
  // Szkoła średnia — Liczby i wyrażenia
  { level: 'Szkoła średnia', topic: 'Liczby wymierne i niewymierne' },
  { level: 'Szkoła średnia', topic: 'Wyrażenia algebraiczne' },
  { level: 'Szkoła średnia', topic: 'Wzory skróconego mnożenia' },
  { level: 'Szkoła średnia', topic: 'Pierwiastki — upraszczanie i działania' },
  { level: 'Szkoła średnia', topic: 'Potęga o wykładniku wymiernym' },
  // Szkoła średnia — Równania i nierówności
  { level: 'Szkoła średnia', topic: 'Nierówności liniowe i przedziały' },
  { level: 'Szkoła średnia', topic: 'Działania na zbiorach' },
  { level: 'Szkoła średnia', topic: 'Wartość bezwzględna — równania i nierówności' },
  { level: 'Szkoła średnia', topic: 'Układ równań liniowych' },
  { level: 'Szkoła średnia', topic: 'Równanie liniowe z parametrem' },
  { level: 'Szkoła średnia', topic: 'Nierówności kwadratowe' },
  { level: 'Szkoła średnia', topic: 'Równanie kwadratowe z parametrem' },
  { level: 'Szkoła średnia', topic: 'Równania wymierne' },
  // Szkoła średnia — Funkcje
  { level: 'Szkoła średnia', topic: 'Pojęcie funkcji' },
  { level: 'Szkoła średnia', topic: 'Monotoniczność i miejsce zerowe' },
  { level: 'Szkoła średnia', topic: 'Przekształcenia wykresów funkcji' },
  { level: 'Szkoła średnia', topic: 'Wektory' },
  { level: 'Szkoła średnia', topic: 'Funkcja liniowa' },
  { level: 'Szkoła średnia', topic: 'Funkcja kwadratowa — postaci' },
  { level: 'Szkoła średnia', topic: 'Funkcja wykładnicza' },
  { level: 'Szkoła średnia', topic: 'Funkcja logarytmiczna' },
  // Szkoła średnia — Logarytmy
  { level: 'Szkoła średnia', topic: 'Pojęcie logarytmu' },
  { level: 'Szkoła średnia', topic: 'Własności logarytmów' },
  { level: 'Szkoła średnia', topic: 'Równania wykładnicze' },
  { level: 'Szkoła średnia', topic: 'Równania logarytmiczne' },
  // Szkoła średnia — Wielomiany i wyrażenia wymierne
  { level: 'Szkoła średnia', topic: 'Działania na wielomianach' },
  { level: 'Szkoła średnia', topic: 'Dzielenie wielomianów' },
  { level: 'Szkoła średnia', topic: 'Równania wielomianowe' },
  { level: 'Szkoła średnia', topic: 'Wyrażenia wymierne — upraszczanie' },
  // Szkoła średnia — Trygonometria
  { level: 'Szkoła średnia', topic: 'Trygonometria kąta ostrego' },
  { level: 'Szkoła średnia', topic: 'Trygonometria kąta rozwartego' },
  { level: 'Szkoła średnia', topic: 'Wzory trygonometryczne' },
  { level: 'Szkoła średnia', topic: 'Twierdzenie sinusów' },
  { level: 'Szkoła średnia', topic: 'Twierdzenie cosinusów' },
  // Szkoła średnia — Geometria analityczna
  { level: 'Szkoła średnia', topic: 'Równanie prostej na płaszczyźnie' },
  { level: 'Szkoła średnia', topic: 'Odległość punktów i prostych' },
  { level: 'Szkoła średnia', topic: 'Równanie okręgu' },
  { level: 'Szkoła średnia', topic: 'Symetrie na płaszczyźnie' },
  // Szkoła średnia — Planimetria
  { level: 'Szkoła średnia', topic: 'Kąty w okręgu' },
  { level: 'Szkoła średnia', topic: 'Twierdzenie Talesa i podobieństwo' },
  { level: 'Szkoła średnia', topic: 'Pola i obwody figur' },
  // Szkoła średnia — Ciągi
  { level: 'Szkoła średnia', topic: 'Ciąg arytmetyczny' },
  { level: 'Szkoła średnia', topic: 'Ciąg geometryczny' },
  { level: 'Szkoła średnia', topic: 'Zastosowania ciągów' },
  // Szkoła średnia — Kombinatoryka i prawdopodobieństwo
  { level: 'Szkoła średnia', topic: 'Permutacje i kombinacje' },
  { level: 'Szkoła średnia', topic: 'Prawdopodobieństwo klasyczne' },
  { level: 'Szkoła średnia', topic: 'Prawdopodobieństwo warunkowe' },
  { level: 'Szkoła średnia', topic: 'Statystyka opisowa' },
  // Szkoła średnia — Stereometria
  { level: 'Szkoła średnia', topic: 'Graniastosłupy — pola i objętości' },
  { level: 'Szkoła średnia', topic: 'Ostrosłupy — pola i objętości' },
  { level: 'Szkoła średnia', topic: 'Walec i stożek — pola i objętości' },
  { level: 'Szkoła średnia', topic: 'Kula — pole i objętość' },
  // Szkoła średnia — Pochodna [rozszerzony]
  { level: 'Szkoła średnia', topic: 'Granica funkcji' },
  { level: 'Szkoła średnia', topic: 'Pochodna — definicja i wzory' },
  { level: 'Szkoła średnia', topic: 'Zastosowania pochodnej' },
];

// ── Middleware: wymaga roli nauczyciela ──────────────────────
function requireTeacher(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Niezalogowany' });
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (!user || user.role !== 'teacher') return res.status(403).json({ error: 'Brak uprawnień' });
  next();
}

// ── Publiczne ────────────────────────────────────────────────

// GET /api/schools
router.get('/schools', (req, res) => {
  const schools = db.prepare('SELECT id, name, city FROM schools ORDER BY name').all();
  res.json(schools);
});

// GET /api/schools/:id/classes
router.get('/schools/:id/classes', (req, res) => {
  const classes = db.prepare(
    'SELECT id, name, grade FROM classes WHERE school_id = ? ORDER BY grade, name'
  ).all(req.params.id);
  res.json(classes);
});

// GET /api/school/all-topics
router.get('/school/all-topics', (req, res) => {
  res.json(ALL_TOPICS);
});

// POST /api/invite/check  { code }
router.post('/invite/check', (req, res) => {
  const code = (req.body.code || '').toUpperCase().trim();
  const invite = db.prepare(`
    SELECT i.id, i.class_id, i.used_by,
           c.name AS class_name, c.grade,
           s.name AS school_name
    FROM invites i
    JOIN classes c ON c.id = i.class_id
    JOIN schools s ON s.id = c.school_id
    WHERE i.code = ?
  `).get(code);

  if (!invite) return res.json({ valid: false, error: 'Nieprawidłowy kod' });
  if (invite.used_by) return res.json({ valid: false, error: 'Kod już został użyty' });
  if (invite.expires_at && Math.floor(Date.now() / 1000) > invite.expires_at)
    return res.json({ valid: false, error: 'Kod wygasł (ważny 7 dni)' });

  res.json({
    valid: true,
    classId:    invite.class_id,
    className:  invite.class_name,
    grade:      invite.grade,
    schoolName: invite.school_name,
    code,
  });
});

// ── Uczeń (zalogowany) ───────────────────────────────────────

// POST /api/class/join  { code }  — przypisuje zalogowanego ucznia do klasy
router.post('/class/join', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Niezalogowany' });

  const user = db.prepare('SELECT class_id FROM users WHERE id = ?').get(req.session.userId);
  if (user.class_id) return res.status(400).json({ error: 'Już należysz do klasy' });

  const code = (req.body.code || '').toUpperCase().trim();
  const invite = db.prepare('SELECT id, class_id, used_by, expires_at FROM invites WHERE code = ?').get(code);

  if (!invite || invite.used_by) return res.status(400).json({ error: 'Nieprawidłowy lub użyty kod' });
  if (invite.expires_at && Math.floor(Date.now() / 1000) > invite.expires_at)
    return res.status(400).json({ error: 'Kod wygasł (ważny 7 dni)' });

  db.prepare('UPDATE users SET class_id = ? WHERE id = ?').run(invite.class_id, req.session.userId);
  db.prepare('UPDATE invites SET used_by = ? WHERE id = ?').run(req.session.userId, invite.id);

  const cls = db.prepare(`
    SELECT c.name, c.grade, s.name AS school_name
    FROM classes c JOIN schools s ON s.id = c.school_id
    WHERE c.id = ?
  `).get(invite.class_id);

  res.json({ ok: true, className: cls.name, grade: cls.grade, schoolName: cls.school_name });
});

// POST /api/class/leave  — uczeń opuszcza klasę
router.post('/class/leave', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Niezalogowany' });
  // Zwolnij kod zaproszenia (żeby mógł być użyty ponownie)
  db.prepare('UPDATE invites SET used_by = NULL WHERE used_by = ?').run(req.session.userId);
  db.prepare('UPDATE users SET class_id = NULL WHERE id = ?').run(req.session.userId);
  res.json({ ok: true });
});

// GET /api/class/topics  — odblokowane tematy dla klasy ucznia
router.get('/class/topics', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Niezalogowany' });

  const user = db.prepare('SELECT class_id FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !user.class_id) return res.json({ classId: null, topics: [] });

  const cls = db.prepare(`
    SELECT c.name, c.grade, s.name AS school_name
    FROM classes c JOIN schools s ON s.id = c.school_id
    WHERE c.id = ?
  `).get(user.class_id);

  const rows = db.prepare(
    'SELECT topic, unlocked FROM class_topics WHERE class_id = ?'
  ).all(user.class_id);

  res.json({
    classId:    user.class_id,
    className:  cls ? cls.name  : '',
    grade:      cls ? cls.grade : '',
    schoolName: cls ? cls.school_name : '',
    topics:     rows,
  });
});

// ── Nauczyciel ───────────────────────────────────────────────

// GET /api/teacher/classes  — wszystkie klasy nauczyciela
router.get('/teacher/classes', requireTeacher, (req, res) => {
  const classes = db.prepare(`
    SELECT c.id, c.name, c.grade, c.school_id AS schoolId, s.name AS schoolName
    FROM classes c JOIN schools s ON s.id = c.school_id
    WHERE c.teacher_id = ?
    ORDER BY c.grade, c.name
  `).all(req.session.userId);
  res.json(classes);
});

// POST /api/teacher/classes  { name, grade, schoolId? }  — tworzy nową klasę
router.post('/teacher/classes', requireTeacher, (req, res) => {
  let { name, grade, schoolId } = req.body;
  if (!name || !grade) return res.status(400).json({ error: 'Podaj nazwę i poziom klasy' });

  const classCount = db.prepare('SELECT COUNT(*) AS cnt FROM classes WHERE teacher_id = ?').get(req.session.userId).cnt;
  if (classCount >= 4) return res.status(400).json({ error: 'Osiągnięto limit 4 klas na konto nauczycielskie' });

  schoolId = parseInt(schoolId);

  // Jeśli nie podano szkoły, użyj szkoły z istniejącej klasy nauczyciela
  if (!schoolId) {
    const existing = db.prepare('SELECT school_id FROM classes WHERE teacher_id = ? LIMIT 1').get(req.session.userId);
    if (existing) schoolId = existing.school_id;
  }

  if (!schoolId) return res.status(400).json({ error: 'Podaj szkołę' });
  if (!db.prepare('SELECT id FROM schools WHERE id = ?').get(schoolId)) return res.status(400).json({ error: 'Nieznana szkoła' });

  const result = db.prepare(
    'INSERT INTO classes (school_id, name, grade, teacher_id) VALUES (?, ?, ?, ?)'
  ).run(schoolId, name.trim(), parseInt(grade), req.session.userId);

  const cls = db.prepare(`
    SELECT c.id, c.name, c.grade, c.school_id AS schoolId, s.name AS schoolName
    FROM classes c JOIN schools s ON s.id = c.school_id WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.json(cls);
});

// DELETE /api/teacher/classes/:id  — usuwa klasę (uczniowie tracą przypisanie)
router.delete('/teacher/classes/:id', requireTeacher, (req, res) => {
  const classId = parseInt(req.params.id);
  if (!teacherOwnsClass(req.session.userId, classId)) return res.status(403).json({ error: 'Brak dostępu' });

  // Odepnij uczniów od klasy
  db.prepare('UPDATE users SET class_id = NULL WHERE class_id = ?').run(classId);
  // Usuń dane klasy
  db.prepare('DELETE FROM class_topics WHERE class_id = ?').run(classId);
  db.prepare('DELETE FROM invites WHERE class_id = ?').run(classId);
  db.prepare('DELETE FROM classes WHERE id = ?').run(classId);

  res.json({ ok: true });
});

// Pomocnik: waliduje że klasa należy do nauczyciela
function teacherOwnsClass(teacherId, classId) {
  return db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, teacherId);
}

// GET /api/teacher/students?classId=X
router.get('/teacher/students', requireTeacher, (req, res) => {
  const classId = parseInt(req.query.classId);
  if (!classId || !teacherOwnsClass(req.session.userId, classId)) return res.status(403).json({ error: 'Brak dostępu do klasy' });

  const weekStart = getWeekStart();
  const students = db.prepare(`
    SELECT id, name, class_season_points, class_total_points,
           CASE WHEN week_start = ? THEN class_week_points ELSE 0 END AS week_points
    FROM users
    WHERE class_id = ? AND role = 'student'
    ORDER BY class_season_points DESC
  `).all(weekStart, classId);

  const classTopicsStmt  = db.prepare(`SELECT topic, points FROM class_topic_progress WHERE user_id = ? AND points > 0 ORDER BY points DESC`);
  const globalTopicsStmt = db.prepare(`SELECT topic, points FROM topic_progress WHERE user_id = ? AND points > 0 ORDER BY points DESC`);
  const result = students.map(s => {
    const ct = classTopicsStmt.all(s.id);
    return { ...s, topics: ct.length > 0 ? ct : globalTopicsStmt.all(s.id) };
  });

  res.json(result);
});


// DELETE /api/teacher/students/:id — usuwa ucznia z klasy (nie usuwa konta)
router.delete('/teacher/students/:id', requireTeacher, (req, res) => {
  const studentId = parseInt(req.params.id);
  const classId   = parseInt(req.query.classId);
  if (!classId || !teacherOwnsClass(req.session.userId, classId)) return res.status(403).json({ error: 'Brak dostępu do klasy' });

  const student = db.prepare("SELECT id, class_id FROM users WHERE id = ? AND role = 'student'").get(studentId);
  if (!student || student.class_id !== classId) return res.status(404).json({ error: 'Uczeń nie jest w tej klasie' });

  db.prepare('UPDATE users SET class_id = NULL WHERE id = ?').run(studentId);
  res.json({ ok: true });
});

// POST /api/teacher/reset-token — nauczyciel generuje kod resetujący hasło ucznia ze swojej klasy
router.post('/teacher/reset-token', requireTeacher, (req, res) => {
  try {
    const studentId = parseInt(req.body.studentId);
    const classId   = parseInt(req.body.classId);
    if (!classId || !teacherOwnsClass(req.session.userId, classId)) return res.status(403).json({ error: 'Brak dostępu do klasy' });

    const student = db.prepare("SELECT id, name, class_id FROM users WHERE id = ? AND role = 'student'").get(studentId);
    if (!student || parseInt(student.class_id) !== classId) return res.status(404).json({ error: `Uczeń nie jest w tej klasie (class_id=${student?.class_id}, oczekiwano ${classId})` });

    db.prepare('DELETE FROM reset_tokens WHERE user_id = ?').run(studentId);
    const token     = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    db.prepare('INSERT INTO reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, studentId, expiresAt);

    res.json({ token, studentName: student.name });
  } catch(err) {
    console.error('[reset-token]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teacher/topics?classId=X
router.get('/teacher/topics', requireTeacher, (req, res) => {
  const classId = parseInt(req.query.classId);
  if (!classId || !teacherOwnsClass(req.session.userId, classId)) return res.status(403).json({ error: 'Brak dostępu do klasy' });

  const unlocked = db.prepare('SELECT topic FROM class_topics WHERE class_id = ? AND unlocked = 1').all(classId);
  const unlockedSet = new Set(unlocked.map(r => r.topic));

  res.json(ALL_TOPICS.map(t => ({ ...t, unlocked: unlockedSet.has(t.topic) })));
});

// PUT /api/teacher/topics  { topic, unlocked, classId }
router.put('/teacher/topics', requireTeacher, (req, res) => {
  const { topic, unlocked, classId } = req.body;
  if (!classId || !teacherOwnsClass(req.session.userId, classId)) return res.status(403).json({ error: 'Brak dostępu do klasy' });
  if (!topic) return res.status(400).json({ error: 'Brak tematu' });

  db.prepare(`
    INSERT INTO class_topics (class_id, topic, unlocked)
    VALUES (?, ?, ?)
    ON CONFLICT(class_id, topic) DO UPDATE SET unlocked = excluded.unlocked
  `).run(classId, topic, unlocked ? 1 : 0);

  res.json({ ok: true });
});

// POST /api/teacher/invite  { classId }  — generuje nowy kod
router.post('/teacher/invite', requireTeacher, (req, res) => {
  const { classId } = req.body;
  if (!classId || !teacherOwnsClass(req.session.userId, classId)) return res.status(403).json({ error: 'Brak dostępu do klasy' });

  const code      = crypto.randomBytes(3).toString('hex').toUpperCase().replace(/(.{3})/, '$1-');
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  db.prepare('INSERT INTO invites (class_id, code, expires_at) VALUES (?, ?, ?)').run(classId, code, expiresAt);

  res.json({ code });
});

// GET /api/teacher/invites?classId=X  — lista kodów
router.get('/teacher/invites', requireTeacher, (req, res) => {
  const classId = parseInt(req.query.classId);
  if (!classId || !teacherOwnsClass(req.session.userId, classId)) return res.status(403).json({ error: 'Brak dostępu do klasy' });

  const now     = Math.floor(Date.now() / 1000);
  const invites = db.prepare(`
    SELECT i.code, i.used_by, i.expires_at, u.name AS used_by_name
    FROM invites i
    LEFT JOIN users u ON u.id = i.used_by
    WHERE i.class_id = ?
    ORDER BY i.id DESC
  `).all(classId);

  res.json(invites.map(i => ({
    code:       i.code,
    used:       !!i.used_by,
    usedByName: i.used_by_name || null,
    expired:    !i.used_by && i.expires_at && i.expires_at < now,
    expiresAt:  i.expires_at || null,
  })));
});

// GET /api/leaderboard/class  — ranking klasy (uczniowie + nauczyciel poza rankingiem)
router.get('/leaderboard/class', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Niezalogowany' });

  const me = db.prepare('SELECT class_id, role FROM users WHERE id = ?').get(req.session.userId);
  let classId;
  if (me.role === 'teacher') {
    // Nauczyciel może podać ?classId=X (dla wielu klas)
    const reqClassId = parseInt(req.query.classId);
    if (reqClassId && teacherOwnsClass(req.session.userId, reqClassId)) {
      classId = reqClassId;
    } else {
      const cls = db.prepare('SELECT id FROM classes WHERE teacher_id = ? ORDER BY id LIMIT 1').get(req.session.userId);
      if (!cls) return res.json({ classId: null, students: [], teacher: null });
      classId = cls.id;
    }
  } else {
    if (!me.class_id) return res.json({ classId: null, students: [], teacher: null });
    classId = me.class_id;
  }

  const students = db.prepare(`
    SELECT id, name, class_season_points AS season_points, class_total_points AS total_points, active_title
    FROM users WHERE class_id = ? AND role = 'student'
    ORDER BY class_season_points DESC
  `).all(classId);

  const cls     = db.prepare('SELECT teacher_id FROM classes WHERE id = ?').get(classId);
  const teacher = cls?.teacher_id
    ? db.prepare('SELECT id, name, class_season_points AS season_points, class_total_points AS total_points, active_title FROM users WHERE id = ?').get(cls.teacher_id)
    : null;

  res.json({ classId, students, teacher });
});

module.exports = router;

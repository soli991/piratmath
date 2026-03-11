const express = require('express');
const db = require('../db');
const { ALL_ACHIEVEMENTS, checkAndUnlock } = require('../achievements');

const router = express.Router();

// ── DANE SKLEPU (wspólne ze źródłem prawdy na serwerze) ────────────────────────

const AVATAR_DATA = [
  // 3 🪙
  {emoji:'🐀',price:3},{emoji:'🦊',price:3},{emoji:'🤖',price:3},{emoji:'🐸',price:3},{emoji:'🐧',price:3},
  {emoji:'🐺',price:3},{emoji:'🐼',price:3},{emoji:'🐨',price:3},{emoji:'🐻',price:3},{emoji:'🦝',price:3},
  {emoji:'🐱',price:3},{emoji:'🐮',price:3},{emoji:'🐷',price:3},
  // 5 🪙
  {emoji:'🦅',price:5},{emoji:'🧙',price:5},{emoji:'🧝',price:5},{emoji:'🦸',price:5},{emoji:'👾',price:5},
  {emoji:'🦋',price:5},{emoji:'🦄',price:5},{emoji:'🎃',price:5},{emoji:'🐉',price:5},{emoji:'🧜',price:5},
  // 10 🪙
  {emoji:'🌟',price:10},{emoji:'🎯',price:10},{emoji:'💀',price:10},{emoji:'🔱',price:10},{emoji:'👑',price:10},
  {emoji:'🧛',price:10},{emoji:'🤡',price:10},{emoji:'👻',price:10},
];
const AVATAR_PRICES = new Map(AVATAR_DATA.map(a => [a.emoji, a.price]));

const TITLES_LIST = [
  { id: 't1',  name: 'Odkrywca morski',            price: 10  },
  { id: 't2',  name: 'Korsarz',                     price: 15  },
  { id: 't3',  name: 'Łowca punktów',               price: 20  },
  { id: 't4',  name: 'Biegły Geometra',             price: 25  },
  { id: 't5',  name: 'Błyskawiczny Odpowiadacz',    price: 30  },
  { id: 't6',  name: 'Pirat Matematyczny',          price: 40  },
  { id: 't7',  name: 'Kapitan Szczurów',            price: 50  },
  { id: 't8',  name: 'Liczmistrz',                  price: 60  },
  { id: 't9',  name: 'Mag Liczb',                   price: 75  },
  { id: 't10', name: 'Gwiazda Matematyki',          price: 90  },
  { id: 't11', name: 'Kosmiczny Matematyk',         price: 100 },
  { id: 't12', name: 'Król Równań',                 price: 125 },
  { id: 't13', name: 'Diamentowy Kalkulator',       price: 150 },
  { id: 't14', name: 'Legenda Liczb',               price: 200 },
  { id: 't15', name: 'Mistrz nad Mistrzami',        price: 250 },
  { id: 't16', name: 'Galaktyczny Geniusz',         price: 300 },
  { id: 't17', name: 'Arcymistrz Algebry',          price: 400 },
  { id: 't18', name: 'Bóg Matematyki',              price: 500 },
  { id: 't19', name: 'Cesarz Cyfr',                 price: 750 },
  { id: 't20', name: 'Admirał Matematycznej Floty', price: 999 },
];
const TITLES_MAP = new Map(TITLES_LIST.map(t => [t.id, t]));

const GALEON_AVATARS = [
  { id: 'ga_skull',    emoji: '💀', name: 'Trup',           price: 3  },
  { id: 'ga_parrot',  emoji: '🦜', name: 'Papuga',         price: 3  },
  { id: 'ga_anchor',  emoji: '⚓', name: 'Kotwica',        price: 5  },
  { id: 'ga_ship',    emoji: '⛵', name: 'Statek',         price: 5  },
  { id: 'ga_treasure',emoji: '🗝️', name: 'Klucz do skarbu',price: 5  },
  { id: 'ga_cannon',  emoji: '💣', name: 'Bomba',          price: 8  },
  { id: 'ga_kraken',  emoji: '🦑', name: 'Kraken',         price: 8  },
  { id: 'ga_mermaid', emoji: '🧜', name: 'Syrena',         price: 10 },
  { id: 'ga_dragon',  emoji: '🐉', name: 'Smok',           price: 10 },
  { id: 'ga_crown',   emoji: '👑', name: 'Korona',         price: 15 },
];
const GALEON_AVATARS_MAP = new Map(GALEON_AVATARS.map(a => [a.id, a]));

const GALEON_TITLES = [
  { id: 'gt_captain',  name: 'Kapitan',          price: 5  },
  { id: 'gt_corsair',  name: 'Korsarz',           price: 5  },
  { id: 'gt_buccaneer',name: 'Kaper',             price: 8  },
  { id: 'gt_admiral',  name: 'Admirał',           price: 10 },
  { id: 'gt_legend',   name: 'Legenda Mórz',      price: 15 },
  { id: 'gt_kraken',   name: 'Pogromca Krakena',  price: 20 },
];
const GALEON_TITLES_MAP = new Map(GALEON_TITLES.map(t => [t.id, t]));

const GALEON_FRAMES = [
  { id: 'fr_gold',    name: 'Złota Ramka',  css: '3px solid #ffd700',       price: 5  },
  { id: 'fr_fire',    name: 'Płomienie',    css: '3px solid #ff6b35',       price: 8  },
  { id: 'fr_ocean',   name: 'Ocean',        css: '3px solid #06b6d4',       price: 8  },
  { id: 'fr_skull',   name: 'Czaszki',      css: '3px dashed #e2e8f0',      price: 10 },
  { id: 'fr_rainbow', name: 'Tęcza',        css: '3px solid transparent',   price: 15 },
];
const GALEON_FRAMES_MAP = new Map(GALEON_FRAMES.map(f => [f.id, f]));

// Middleware – wymaga zalogowania
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Wymagane logowanie' });
  }
  next();
}

// Poniedziałek 00:00 bieżącego tygodnia jako string YYYY-MM-DD
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

// Logika punktów (identyczna jak w starym localStorage)
function calcPoints(done) {
  if (done < 10) return 10;
  if (done < 20) return 5;
  return 1;
}

// Bonus pkt za osiągnięcia: floor(odblokowanych / 15)
function getBonusPts(userId) {
  const row = db.prepare('SELECT COUNT(*) AS cnt FROM user_achievements WHERE user_id = ?').get(userId);
  return Math.floor((row?.cnt || 0) / 15);
}

// POST /api/answer/correct
// Body: { topic: string, streak: number, server: 'global'|'class' }
router.post('/answer/correct', requireAuth, (req, res) => {
  try {
  const { topic, streak = 0, comeback = false, server = 'global', difficulty = 'easy' } = req.body;
  if (!topic) return res.status(400).json({ error: 'Brak tematu' });
  const userId  = req.session.userId;
  const isClass = server === 'class';
  const progressTable = isClass ? 'class_topic_progress' : 'topic_progress';

  // Pobierz lub utwórz rekord postępu (globalny lub klasowy)
  const existing = db.prepare(
    `SELECT done, points FROM ${progressTable} WHERE user_id = ? AND topic = ?`
  ).get(userId, topic);

  const currentDone = existing ? existing.done : 0;
  const bonusPts    = getBonusPts(userId);
  const diffBonus   = (difficulty === 'medium' || difficulty === 'challenge') ? 5 : 0;
  const pts         = calcPoints(currentDone) + bonusPts + diffBonus;

  if (existing) {
    db.prepare(
      `UPDATE ${progressTable} SET done = done + 1, points = points + ? WHERE user_id = ? AND topic = ?`
    ).run(pts, userId, topic);
  } else {
    db.prepare(
      `INSERT INTO ${progressTable} (user_id, topic, done, points) VALUES (?, ?, 1, ?)`
    ).run(userId, topic, pts);
  }

  // Lazy reset tygodniowych punktów
  const weekStart = getWeekStart();
  const userRow   = db.prepare('SELECT week_start FROM users WHERE id = ?').get(userId);
  if (userRow.week_start !== weekStart) {
    db.prepare('UPDATE users SET week_points = 0, class_week_points = 0, week_start = ? WHERE id = ?').run(weekStart, userId);
  }

  // Aktualizuj users: odpowiednie kolumny punktów + statystyki globalne
  if (isClass) {
    db.prepare(
      `UPDATE users SET
         class_season_points = class_season_points + ?,
         class_total_points  = class_total_points  + ?,
         class_week_points   = class_week_points   + ?,
         total_tasks   = total_tasks   + 1,
         max_streak    = CASE WHEN max_streak > ? THEN max_streak ELSE ? END
       WHERE id = ?`
    ).run(pts, pts, pts, streak, streak, userId);
  } else {
    db.prepare(
      `UPDATE users SET
         season_points = season_points + ?,
         total_points  = total_points  + ?,
         week_points   = week_points   + ?,
         total_tasks   = total_tasks   + 1,
         max_streak    = CASE WHEN max_streak > ? THEN max_streak ELSE ? END
       WHERE id = ?`
    ).run(pts, pts, pts, streak, streak, userId);
  }

  // Flagi time-based
  const now  = new Date();
  const hour = now.getHours();
  const day  = now.getDay(); // 0=niedziela, 6=sobota
  const flags = {
    night_owl:  hour >= 23 || hour < 1,
    early_bird: hour >= 5 && hour < 7,
    weekend:    day === 0 || day === 6,
  };

  // Sprawdź czy user jest #1 w tygodniowym rankingu klasy
  if (isClass) {
    const userRow = db.prepare('SELECT class_id, class_week_points FROM users WHERE id = ?').get(userId);
    if (userRow?.class_id) {
      const best = db.prepare(
        'SELECT class_week_points FROM users WHERE class_id = ? AND id != ? ORDER BY class_week_points DESC LIMIT 1'
      ).get(userRow.class_id, userId);
      flags.is_class_top1 = !best || userRow.class_week_points >= best.class_week_points;
    }
  }

  const newAchs = checkAndUnlock(userId, { ...flags, comeback, topic, topic_done: currentDone + 1 });

  res.json({ pts, done: currentDone + 1, newAchs });
  } catch(err) {
    console.error('[API] /answer/correct ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mistake
// Body: { comeback: bool }
router.post('/mistake', requireAuth, (req, res) => {
  const { comeback = false } = req.body;
  const userId = req.session.userId;

  db.prepare('UPDATE users SET total_mistakes = total_mistakes + 1 WHERE id = ?').run(userId);

  const newAchs = checkAndUnlock(userId, { comeback });
  res.json({ newAchs });
});

// POST /api/event
// Body: { event: 'theme_change' | 'lb_view' }
router.post('/event', requireAuth, (req, res) => {
  const { event } = req.body;
  if (!event) return res.status(400).json({ error: 'Brak eventu' });

  const userId  = req.session.userId;
  const newAchs = checkAndUnlock(userId, { [event]: true });
  res.json({ newAchs });
});

// POST /api/bonus/streak – +5 pkt za każde 10 odpowiedzi z rzędu
// Body: { topic, difficulty }
// Dukat: max 2 za każdy poziom (easy/medium/challenge) w każdym temacie
const DUKAT_DIFFS = new Set(['easy', 'medium', 'challenge']);

router.post('/bonus/streak', requireAuth, (req, res) => {
  const { topic, difficulty } = req.body;
  const pts = 5;
  const userId = req.session.userId;

  db.prepare(
    'UPDATE users SET season_points = season_points + ?, total_points = total_points + ? WHERE id = ?'
  ).run(pts, pts, userId);

  let dukat = false;
  let totalDukaty = 0;

  if (DUKAT_DIFFS.has(difficulty) && topic) {
    // Utwórz rekord jeśli nie istnieje
    db.prepare(
      'INSERT OR IGNORE INTO dukat_progress (user_id, topic, difficulty, earned) VALUES (?, ?, ?, 0)'
    ).run(userId, topic, difficulty);

    const row = db.prepare(
      'SELECT earned FROM dukat_progress WHERE user_id = ? AND topic = ? AND difficulty = ?'
    ).get(userId, topic, difficulty);

    if ((row?.earned ?? 0) < 2) {
      db.prepare(
        'UPDATE dukat_progress SET earned = earned + 1 WHERE user_id = ? AND topic = ? AND difficulty = ?'
      ).run(userId, topic, difficulty);
      db.prepare('UPDATE users SET dukaty = dukaty + 1 WHERE id = ?').run(userId);
      dukat = true;
    }

    const userRow = db.prepare('SELECT dukaty FROM users WHERE id = ?').get(userId);
    totalDukaty = userRow?.dukaty ?? 0;
  }

  res.json({ pts, dukat, totalDukaty });
});

// POST /api/avatar/buy – zakup awatara za 3 dukaty
// Body: { avatarId: string }
router.post('/avatar/buy', requireAuth, (req, res) => {
  const { avatarId } = req.body;
  if (!avatarId) return res.status(400).json({ error: 'Brak avatarId' });

  const price = AVATAR_PRICES.get(avatarId);
  if (!price) return res.status(400).json({ error: 'Nieznany awatar' });

  const userId = req.session.userId;
  const user = db.prepare('SELECT dukaty, owned_avatars FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ error: 'Nie znaleziono użytkownika' });

  const owned = JSON.parse(user.owned_avatars || '[]');
  if (owned.includes(avatarId))
    return res.status(400).json({ error: 'Już posiadasz ten awatar!' });

  if ((user.dukaty || 0) < price)
    return res.status(400).json({ error: `Za mało dukatów! Potrzebujesz ${price} 🪙` });

  owned.push(avatarId);
  db.prepare('UPDATE users SET dukaty = dukaty - ?, owned_avatars = ? WHERE id = ?')
    .run(price, JSON.stringify(owned), userId);

  const updated = db.prepare('SELECT dukaty, owned_avatars FROM users WHERE id = ?').get(userId);
  res.json({ ok: true, dukaty: updated.dukaty, owned_avatars: updated.owned_avatars });
});

// POST /api/title/buy
router.post('/title/buy', requireAuth, (req, res) => {
  const { titleId } = req.body;
  const title = TITLES_MAP.get(titleId);
  if (!title) return res.status(400).json({ error: 'Nieznany tytuł' });

  const userId = req.session.userId;
  const user = db.prepare('SELECT dukaty, owned_titles FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ error: 'Nie znaleziono użytkownika' });

  const owned = JSON.parse(user.owned_titles || '[]');
  if (owned.includes(titleId))
    return res.status(400).json({ error: 'Już posiadasz ten tytuł!' });

  if ((user.dukaty || 0) < title.price)
    return res.status(400).json({ error: `Za mało dukatów! Potrzebujesz ${title.price} 🪙` });

  owned.push(titleId);
  db.prepare('UPDATE users SET dukaty = dukaty - ?, owned_titles = ? WHERE id = ?')
    .run(title.price, JSON.stringify(owned), userId);

  const updated = db.prepare('SELECT dukaty, owned_titles FROM users WHERE id = ?').get(userId);
  res.json({ ok: true, dukaty: updated.dukaty, owned_titles: updated.owned_titles });
});

// POST /api/title/set
router.post('/title/set', requireAuth, (req, res) => {
  const { titleId } = req.body;
  const userId = req.session.userId;

  if (titleId) {
    const title = TITLES_MAP.get(titleId);
    if (!title) return res.status(400).json({ error: 'Nieznany tytuł' });
    const user = db.prepare('SELECT owned_titles FROM users WHERE id = ?').get(userId);
    const owned = JSON.parse(user?.owned_titles || '[]');
    if (!owned.includes(titleId)) return res.status(400).json({ error: 'Nie posiadasz tego tytułu' });
  }

  db.prepare('UPDATE users SET active_title = ? WHERE id = ?').run(titleId || '', userId);
  res.json({ ok: true, active_title: titleId || '' });
});

// POST /api/avatar/set
router.post('/avatar/set', requireAuth, (req, res) => {
  const { emoji } = req.body;
  const userId = req.session.userId;
  if (emoji) {
    const user = db.prepare('SELECT owned_avatars FROM users WHERE id = ?').get(userId);
    const owned = JSON.parse(user?.owned_avatars || '[]');
    if (!owned.includes(emoji) && emoji !== '') return res.status(400).json({ error: 'Nie posiadasz tego awatara' });
  }
  db.prepare('UPDATE users SET avatar_emoji = ? WHERE id = ?').run(emoji || '', userId);
  res.json({ ok: true });
});

// GET /api/shop – katalog awatarów i tytułów
router.get('/shop', (req, res) => {
  res.json({ avatars: AVATAR_DATA, titles: TITLES_LIST });
});

// GET /api/leaderboard/seasonal
router.get('/leaderboard/seasonal', (req, res) => {
  const rows = db.prepare(
    'SELECT name, season_points AS points, active_title, avatar_emoji FROM users ORDER BY season_points DESC LIMIT 10'
  ).all();
  res.json(rows);
});

// GET /api/leaderboard/global
router.get('/leaderboard/global', (req, res) => {
  const rows = db.prepare(
    'SELECT name, total_points AS points, active_title, avatar_emoji FROM users ORDER BY total_points DESC LIMIT 10'
  ).all();
  res.json(rows);
});

// GET /api/leaderboard/weekly?classId=X
router.get('/leaderboard/weekly', (req, res) => {
  const weekStart = getWeekStart();
  const classId   = req.query.classId ? parseInt(req.query.classId) : null;
  if (classId) {
    const rows = db.prepare(
      'SELECT name, class_week_points AS points, active_title, avatar_emoji FROM users WHERE class_id = ? AND week_start = ? ORDER BY class_week_points DESC LIMIT 10'
    ).all(classId, weekStart);
    return res.json(rows);
  }
  const rows = db.prepare(
    'SELECT name, week_points AS points, active_title, avatar_emoji FROM users WHERE week_start = ? ORDER BY week_points DESC LIMIT 10'
  ).all(weekStart);
  res.json(rows);
});

// GET /api/leaderboard/seasonal/full
router.get('/leaderboard/seasonal/full', (req, res) => {
  const rows = db.prepare(
    'SELECT name, season_points AS points, active_title, avatar_emoji FROM users ORDER BY season_points DESC'
  ).all();
  res.json(rows);
});

// GET /api/leaderboard/global/full
router.get('/leaderboard/global/full', (req, res) => {
  const rows = db.prepare(
    'SELECT name, total_points AS points, active_title, avatar_emoji FROM users ORDER BY total_points DESC'
  ).all();
  res.json(rows);
});

// GET /api/achievements – lista odblokowanych + bonus
router.get('/achievements', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const rows   = db.prepare('SELECT ach_id FROM user_achievements WHERE user_id = ?').all(userId);
  const unlocked = rows.map(r => r.ach_id);
  const bonus    = Math.floor(unlocked.length / 15);
  res.json({ unlocked, bonus });
});

// GET /api/galeon/shop – katalog przedmiotów za galeony
router.get('/galeon/shop', (req, res) => {
  res.json({ avatars: GALEON_AVATARS, titles: GALEON_TITLES, frames: GALEON_FRAMES });
});

// POST /api/galeon/buy-avatar
router.post('/galeon/buy-avatar', requireAuth, (req, res) => {
  const { itemId } = req.body;
  const item = GALEON_AVATARS_MAP.get(itemId);
  if (!item) return res.status(400).json({ error: 'Nieznany przedmiot' });

  const userId = req.session.userId;
  const user = db.prepare('SELECT galeony, owned_galeon_items FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ error: 'Nie znaleziono użytkownika' });

  const owned = JSON.parse(user.owned_galeon_items || '[]');
  if (owned.includes(itemId))
    return res.status(400).json({ error: 'Już posiadasz ten przedmiot!' });

  if ((user.galeony || 0) < item.price)
    return res.status(400).json({ error: `Za mało galonów! Potrzebujesz ${item.price} ⚓` });

  owned.push(itemId);
  db.prepare('UPDATE users SET galeony = galeony - ?, owned_galeon_items = ? WHERE id = ?')
    .run(item.price, JSON.stringify(owned), userId);

  const updated = db.prepare('SELECT galeony, owned_galeon_items FROM users WHERE id = ?').get(userId);
  res.json({ ok: true, galeony: updated.galeony, owned_galeon_items: updated.owned_galeon_items });
});

// POST /api/galeon/buy-title
router.post('/galeon/buy-title', requireAuth, (req, res) => {
  const { itemId } = req.body;
  const item = GALEON_TITLES_MAP.get(itemId);
  if (!item) return res.status(400).json({ error: 'Nieznany tytuł' });

  const userId = req.session.userId;
  const user = db.prepare('SELECT galeony, owned_galeon_items FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ error: 'Nie znaleziono użytkownika' });

  const owned = JSON.parse(user.owned_galeon_items || '[]');
  if (owned.includes(itemId))
    return res.status(400).json({ error: 'Już posiadasz ten tytuł!' });

  if ((user.galeony || 0) < item.price)
    return res.status(400).json({ error: `Za mało galonów! Potrzebujesz ${item.price} ⚓` });

  owned.push(itemId);
  db.prepare('UPDATE users SET galeony = galeony - ?, owned_galeon_items = ? WHERE id = ?')
    .run(item.price, JSON.stringify(owned), userId);

  const updated = db.prepare('SELECT galeony, owned_galeon_items FROM users WHERE id = ?').get(userId);
  res.json({ ok: true, galeony: updated.galeony, owned_galeon_items: updated.owned_galeon_items });
});

// POST /api/galeon/buy-frame
router.post('/galeon/buy-frame', requireAuth, (req, res) => {
  const { itemId } = req.body;
  const item = GALEON_FRAMES_MAP.get(itemId);
  if (!item) return res.status(400).json({ error: 'Nieznana ramka' });

  const userId = req.session.userId;
  const user = db.prepare('SELECT galeony, owned_galeon_items FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ error: 'Nie znaleziono użytkownika' });

  const owned = JSON.parse(user.owned_galeon_items || '[]');
  if (owned.includes(itemId))
    return res.status(400).json({ error: 'Już posiadasz tę ramkę!' });

  if ((user.galeony || 0) < item.price)
    return res.status(400).json({ error: `Za mało galonów! Potrzebujesz ${item.price} ⚓` });

  owned.push(itemId);
  db.prepare('UPDATE users SET galeony = galeony - ?, owned_galeon_items = ? WHERE id = ?')
    .run(item.price, JSON.stringify(owned), userId);

  const updated = db.prepare('SELECT galeony, owned_galeon_items FROM users WHERE id = ?').get(userId);
  res.json({ ok: true, galeony: updated.galeony, owned_galeon_items: updated.owned_galeon_items });
});

// POST /api/galeon/set-frame
router.post('/galeon/set-frame', requireAuth, (req, res) => {
  const { frameId } = req.body;
  const userId = req.session.userId;

  if (frameId) {
    const frame = GALEON_FRAMES_MAP.get(frameId);
    if (!frame) return res.status(400).json({ error: 'Nieznana ramka' });
    const user = db.prepare('SELECT owned_galeon_items FROM users WHERE id = ?').get(userId);
    const owned = JSON.parse(user?.owned_galeon_items || '[]');
    if (!owned.includes(frameId)) return res.status(400).json({ error: 'Nie posiadasz tej ramki' });
  }

  db.prepare('UPDATE users SET active_frame = ? WHERE id = ?').run(frameId || '', userId);
  res.json({ ok: true, active_frame: frameId || '' });
});

// POST /api/galeon/set-avatar
router.post('/galeon/set-avatar', requireAuth, (req, res) => {
  const { itemId } = req.body;
  const userId = req.session.userId;

  const item = GALEON_AVATARS_MAP.get(itemId);
  if (!item) return res.status(400).json({ error: 'Nieznany awatar' });

  const user = db.prepare('SELECT owned_galeon_items FROM users WHERE id = ?').get(userId);
  const owned = JSON.parse(user?.owned_galeon_items || '[]');
  if (!owned.includes(itemId)) return res.status(400).json({ error: 'Nie posiadasz tego awatara' });

  db.prepare('UPDATE users SET avatar_emoji = ? WHERE id = ?').run(item.emoji, userId);
  res.json({ ok: true });
});

// POST /api/galeon/set-title
router.post('/galeon/set-title', requireAuth, (req, res) => {
  const { titleId } = req.body;
  const userId = req.session.userId;

  if (titleId) {
    const title = GALEON_TITLES_MAP.get(titleId);
    if (!title) return res.status(400).json({ error: 'Nieznany tytuł' });
    const user = db.prepare('SELECT owned_galeon_items FROM users WHERE id = ?').get(userId);
    const owned = JSON.parse(user?.owned_galeon_items || '[]');
    if (!owned.includes(titleId)) return res.status(400).json({ error: 'Nie posiadasz tego tytułu' });
  }

  db.prepare('UPDATE users SET active_title = ? WHERE id = ?').run(titleId || '', userId);
  res.json({ ok: true, active_title: titleId || '' });
});

module.exports = router;

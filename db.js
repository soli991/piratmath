// Node 22+ ma wbudowany SQLite – zero zewnętrznych zależności, zero kompilacji
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'piratmath.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    season_points INTEGER DEFAULT 0,
    total_points  INTEGER DEFAULT 0,
    created_at    INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS topic_progress (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    topic   TEXT    NOT NULL,
    done    INTEGER DEFAULT 0,
    points  INTEGER DEFAULT 0,
    UNIQUE(user_id, topic)
  );
`);

// Kolumny dodane w v2 – bezpieczne ALTER TABLE (ignoruje błąd jeśli już istnieją)
try { db.exec('ALTER TABLE users ADD COLUMN daily_streak   INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN last_login_date TEXT    DEFAULT ''"); } catch(e) {}

// Kolumny dodane w v3 – waluta dukat
try { db.exec('ALTER TABLE users ADD COLUMN dukaty INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN owned_avatars TEXT DEFAULT '[]'"); } catch(e) {}

// Kolumny dodane w v4 – system osiągnięć
try { db.exec('ALTER TABLE users ADD COLUMN total_tasks    INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec('ALTER TABLE users ADD COLUMN total_mistakes INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec('ALTER TABLE users ADD COLUMN max_streak     INTEGER DEFAULT 0'); } catch(e) {}

// Kolumny dodane w v5 – tytuły
try { db.exec("ALTER TABLE users ADD COLUMN owned_titles TEXT DEFAULT '[]'"); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN active_title TEXT DEFAULT ''");   } catch(e) {}

// Kolumny dodane w v6 – awatar w bazie
try { db.exec("ALTER TABLE users ADD COLUMN avatar_emoji TEXT DEFAULT ''"); } catch(e) {}

// Kolumny dodane w v7 – galeony (waluta PvP)
try { db.exec('ALTER TABLE users ADD COLUMN galeony INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec('ALTER TABLE users ADD COLUMN pvp_wins INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN owned_galeon_items TEXT DEFAULT '[]'"); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN active_frame TEXT DEFAULT ''"); } catch(e) {}

// Kolumny dodane w v8 – ranking PvP (+2 wygrana, -1 porażka, floor 0)
try { db.exec('ALTER TABLE users ADD COLUMN pvp_rating INTEGER DEFAULT 0'); } catch(e) {}

// Kolumny dodane w v9 – temat wyzwania PvP (wybierany przy tworzeniu wyzwania)
try { db.exec("ALTER TABLE pvp_challenges ADD COLUMN topic TEXT DEFAULT ''"); } catch(e) {}

// Kolumny dodane w v10 – A gra od razu przy tworzeniu wyzwania
try { db.exec('ALTER TABLE pvp_challenges ADD COLUMN p1_started_at INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec('ALTER TABLE pvp_challenges ADD COLUMN p1_score INTEGER DEFAULT 0'); } catch(e) {}

// Tabela osiągnięć użytkownika
db.exec(`
  CREATE TABLE IF NOT EXISTS user_achievements (
    user_id     INTEGER NOT NULL REFERENCES users(id),
    ach_id      TEXT    NOT NULL,
    unlocked_at INTEGER DEFAULT (strftime('%s','now')),
    PRIMARY KEY (user_id, ach_id)
  );
`);

// Tabela dukat_progress – osobny rekord per (user, temat, poziom), max 2 dukaty
db.exec(`
  CREATE TABLE IF NOT EXISTS dukat_progress (
    user_id    INTEGER NOT NULL REFERENCES users(id),
    topic      TEXT    NOT NULL,
    difficulty TEXT    NOT NULL,
    earned     INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, topic, difficulty)
  );
`);

// ── PvP (v6) ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS pvp_challenges (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    challenger_id INTEGER NOT NULL REFERENCES users(id),
    level         TEXT NOT NULL,
    stake_dukats  INTEGER DEFAULT 0,
    stake_points  INTEGER DEFAULT 0,
    expires_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pvp_matches (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    p1_id         INTEGER NOT NULL REFERENCES users(id),
    p2_id         INTEGER NOT NULL REFERENCES users(id),
    level         TEXT NOT NULL,
    stake_dukats  INTEGER DEFAULT 0,
    stake_points  INTEGER DEFAULT 0,
    p1_rounds_won INTEGER DEFAULT 0,
    p2_rounds_won INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active',
    winner_id     INTEGER,
    created_at    INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS pvp_turns (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id   INTEGER NOT NULL REFERENCES pvp_matches(id),
    round_num  INTEGER NOT NULL,
    player_id  INTEGER NOT NULL REFERENCES users(id),
    topic      TEXT,
    score      INTEGER DEFAULT 0,
    started_at INTEGER,
    status     TEXT DEFAULT 'waiting'
  );
`);

// Jednorazowe tokeny resetu hasła (v7)
db.exec(`
  CREATE TABLE IF NOT EXISTS reset_tokens (
    token      TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL,
    used       INTEGER DEFAULT 0
  );
`);

// ── System szkół i klas (v8) ──────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS schools (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS classes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id  INTEGER NOT NULL REFERENCES schools(id),
    name       TEXT    NOT NULL,
    grade      INTEGER NOT NULL,
    teacher_id INTEGER REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS invites (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id   INTEGER NOT NULL REFERENCES classes(id),
    code       TEXT    UNIQUE NOT NULL,
    used_by    INTEGER REFERENCES users(id),
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS class_topics (
    class_id INTEGER NOT NULL REFERENCES classes(id),
    topic    TEXT    NOT NULL,
    unlocked INTEGER DEFAULT 0,
    PRIMARY KEY (class_id, topic)
  );
`);

try { db.exec('ALTER TABLE users ADD COLUMN class_id INTEGER'); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'"); } catch(e) {}
try { db.exec('ALTER TABLE invites ADD COLUMN expires_at INTEGER'); } catch(e) {}

// Kolumny klasowe (v9) – osobne punkty na serwerze klasowym
try { db.exec('ALTER TABLE users ADD COLUMN class_season_points INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec('ALTER TABLE users ADD COLUMN class_total_points  INTEGER DEFAULT 0'); } catch(e) {}

// Tygodniowe punkty (v10)
try { db.exec('ALTER TABLE users ADD COLUMN week_points       INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec('ALTER TABLE users ADD COLUMN class_week_points INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec("ALTER TABLE users ADD COLUMN week_start        TEXT    DEFAULT ''"); } catch(e) {}

// Tygodniowy licznik zadań per temat (v11) – reset co poniedziałek, używany do calcPoints
try { db.exec('ALTER TABLE topic_progress ADD COLUMN week_done  INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec("ALTER TABLE topic_progress ADD COLUMN week_start TEXT    DEFAULT ''"); } catch(e) {}
try { db.exec('ALTER TABLE class_topic_progress ADD COLUMN week_done  INTEGER DEFAULT 0'); } catch(e) {}
try { db.exec("ALTER TABLE class_topic_progress ADD COLUMN week_start TEXT    DEFAULT ''"); } catch(e) {}

// Postęp tematów na serwerze klasowym (oddzielny od globalnego)
db.exec(`
  CREATE TABLE IF NOT EXISTS class_topic_progress (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    topic   TEXT    NOT NULL,
    done    INTEGER DEFAULT 0,
    points  INTEGER DEFAULT 0,
    UNIQUE(user_id, topic)
  );
`);

// Seed: jedna testowa szkoła, klasa, nauczyciel i kody zaproszenia
{
  const bcrypt = require('bcrypt');
  const existing = db.prepare('SELECT id FROM schools LIMIT 1').get();
  if (!existing) {
    const school = db.prepare('INSERT INTO schools (name, city) VALUES (?, ?)').run('Szkoła Przykładowa nr 1', 'Warszawa');
    const schoolId = school.lastInsertRowid;

    const hash = bcrypt.hashSync('nauczyciel', 10);
    db.prepare('INSERT OR IGNORE INTO users (name, password_hash, role) VALUES (?, ?, ?)').run('nauczyciel', hash, 'teacher');
    const teacher = db.prepare("SELECT id FROM users WHERE name = 'nauczyciel'").get();

    const cls = db.prepare('INSERT INTO classes (school_id, name, grade, teacher_id) VALUES (?, ?, ?, ?)').run(schoolId, '4a', 4, teacher.id);
    const classId = cls.lastInsertRowid;

    for (const code of ['ABC-123', 'DEF-456', 'GHI-789']) {
      db.prepare('INSERT OR IGNORE INTO invites (class_id, code) VALUES (?, ?)').run(classId, code);
    }

    console.log('🏫 Seed: szkoła, klasa 4a, nauczyciel (login: nauczyciel / hasło: nauczyciel)');
    console.log('   Kody zaproszenia: ABC-123, DEF-456, GHI-789');
  }
}

// Nadaj rangę admin użytkownikowi Soli (uruchamiane przy każdym starcie serwera)
db.prepare("UPDATE users SET role = 'admin' WHERE LOWER(name) = 'soli'").run();

// Jednorazowe migracje danych
db.prepare(`CREATE TABLE IF NOT EXISTS one_time_migrations (id TEXT PRIMARY KEY)`).run();
function runOnce(id, fn) {
  if (!db.prepare('SELECT id FROM one_time_migrations WHERE id = ?').get(id)) {
    fn();
    db.prepare('INSERT INTO one_time_migrations (id) VALUES (?)').run(id);
  }
}
runOnce('soli_500_dukaty', () => {
  db.prepare("UPDATE users SET dukaty = dukaty + 500 WHERE LOWER(name) = 'soli'").run();
});
runOnce('soli_20_galeony', () => {
  db.prepare("UPDATE users SET galeony = galeony + 20 WHERE LOWER(name) = 'soli'").run();
});

module.exports = db;

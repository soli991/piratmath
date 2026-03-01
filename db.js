// Node 22+ ma wbudowany SQLite – zero zewnętrznych zależności, zero kompilacji
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'piratmath.db'));

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

module.exports = db;

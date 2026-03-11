const express = require('express');
const db      = require('../db');
const { checkAndUnlock } = require('../achievements');

const router = express.Router();

// ── Tematy per poziom (tylko zaimplementowane generatory) ─────
const TOPICS = {
  k13: [
    'Dodawanie i odejmowanie', 'Mnożenie i dzielenie', 'Tabliczka mnożenia',
  ],
  k46: [
    'Świat liczb', 'Liczenie w głowie', 'Własności działań',
    'Dodawanie pisemne', 'Odejmowanie pisemne', 'Mnożenie pisemne', 'Dzielenie pisemne',
    'Dzielenie z resztą', 'Mnożenie liczb z zerami na końcu', 'O ile? Ile razy?', 'Kolejność działań', 'Potęgowanie',
    'Podzielność liczb', 'Zaokrąglanie', 'Porównywanie liczb całkowitych',
  ],
  k78: [
    'Wartość bezwzględna', 'Rozkład liczby na czynniki pierwsze',
    'Wyznaczanie NWD', 'Wyznaczanie NWW', 'Szacowanie pierwiastków',
    'Średnia arytmetyczna', 'Systemy liczbowe', 'Działania na liczbach całkowitych',
  ],
  sr: [
    'Pojęcie logarytmu', 'Własności logarytmów',
    // Liczby i wyrażenia
    'Liczby wymierne i niewymierne', 'Wyrażenia algebraiczne', 'Wzory skróconego mnożenia',
    'Pierwiastki — upraszczanie i działania', 'Potęga o wykładniku wymiernym',
    // Równania i nierówności
    'Nierówności liniowe i przedziały', 'Działania na zbiorach',
    'Wartość bezwzględna — równania i nierówności', 'Układ równań liniowych',
    'Równanie liniowe z parametrem', 'Nierówności kwadratowe',
    'Równanie kwadratowe z parametrem', 'Równania wymierne',
    // Funkcje
    'Pojęcie funkcji', 'Monotoniczność i miejsce zerowe', 'Przekształcenia wykresów funkcji',
    'Wektory', 'Funkcja liniowa', 'Funkcja kwadratowa — postaci',
    'Funkcja wykładnicza', 'Funkcja logarytmiczna',
    // Logarytmy
    'Pojęcie logarytmu', 'Własności logarytmów', 'Równania wykładnicze',
    'Równania logarytmiczne',
    // Wielomiany i wyrażenia wymierne
    'Działania na wielomianach', 'Dzielenie wielomianów', 'Równania wielomianowe',
    'Wyrażenia wymierne — upraszczanie',
    // Trygonometria
    'Trygonometria kąta ostrego', 'Trygonometria kąta rozwartego', 'Wzory trygonometryczne',
    'Twierdzenie sinusów', 'Twierdzenie cosinusów',
    // Geometria analityczna
    'Równanie prostej na płaszczyźnie', 'Odległość punktów i prostych',
    'Równanie okręgu', 'Symetrie na płaszczyźnie',
    // Planimetria
    'Kąty w okręgu', 'Twierdzenie Talesa i podobieństwo', 'Pola i obwody figur',
    // Ciągi
    'Ciąg arytmetyczny', 'Ciąg geometryczny', 'Zastosowania ciągów',
    // Kombinatoryka i prawdopodobieństwo
    'Permutacje i kombinacje', 'Prawdopodobieństwo klasyczne',
    'Prawdopodobieństwo warunkowe', 'Statystyka opisowa',
    // Stereometria
    'Graniastosłupy — pola i objętości', 'Ostrosłupy — pola i objętości',
    'Walec i stożek — pola i objętości', 'Kula — pole i objętość',
    // Pochodna
    'Granica funkcji', 'Pochodna — definicja i wzory', 'Zastosowania pochodnej',
  ],
};

const LEVEL_NAMES = {
  k13: 'Klasy 1–3', k46: 'Klasy 4–6', k78: 'Klasy 7–8', sr: 'Szkoła średnia',
};

const TURN_DURATION = 60; // sekund

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Wymagane logowanie' });
  next();
}

function nowSec() { return Math.floor(Date.now() / 1000); }

function pickRandom(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// ── Logika punktów (identyczna jak w api.js) ──────────────────
function calcPoints(done) {
  if (done < 10) return 10;
  if (done < 20) return 5;
  return 1;
}
function getBonusPts(userId) {
  const row = db.prepare('SELECT COUNT(*) AS cnt FROM user_achievements WHERE user_id = ?').get(userId);
  return Math.floor((row?.cnt || 0) / 15);
}

// ── Sprawdza zakończone tury (timeout) i rundy ────────────────
function resolveMatch(matchId) {
  const now = nowSec();

  // Auto-zakończ aktywne tury po upływie czasu
  db.prepare(`
    UPDATE pvp_turns SET status = 'done'
    WHERE match_id = ? AND status = 'active' AND started_at + ? < ?
  `).run(matchId, TURN_DURATION, now);

  const match = db.prepare('SELECT * FROM pvp_matches WHERE id = ?').get(matchId);
  if (!match || match.status === 'finished') return match;

  // Przelicz wyniki rund od zera (idempotentne, bezpieczne dla wielokrotnych wywołań)
  let p1wins = 0, p2wins = 0, completedRounds = 0;

  for (let r = 1; r <= 3; r++) {
    const p1turn = db.prepare(
      'SELECT * FROM pvp_turns WHERE match_id = ? AND round_num = ? AND player_id = ?'
    ).get(matchId, r, match.p1_id);
    const p2turn = db.prepare(
      'SELECT * FROM pvp_turns WHERE match_id = ? AND round_num = ? AND player_id = ?'
    ).get(matchId, r, match.p2_id);

    if (!p1turn || !p2turn || p1turn.status !== 'done' || p2turn.status !== 'done') continue;
    completedRounds++;
    if (p1turn.score > p2turn.score) p1wins++;
    else if (p2turn.score > p1turn.score) p2wins++;
    // Remis rundy: nikt nie dostaje punktu
  }

  db.prepare('UPDATE pvp_matches SET p1_rounds_won = ?, p2_rounds_won = ? WHERE id = ?')
    .run(p1wins, p2wins, matchId);

  if (completedRounds >= 3) {
    const updated = db.prepare('SELECT * FROM pvp_matches WHERE id = ?').get(matchId);
    finishMatch(updated);
  }

  return db.prepare('SELECT * FROM pvp_matches WHERE id = ?').get(matchId);
}

function finishMatch(match) {
  if (match.status !== 'active') return; // guard against double finish
  const p1w = match.p1_rounds_won;
  const p2w = match.p2_rounds_won;

  let winnerId = null;

  if (p1w > p2w) {
    winnerId = match.p1_id;
  } else if (p2w > p1w) {
    winnerId = match.p2_id;
  } else {
    // Remis 1-1-1: tiebreaker = total score
    const p1score = db.prepare(
      'SELECT COALESCE(SUM(score),0) AS s FROM pvp_turns WHERE match_id = ? AND player_id = ?'
    ).get(match.id, match.p1_id).s;
    const p2score = db.prepare(
      'SELECT COALESCE(SUM(score),0) AS s FROM pvp_turns WHERE match_id = ? AND player_id = ?'
    ).get(match.id, match.p2_id).s;

    if (p1score > p2score) winnerId = match.p1_id;
    else if (p2score > p1score) winnerId = match.p2_id;
    // else: pełny remis → split (winnerId = null)
  }

  db.prepare(`UPDATE pvp_matches SET status = 'finished', winner_id = ? WHERE id = ?`)
    .run(winnerId, match.id);

  if (winnerId) {
    // Zwycięzca dostaje z powrotem swoją stawkę + stawkę przeciwnika
    const loserId = winnerId === match.p1_id ? match.p2_id : match.p1_id;
    db.prepare('UPDATE users SET dukaty = dukaty + ?, season_points = season_points + ? WHERE id = ?')
      .run(match.stake_dukats * 2, match.stake_points * 2, winnerId);
    // Przegrany już stracił stawkę przy accept — nic nie robi

    // Ranking PvP: +2 zwycięzca, -1 przegrany (floor 0), + galeony co 3 wygrane
    const winnerRow = db.prepare('SELECT pvp_wins, pvp_rating FROM users WHERE id = ?').get(winnerId);
    const loserRow  = db.prepare('SELECT pvp_rating FROM users WHERE id = ?').get(loserId);
    const newWins = (winnerRow.pvp_wins || 0) + 1;
    const galonBonus = Math.floor(newWins / 3) - Math.floor((newWins - 1) / 3);
    db.prepare('UPDATE users SET pvp_wins = ?, galeony = galeony + ?, pvp_rating = pvp_rating + 2 WHERE id = ?')
      .run(newWins, galonBonus, winnerId);
    const newLoserRating = Math.max(0, (loserRow.pvp_rating || 0) - 1);
    db.prepare('UPDATE users SET pvp_rating = ? WHERE id = ?').run(newLoserRating, loserId);
  } else {
    // Pełny remis: zwróć obu graczom
    db.prepare('UPDATE users SET dukaty = dukaty + ?, season_points = season_points + ? WHERE id = ?')
      .run(match.stake_dukats, match.stake_points, match.p1_id);
    db.prepare('UPDATE users SET dukaty = dukaty + ?, season_points = season_points + ? WHERE id = ?')
      .run(match.stake_dukats, match.stake_points, match.p2_id);
  }
}

// Zwraca aktualną turę gracza w aktywnym meczu (lub null)
function getMyActiveTurn(matchId, userId) {
  return db.prepare(
    "SELECT * FROM pvp_turns WHERE match_id = ? AND player_id = ? AND status != 'done' ORDER BY round_num ASC LIMIT 1"
  ).get(matchId, userId);
}

// Sprawdza czy to kolej gracza (p2 gra przed p1 w każdej rundzie)
function isMyTurn(matchId, userId, match) {
  const oppId = userId === match.p1_id ? match.p2_id : match.p1_id;
  const isP2  = userId === match.p2_id;

  for (let r = 1; r <= 3; r++) {
    const myTurn = db.prepare(
      'SELECT * FROM pvp_turns WHERE match_id = ? AND round_num = ? AND player_id = ?'
    ).get(matchId, r, userId);

    if (!myTurn || myTurn.status === 'done') continue;

    const oppTurn = db.prepare(
      'SELECT * FROM pvp_turns WHERE match_id = ? AND round_num = ? AND player_id = ?'
    ).get(matchId, r, oppId);

    if (isP2) {
      // P2 idzie pierwszy w rundzie, ale dopiero gdy poprzednia runda jest w pełni rozstrzygnięta
      if (r === 1) return myTurn;
      const myPrev  = db.prepare(
        'SELECT status FROM pvp_turns WHERE match_id = ? AND round_num = ? AND player_id = ?'
      ).get(matchId, r - 1, userId);
      const oppPrev = db.prepare(
        'SELECT status FROM pvp_turns WHERE match_id = ? AND round_num = ? AND player_id = ?'
      ).get(matchId, r - 1, oppId);
      if (myPrev?.status === 'done' && oppPrev?.status === 'done') return myTurn;
    } else {
      // P1 może grać rundę r dopiero gdy P2 skończył rundę r
      if (oppTurn?.status === 'done') return myTurn;
    }
    break;
  }
  return null;
}

// ── POST /api/pvp/challenge ───────────────────────────────────
router.post('/challenge', requireAuth, (req, res) => {
  const { level, stake_dukats = 0, stake_points = 0 } = req.body;
  if (!TOPICS[level]) return res.status(400).json({ error: 'Nieprawidłowy poziom' });

  const dukats = Math.max(0, Math.min(5,  parseInt(stake_dukats) || 0));
  const points = Math.max(0, Math.min(100, parseInt(stake_points) || 0));

  const userId = req.session.userId;

  // Usuń poprzednie wyzwanie tego gracza
  db.prepare('DELETE FROM pvp_challenges WHERE challenger_id = ?').run(userId);

  // Upewnij się że gracz ma aktywny mecz – jeśli tak, odmów
  const activeMatch = db.prepare(`
    SELECT id FROM pvp_matches WHERE (p1_id = ? OR p2_id = ?) AND status = 'active'
  `).get(userId, userId);
  if (activeMatch) return res.status(400).json({ error: 'Masz już aktywny mecz' });

  const expiresAt = nowSec() + 600;
  const result = db.prepare(
    'INSERT INTO pvp_challenges (challenger_id, level, stake_dukats, stake_points, expires_at) VALUES (?,?,?,?,?)'
  ).run(userId, level, dukats, points, expiresAt);

  res.json({ challenge: { id: result.lastInsertRowid, level, stake_dukats: dukats, stake_points: points, expires_at: expiresAt } });
});

// ── DELETE /api/pvp/my-challenge ──────────────────────────────
router.delete('/my-challenge', requireAuth, (req, res) => {
  db.prepare('DELETE FROM pvp_challenges WHERE challenger_id = ?').run(req.session.userId);
  res.json({ ok: true });
});

// ── GET /api/pvp/challenges ───────────────────────────────────
router.get('/challenges', requireAuth, (req, res) => {
  const now = nowSec();
  const userId = req.session.userId;

  // Wyczyść wygasłe
  db.prepare('DELETE FROM pvp_challenges WHERE expires_at < ?').run(now);

  const rows = db.prepare(`
    SELECT c.id, c.level, c.stake_dukats, c.stake_points, c.expires_at, u.name AS challenger_name
    FROM pvp_challenges c
    JOIN users u ON u.id = c.challenger_id
    WHERE c.challenger_id != ?
    ORDER BY c.id DESC
  `).all(userId);

  res.json({ challenges: rows });
});

// ── POST /api/pvp/accept/:id ──────────────────────────────────
router.post('/accept/:id', requireAuth, (req, res) => {
  const challengeId = parseInt(req.params.id);
  const userId = req.session.userId;

  const challenge = db.prepare('SELECT * FROM pvp_challenges WHERE id = ?').get(challengeId);
  if (!challenge) return res.status(404).json({ error: 'Wyzwanie nie istnieje lub wygasło' });
  if (challenge.challenger_id === userId) return res.status(400).json({ error: 'Nie możesz zaakceptować własnego wyzwania' });
  if (challenge.expires_at < nowSec()) {
    db.prepare('DELETE FROM pvp_challenges WHERE id = ?').run(challengeId);
    return res.status(400).json({ error: 'Wyzwanie wygasło' });
  }

  // Sprawdź czy accepter ma już aktywny mecz
  const existingMatch = db.prepare(`
    SELECT id FROM pvp_matches WHERE (p1_id = ? OR p2_id = ?) AND status = 'active'
  `).get(userId, userId);
  if (existingMatch) return res.status(400).json({ error: 'Masz już aktywny mecz' });

  const p1 = db.prepare('SELECT dukaty, season_points FROM users WHERE id = ?').get(challenge.challenger_id);
  const p2 = db.prepare('SELECT dukaty, season_points FROM users WHERE id = ?').get(userId);

  // Va banque
  const actualDukats = Math.min(challenge.stake_dukats, p1.dukaty, p2.dukaty);
  const actualPoints = Math.min(challenge.stake_points, p1.season_points, p2.season_points);

  // Dedukcja stawki od obu graczy
  db.prepare('UPDATE users SET dukaty = dukaty - ?, season_points = season_points - ? WHERE id = ?')
    .run(actualDukats, actualPoints, challenge.challenger_id);
  db.prepare('UPDATE users SET dukaty = dukaty - ?, season_points = season_points - ? WHERE id = ?')
    .run(actualDukats, actualPoints, userId);

  // Utwórz mecz
  const matchResult = db.prepare(`
    INSERT INTO pvp_matches (p1_id, p2_id, level, stake_dukats, stake_points)
    VALUES (?, ?, ?, ?, ?)
  `).run(challenge.challenger_id, userId, challenge.level, actualDukats, actualPoints);
  const matchId = matchResult.lastInsertRowid;

  // Utwórz 6 tur: dla każdej rundy p2 gra przed p1
  for (let r = 1; r <= 3; r++) {
    db.prepare('INSERT INTO pvp_turns (match_id, round_num, player_id) VALUES (?,?,?)')
      .run(matchId, r, userId);                      // p2
    db.prepare('INSERT INTO pvp_turns (match_id, round_num, player_id) VALUES (?,?,?)')
      .run(matchId, r, challenge.challenger_id);     // p1
  }

  // Usuń wyzwanie
  db.prepare('DELETE FROM pvp_challenges WHERE id = ?').run(challengeId);

  res.json({ match_id: matchId, actual_dukats: actualDukats, actual_points: actualPoints });
});

// ── GET /api/pvp/status ───────────────────────────────────────
router.get('/status', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const now = nowSec();

  // Wyczyść wygasłe wyzwania
  db.prepare('DELETE FROM pvp_challenges WHERE expires_at < ?').run(now);

  // Szukaj aktywnego meczu
  const match = db.prepare(`
    SELECT * FROM pvp_matches WHERE (p1_id = ? OR p2_id = ?) AND status = 'active'
  `).get(userId, userId);

  if (match) {
    // Rozstrzygnij gotowe rundy / auto-zakończ tury po timeout
    const resolved = resolveMatch(match.id);

    if (resolved.status === 'finished') {
      const oppId = resolved.p1_id === userId ? resolved.p2_id : resolved.p1_id;
      const opp = db.prepare('SELECT name FROM users WHERE id = ?').get(oppId);
      const myRounds = resolved.p1_id === userId ? resolved.p1_rounds_won : resolved.p2_rounds_won;
      const oppRounds = resolved.p1_id === userId ? resolved.p2_rounds_won : resolved.p1_rounds_won;
      return res.json({
        state: 'match_finished',
        match: {
          id: resolved.id,
          winner_id: resolved.winner_id,
          my_rounds_won:  myRounds,
          opp_rounds_won: oppRounds,
          stake_dukats: resolved.stake_dukats,
          stake_points:  resolved.stake_points,
        },
        opponent_name: opp?.name || '?',
        i_won: resolved.winner_id === userId,
      });
    }

    // Sprawdź czy to moja tura
    const myTurn = isMyTurn(resolved.id, userId, resolved);

    if (myTurn) {
      const myRounds  = resolved.p1_id === userId ? resolved.p1_rounds_won : resolved.p2_rounds_won;
      const oppRounds = resolved.p1_id === userId ? resolved.p2_rounds_won : resolved.p1_rounds_won;
      const oppIdMy   = resolved.p1_id === userId ? resolved.p2_id : resolved.p1_id;
      const oppMy     = db.prepare('SELECT name FROM users WHERE id = ?').get(oppIdMy);
      const baseInfo = {
        id: resolved.id, level: resolved.level,
        round: myTurn.round_num,
        my_rounds_won: myRounds, opp_rounds_won: oppRounds,
      };

      if (myTurn.status === 'active') {
        return res.json({
          state: 'my_turn_playing',
          match: { ...baseInfo, score: myTurn.score },
          topic: myTurn.topic,
          started_at: myTurn.started_at,
          opponent_name: oppMy?.name || '?',
        });
      } else {
        const topics = pickRandom(TOPICS[resolved.level] || [], 4);
        return res.json({ state: 'my_turn_choose', match: baseInfo, topics, opponent_name: oppMy?.name || '?' });
      }
    }

    // Nie moja tura — czekam
    const myRounds  = resolved.p1_id === userId ? resolved.p1_rounds_won : resolved.p2_rounds_won;
    const oppRounds = resolved.p1_id === userId ? resolved.p2_rounds_won : resolved.p1_rounds_won;
    const oppIdW    = resolved.p1_id === userId ? resolved.p2_id : resolved.p1_id;
    const oppW      = db.prepare('SELECT name FROM users WHERE id = ?').get(oppIdW);
    return res.json({
      state: 'waiting_opponent',
      match: {
        id: resolved.id, level: resolved.level,
        round: resolved.p1_rounds_won + resolved.p2_rounds_won + 1,
        my_rounds_won: myRounds, opp_rounds_won: oppRounds,
      },
      opponent_name: oppW?.name || '?',
    });
  }

  // Szukaj oczekującego wyzwania
  const challenge = db.prepare(
    'SELECT * FROM pvp_challenges WHERE challenger_id = ?'
  ).get(userId);

  if (challenge) {
    return res.json({
      state: 'challenge_pending',
      challenge: {
        id: challenge.id, level: challenge.level,
        stake_dukats: challenge.stake_dukats,
        stake_points:  challenge.stake_points,
        expires_at:    challenge.expires_at,
      },
    });
  }

  // Sprawdź ostatnio zakończony mecz (wyświetl raz)
  const finished = db.prepare(`
    SELECT * FROM pvp_matches
    WHERE (p1_id = ? OR p2_id = ?) AND status = 'finished'
    ORDER BY created_at DESC LIMIT 1
  `).get(userId, userId);

  if (finished) {
    const oppId = finished.p1_id === userId ? finished.p2_id : finished.p1_id;
    const opp = db.prepare('SELECT name FROM users WHERE id = ?').get(oppId);
    const myRounds  = finished.p1_id === userId ? finished.p1_rounds_won : finished.p2_rounds_won;
    const oppRounds = finished.p1_id === userId ? finished.p2_rounds_won : finished.p1_rounds_won;
    return res.json({
      state: 'match_finished',
      match: {
        id: finished.id,
        winner_id: finished.winner_id,
        my_rounds_won: myRounds, opp_rounds_won: oppRounds,
        stake_dukats: finished.stake_dukats,
        stake_points:  finished.stake_points,
      },
      opponent_name: opp?.name || '?',
      i_won: finished.winner_id === userId,
    });
  }

  res.json({ state: 'idle' });
});

// ── POST /api/pvp/choose-topic ────────────────────────────────
router.post('/choose-topic', requireAuth, (req, res) => {
  const { topic } = req.body;
  const userId = req.session.userId;

  const match = db.prepare(`
    SELECT * FROM pvp_matches WHERE (p1_id = ? OR p2_id = ?) AND status = 'active'
  `).get(userId, userId);
  if (!match) return res.status(400).json({ error: 'Brak aktywnego meczu' });

  if (!TOPICS[match.level]?.includes(topic))
    return res.status(400).json({ error: 'Nieprawidłowy temat' });

  const myTurn = isMyTurn(match.id, userId, match);
  if (!myTurn || myTurn.status !== 'waiting')
    return res.status(400).json({ error: 'Nie twoja tura lub już wybrałeś temat' });

  const startedAt = nowSec();
  db.prepare("UPDATE pvp_turns SET topic = ?, started_at = ?, status = 'active' WHERE id = ?")
    .run(topic, startedAt, myTurn.id);

  res.json({ ok: true, started_at: startedAt });
});

// ── POST /api/pvp/answer ──────────────────────────────────────
router.post('/answer', requireAuth, (req, res) => {
  const { topic, streak = 0 } = req.body;
  const userId = req.session.userId;
  const now = nowSec();

  const match = db.prepare(`
    SELECT * FROM pvp_matches WHERE (p1_id = ? OR p2_id = ?) AND status = 'active'
  `).get(userId, userId);
  if (!match) return res.status(400).json({ error: 'Brak aktywnego meczu' });

  const myTurn = db.prepare(
    "SELECT * FROM pvp_turns WHERE match_id = ? AND player_id = ? AND status = 'active' LIMIT 1"
  ).get(match.id, userId);
  if (!myTurn) return res.status(400).json({ error: 'Brak aktywnej tury' });
  if (myTurn.started_at + TURN_DURATION < now) return res.status(400).json({ error: 'Czas minął' });

  // Zwiększ wynik PvP (count)
  db.prepare('UPDATE pvp_turns SET score = score + 1 WHERE id = ?').run(myTurn.id);

  // Aktualizuj normalny postęp (topic_progress, points, achievements) — jak w /api/answer/correct
  const existing = db.prepare(
    'SELECT done, points FROM topic_progress WHERE user_id = ? AND topic = ?'
  ).get(userId, topic);

  const currentDone = existing ? existing.done : 0;
  const bonusPts    = getBonusPts(userId);
  const pts         = calcPoints(currentDone) + bonusPts;

  if (existing) {
    db.prepare('UPDATE topic_progress SET done = done + 1, points = points + ? WHERE user_id = ? AND topic = ?')
      .run(pts, userId, topic);
  } else {
    db.prepare('INSERT INTO topic_progress (user_id, topic, done, points) VALUES (?, ?, 1, ?)')
      .run(userId, topic, pts);
  }

  db.prepare(`
    UPDATE users SET
      season_points = season_points + ?,
      total_points  = total_points  + ?,
      total_tasks   = total_tasks   + 1,
      max_streak    = CASE WHEN max_streak > ? THEN max_streak ELSE ? END
    WHERE id = ?
  `).run(pts, pts, streak, streak, userId);

  const newAchs = checkAndUnlock(userId, { topic, topic_done: currentDone + 1 });

  const updatedTurn = db.prepare('SELECT score FROM pvp_turns WHERE id = ?').get(myTurn.id);
  res.json({ pvp_score: updatedTurn.score, pts, done: currentDone + 1, newAchs });
});

// ── POST /api/pvp/end-turn ────────────────────────────────────
router.post('/end-turn', requireAuth, (req, res) => {
  const userId = req.session.userId;

  const match = db.prepare(`
    SELECT * FROM pvp_matches WHERE (p1_id = ? OR p2_id = ?) AND status = 'active'
  `).get(userId, userId);
  if (!match) return res.status(400).json({ error: 'Brak aktywnego meczu' });

  const myTurn = db.prepare(
    "SELECT * FROM pvp_turns WHERE match_id = ? AND player_id = ? AND status = 'active' LIMIT 1"
  ).get(match.id, userId);
  if (!myTurn) return res.status(400).json({ error: 'Brak aktywnej tury' });

  db.prepare("UPDATE pvp_turns SET status = 'done' WHERE id = ?").run(myTurn.id);

  const resolved = resolveMatch(match.id);

  res.json({
    ok: true,
    match_status: resolved.status,
    p1_rounds_won: resolved.p1_rounds_won,
    p2_rounds_won: resolved.p2_rounds_won,
    winner_id: resolved.winner_id,
  });
});

// ── POST /api/pvp/dismiss ─────────────────────────────────────
// Gracz zamknął ekran wyniku — usuń zakończony mecz z widoku (oznacz jako 'seen')
router.post('/dismiss', requireAuth, (req, res) => {
  const userId = req.session.userId;
  db.prepare(`
    UPDATE pvp_matches SET status = 'seen'
    WHERE (p1_id = ? OR p2_id = ?) AND status = 'finished'
  `).run(userId, userId);
  res.json({ ok: true });
});

module.exports = router;

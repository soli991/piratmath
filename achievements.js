const db = require('./db');

// ── PROGI TEMATYCZNE (wspólne z klientem) ─────────────────────────────────────
const TOPIC_THRESHOLDS = [
  { n: 5,   icon: '⭐', suffix: '5 zadań'   },
  { n: 10,  icon: '🌟', suffix: '10 zadań'  },
  { n: 50,  icon: '💪', suffix: '50 zadań'  },
  { n: 100, icon: '🏅', suffix: '100 zadań' },
  { n: 200, icon: '🥈', suffix: '200 zadań' },
  { n: 500, icon: '🏆', suffix: '500 zadań' },
];

function topicSlug(topic) {
  return topic.toLowerCase()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
    .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    .replace(/[^a-z0-9]/g,'_').replace(/__+/g,'_').replace(/^_+|_+$/g,'')
    .slice(0, 25);
}

// ── LISTA WSZYSTKICH OSIĄGNIĘĆ ────────────────────────────────────────────────
const ALL_ACHIEVEMENTS = [
  // PIERWSZE KROKI (5)
  { id: 'first_task',    icon: '🎯', name: 'Pierwsze zadanie!',             cat: 'Pierwsze kroki', desc: 'Rozwiąż swoje pierwsze zadanie.',                 cond: s => s.total_tasks >= 1 },
  { id: 'comeback',      icon: '💪', name: 'Comeback!',                     cat: 'Pierwsze kroki', desc: 'Odpowiedz poprawnie po 2+ błędach.',              cond: s => s.comeback },
  { id: 'night_owl',     icon: '🦉', name: 'Nocna sowa',                    cat: 'Pierwsze kroki', desc: 'Rozwiąż zadanie po 23:00.',                       cond: s => s.night_owl },
  { id: 'early_bird',    icon: '🐦', name: 'Ranny ptaszek',                 cat: 'Pierwsze kroki', desc: 'Rozwiąż zadanie przed 7:00.',                     cond: s => s.early_bird },
  { id: 'weekend',       icon: '🏖️', name: 'Weekend warrior',              cat: 'Pierwsze kroki', desc: 'Rozwiąż zadanie w sobotę lub niedzielę.',         cond: s => s.weekend },

  // WYTRWAŁOŚĆ (10)
  { id: 'tasks_10',      icon: '📝', name: 'Rozgrzewka',                    cat: 'Wytrwałość',     desc: 'Rozwiąż 10 zadań.',                               cond: s => s.total_tasks >= 10 },
  { id: 'tasks_50',      icon: '📚', name: 'Regularny',                     cat: 'Wytrwałość',     desc: 'Rozwiąż 50 zadań.',                               cond: s => s.total_tasks >= 50 },
  { id: 'tasks_100',     icon: '💯', name: 'Setka!',                        cat: 'Wytrwałość',     desc: 'Rozwiąż 100 zadań.',                              cond: s => s.total_tasks >= 100 },
  { id: 'tasks_150',     icon: '🧩', name: 'Rozwiązywacz',                  cat: 'Wytrwałość',     desc: 'Rozwiąż 150 zadań.',                              cond: s => s.total_tasks >= 150 },
  { id: 'tasks_250',     icon: '🔥', name: 'Wytrwały',                      cat: 'Wytrwałość',     desc: 'Rozwiąż 250 zadań.',                              cond: s => s.total_tasks >= 250 },
  { id: 'tasks_500',     icon: '⚡', name: 'Pięćsetka',                     cat: 'Wytrwałość',     desc: 'Rozwiąż 500 zadań.',                              cond: s => s.total_tasks >= 500 },
  { id: 'tasks_750',     icon: '🎯', name: 'Siedemset pięćdziesiąt',        cat: 'Wytrwałość',     desc: 'Rozwiąż 750 zadań.',                              cond: s => s.total_tasks >= 750 },
  { id: 'tasks_1000',    icon: '🏆', name: 'Tysiącznik',                    cat: 'Wytrwałość',     desc: 'Rozwiąż 1000 zadań.',                             cond: s => s.total_tasks >= 1000 },
  { id: 'tasks_1500',    icon: '⭐', name: 'Półtorej tysiąca',              cat: 'Wytrwałość',     desc: 'Rozwiąż 1500 zadań.',                             cond: s => s.total_tasks >= 1500 },
  { id: 'tasks_2000',    icon: '🚀', name: 'Nałogowiec',                    cat: 'Wytrwałość',     desc: 'Rozwiąż 2000 zadań.',                             cond: s => s.total_tasks >= 2000 },
  { id: 'tasks_3000',    icon: '🌊', name: 'Trzy tysiące',                  cat: 'Wytrwałość',     desc: 'Rozwiąż 3000 zadań.',                             cond: s => s.total_tasks >= 3000 },
  { id: 'tasks_5000',    icon: '🌌', name: 'Obsesja',                       cat: 'Wytrwałość',     desc: 'Rozwiąż 5000 zadań.',                             cond: s => s.total_tasks >= 5000 },
  { id: 'tasks_10000',   icon: '🌠', name: 'Legenda matematyki',            cat: 'Wytrwałość',     desc: 'Rozwiąż 10 000 zadań.',                           cond: s => s.total_tasks >= 10000 },
  { id: 'tasks_25000',   icon: '♾️', name: 'Nieskończoność',               cat: 'Wytrwałość',     desc: 'Rozwiąż 25 000 zadań.',                           cond: s => s.total_tasks >= 25000 },
  { id: 'tasks_50000',   icon: '🔱', name: 'Absolut',                       cat: 'Wytrwałość',     desc: 'Rozwiąż 50 000 zadań.',                           cond: s => s.total_tasks >= 50000 },

  // SERIA (5)
  { id: 'streak_5',      icon: '✨', name: 'Rozgrzany',                     cat: 'Seria',          desc: 'Odpowiedz poprawnie 5 razy z rzędu.',             cond: s => s.max_streak >= 5 },
  { id: 'streak_10',     icon: '🔥', name: 'Na fali',                       cat: 'Seria',          desc: 'Odpowiedz poprawnie 10 razy z rzędu.',            cond: s => s.max_streak >= 10 },
  { id: 'streak_20',     icon: '⚡', name: 'Nie do zatrzymania',            cat: 'Seria',          desc: 'Odpowiedz poprawnie 20 razy z rzędu.',            cond: s => s.max_streak >= 20 },
  { id: 'streak_50',     icon: '💫', name: 'Legenda',                       cat: 'Seria',          desc: 'Odpowiedz poprawnie 50 razy z rzędu.',            cond: s => s.max_streak >= 50 },
  { id: 'streak_100',    icon: '👑', name: 'Nieśmiertelny',                 cat: 'Seria',          desc: 'Odpowiedz poprawnie 100 razy z rzędu.',           cond: s => s.max_streak >= 100 },

  // BŁĘDY (7)
  { id: 'mistake_1',     icon: '🙈', name: 'Każdy się myli',                cat: 'Błędy',          desc: 'Popełnij swój pierwszy błąd.',                    cond: s => s.total_mistakes >= 1 },
  { id: 'mistakes_10',   icon: '📖', name: 'Uczę się',                      cat: 'Błędy',          desc: 'Popełnij 10 błędów.',                             cond: s => s.total_mistakes >= 10 },
  { id: 'mistakes_50',   icon: '🧠', name: 'Człowiek uczy się na błędach',  cat: 'Błędy',          desc: 'Popełnij 50 błędów.',                             cond: s => s.total_mistakes >= 50 },
  { id: 'mistakes_100',  icon: '🎓', name: '100 lekcji',                    cat: 'Błędy',          desc: 'Popełnij 100 błędów.',                            cond: s => s.total_mistakes >= 100 },
  { id: 'mistakes_500',  icon: '📕', name: 'Kronikarz błędów',              cat: 'Błędy',          desc: 'Popełnij 500 błędów.',                            cond: s => s.total_mistakes >= 500 },
  { id: 'mistakes_1000', icon: '🔬', name: 'Naukowiec',                     cat: 'Błędy',          desc: 'Popełnij 1000 błędów.',                           cond: s => s.total_mistakes >= 1000 },
  { id: 'mistakes_5000', icon: '🏗️', name: 'Budowniczy wiedzy',           cat: 'Błędy',          desc: 'Popełnij 5000 błędów.',                           cond: s => s.total_mistakes >= 5000 },

  // LOGOWANIE (5)
  { id: 'login_2',       icon: '👋', name: 'Wróciłem!',                     cat: 'Logowanie',      desc: 'Zaloguj się 2 dni z rzędu.',                      cond: s => s.daily_streak >= 2 },
  { id: 'login_7',       icon: '📅', name: 'Tygodniowy',                    cat: 'Logowanie',      desc: 'Zaloguj się 7 dni z rzędu.',                      cond: s => s.daily_streak >= 7 },
  { id: 'login_14',      icon: '🗓️', name: 'Dwa tygodnie',                 cat: 'Logowanie',      desc: 'Zaloguj się 14 dni z rzędu.',                     cond: s => s.daily_streak >= 14 },
  { id: 'login_30',      icon: '🌙', name: 'Miesięczny',                    cat: 'Logowanie',      desc: 'Zaloguj się 30 dni z rzędu.',                     cond: s => s.daily_streak >= 30 },
  { id: 'login_100',     icon: '💎', name: 'Stuprocentowy',                 cat: 'Logowanie',      desc: 'Zaloguj się 100 dni z rzędu.',                    cond: s => s.daily_streak >= 100 },

  // RÓŻNORODNOŚĆ (6)
  { id: 'topics_3',      icon: '🗺️', name: 'Ciekawski',                    cat: 'Różnorodność',   desc: 'Spróbuj 3 różnych tematów.',                      cond: s => s.topics_tried >= 3 },
  { id: 'topics_5',      icon: '🔍', name: 'Eksplorujący',                  cat: 'Różnorodność',   desc: 'Spróbuj 5 różnych tematów.',                      cond: s => s.topics_tried >= 5 },
  { id: 'topics_10',     icon: '🌍', name: 'Wszechstronny',                 cat: 'Różnorodność',   desc: 'Spróbuj 10 różnych tematów.',                     cond: s => s.topics_tried >= 10 },
  { id: 'topics_20',     icon: '📜', name: 'Encyklopedia',                  cat: 'Różnorodność',   desc: 'Spróbuj 20 różnych tematów.',                     cond: s => s.topics_tried >= 20 },
  { id: 'topics_30',     icon: '🧭', name: 'Odkrywca',                      cat: 'Różnorodność',   desc: 'Spróbuj 30 różnych tematów.',                     cond: s => s.topics_tried >= 30 },
  { id: 'topics_50',     icon: '🌐', name: 'Omnibus',                       cat: 'Różnorodność',   desc: 'Spróbuj 50 różnych tematów.',                     cond: s => s.topics_tried >= 50 },
  { id: 'topics_75',     icon: '🎓', name: 'Erudyta tematów',               cat: 'Różnorodność',   desc: 'Spróbuj 75 różnych tematów.',                     cond: s => s.topics_tried >= 75 },
  { id: 'topics_100',    icon: '🔭', name: 'Obserwator wiedzy',             cat: 'Różnorodność',   desc: 'Spróbuj 100 różnych tematów.',                    cond: s => s.topics_tried >= 100 },
  { id: 'topics_125',    icon: '🌠', name: 'Prawie kompletny',              cat: 'Różnorodność',   desc: 'Spróbuj 125 różnych tematów.',                    cond: s => s.topics_tried >= 125 },
  { id: 'topics_151',    icon: '👑', name: 'Koneser wszystkich',            cat: 'Różnorodność',   desc: 'Spróbuj wszystkich 151 tematów!',                 cond: s => s.topics_tried >= 151 },

  // PERFEKCJA (6)
  { id: 'master_1',      icon: '⭐', name: 'Mistrz tematu',                 cat: 'Perfekcja',      desc: 'Ukończ 1 temat (≥20 zadań).',                     cond: s => s.mastered_topics >= 1 },
  { id: 'master_3',      icon: '🌟', name: 'Zaawansowany',                  cat: 'Perfekcja',      desc: 'Ukończ 3 tematy (≥20 zadań każdy).',              cond: s => s.mastered_topics >= 3 },
  { id: 'master_5',      icon: '💫', name: 'Polimat',                       cat: 'Perfekcja',      desc: 'Ukończ 5 tematów (≥20 zadań każdy).',             cond: s => s.mastered_topics >= 5 },
  { id: 'master_10',     icon: '🔮', name: 'Erudyta',                       cat: 'Perfekcja',      desc: 'Ukończ 10 tematów (≥20 zadań każdy).',            cond: s => s.mastered_topics >= 10 },
  { id: 'master_15',     icon: '🎯', name: 'Kolekcjoner tematów',           cat: 'Perfekcja',      desc: 'Ukończ 15 tematów (≥20 zadań każdy).',            cond: s => s.mastered_topics >= 15 },
  { id: 'master_20',     icon: '🏛️', name: 'Akademik',                     cat: 'Perfekcja',      desc: 'Ukończ 20 tematów (≥20 zadań każdy).',            cond: s => s.mastered_topics >= 20 },

  // PUNKTY (8)
  { id: 'pts_100',       icon: '💰', name: 'Pierwsza stówka',               cat: 'Punkty',         desc: 'Zdobądź 100 punktów łącznie.',                    cond: s => s.total_points >= 100 },
  { id: 'pts_500',       icon: '💵', name: 'Pięćsetka',                     cat: 'Punkty',         desc: 'Zdobądź 500 punktów łącznie.',                    cond: s => s.total_points >= 500 },
  { id: 'pts_1000',      icon: '💸', name: 'Tysiącznik',                    cat: 'Punkty',         desc: 'Zdobądź 1000 punktów łącznie.',                   cond: s => s.total_points >= 1000 },
  { id: 'pts_2000',      icon: '🏅', name: 'Dorobkiewicz',                  cat: 'Punkty',         desc: 'Zdobądź 2000 punktów łącznie.',                   cond: s => s.total_points >= 2000 },
  { id: 'pts_5000',      icon: '👑', name: 'Elita',                         cat: 'Punkty',         desc: 'Zdobądź 5000 punktów łącznie.',                   cond: s => s.total_points >= 5000 },
  { id: 'pts_10000',     icon: '💎', name: 'Diamentowy',                    cat: 'Punkty',         desc: 'Zdobądź 10 000 punktów łącznie.',                 cond: s => s.total_points >= 10000 },
  { id: 'pts_25000',     icon: '🌟', name: 'Galaktyczny',                   cat: 'Punkty',         desc: 'Zdobądź 25 000 punktów łącznie.',                 cond: s => s.total_points >= 25000 },
  { id: 'pts_50000',     icon: '🚀', name: 'Kosmonauta punktów',            cat: 'Punkty',         desc: 'Zdobądź 50 000 punktów łącznie.',                 cond: s => s.total_points >= 50000 },

  // SPECJALNE (2)
  { id: 'theme_change',  icon: '🎨', name: 'Stylista',                      cat: 'Specjalne',      desc: 'Zmień motyw kolorystyczny.',                      cond: s => s.theme_change },
  { id: 'lb_view',       icon: '👀', name: 'Obserwator',                    cat: 'Specjalne',      desc: 'Otwórz pełną tablicę wyników.',                   cond: s => s.lb_view },

  // META (6) — co 15 osiągnięć = +1 pkt/zadanie
  { id: 'ach_15',        icon: '🥉', name: 'Kolekcjoner',                   cat: 'Meta',           desc: 'Odblokuj 15 osiągnięć.  Nagroda: +1 pkt/zadanie.',  cond: s => s.ach_count >= 15 },
  { id: 'ach_30',        icon: '🥈', name: 'Entuzjasta',                    cat: 'Meta',           desc: 'Odblokuj 30 osiągnięć.  Nagroda: +2 pkt/zadanie.',  cond: s => s.ach_count >= 30 },
  { id: 'ach_45',        icon: '🥇', name: 'Koneser',                       cat: 'Meta',           desc: 'Odblokuj 45 osiągnięć.  Nagroda: +3 pkt/zadanie.',  cond: s => s.ach_count >= 45 },
  { id: 'ach_75',        icon: '🏆', name: 'Mistrz osiągnięć',             cat: 'Meta',           desc: 'Odblokuj 75 osiągnięć.  Nagroda: +5 pkt/zadanie.',  cond: s => s.ach_count >= 75 },
  { id: 'ach_120',       icon: '💎', name: 'Legenda osiągnięć',            cat: 'Meta',           desc: 'Odblokuj 120 osiągnięć. Nagroda: +8 pkt/zadanie.',  cond: s => s.ach_count >= 120 },
  { id: 'ach_200',       icon: '👑', name: 'Bóg osiągnięć',               cat: 'Meta',           desc: 'Odblokuj 200 osiągnięć. Nagroda: +13 pkt/zadanie.', cond: s => s.ach_count >= 200 },
];

// ── checkAndUnlock ─────────────────────────────────────────────────────────────
// extraFlags: { comeback, night_owl, early_bird, weekend, theme_change, lb_view }
// Zwraca tablicę nowo odblokowanych { id, icon, name }
function checkAndUnlock(userId, extraFlags = {}) {
  // Pobierz stats usera
  const user = db.prepare(
    'SELECT total_tasks, total_mistakes, max_streak, daily_streak, total_points FROM users WHERE id = ?'
  ).get(userId);
  if (!user) return [];


  // Agregaty z topic_progress
  const topicsRow = db.prepare(
    'SELECT COUNT(DISTINCT topic) AS tried, SUM(CASE WHEN done >= 20 THEN 1 ELSE 0 END) AS mastered FROM topic_progress WHERE user_id = ?'
  ).get(userId);

  // Aktualnie odblokowane
  const alreadyRows = db.prepare('SELECT ach_id FROM user_achievements WHERE user_id = ?').all(userId);
  const alreadySet  = new Set(alreadyRows.map(r => r.ach_id));

  const stats = {
    total_tasks:      user.total_tasks    || 0,
    total_mistakes:   user.total_mistakes || 0,
    max_streak:       user.max_streak     || 0,
    daily_streak:     user.daily_streak   || 0,
    total_points:     user.total_points   || 0,
    topics_tried:     topicsRow?.tried    || 0,
    mastered_topics:  topicsRow?.mastered || 0,
    ach_count:        alreadySet.size,
    ...extraFlags,
  };

  const newlyUnlocked = [];

  for (const ach of ALL_ACHIEVEMENTS) {
    if (alreadySet.has(ach.id)) continue;
    if (ach.cond(stats)) {
      newlyUnlocked.push(ach);
      alreadySet.add(ach.id);
      stats.ach_count++;  // aktualizuj na bieżąco (meta osiągnięcia mogą się odblokować w tej samej turze)
    }
  }

  // OSIĄGNIĘCIA TEMATYCZNE (dynamiczne, per temat)
  if (extraFlags.topic && extraFlags.topic_done !== undefined) {
    const slug = topicSlug(extraFlags.topic);
    for (const t of TOPIC_THRESHOLDS) {
      const id = `tp_${slug}_${t.n}`;
      if (!alreadySet.has(id) && extraFlags.topic_done >= t.n) {
        newlyUnlocked.push({ id, icon: t.icon, name: `${extraFlags.topic}: ${t.suffix}` });
        alreadySet.add(id);
        stats.ach_count++;
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    const insertAch = db.prepare(
      'INSERT OR IGNORE INTO user_achievements (user_id, ach_id) VALUES (?, ?)'
    );
    for (const ach of newlyUnlocked) {
      insertAch.run(userId, ach.id);
    }
  }

  const result = newlyUnlocked.map(a => ({ id: a.id, icon: a.icon, name: a.name }));
  return result;
}

module.exports = { ALL_ACHIEVEMENTS, TOPIC_THRESHOLDS, topicSlug, checkAndUnlock };

// ============================================================
// API HELPER
// ============================================================

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (res.status === 401 && path !== '/api/me') {
    // Sesja wygasła (np. po restarcie serwera) — odśwież stronę
    location.reload();
    return {};
  }
  try {
    return await res.json();
  } catch(e) {
    return { error: `HTTP ${res.status}` };
  }
}

// ============================================================
// SOUND ENGINE (Web Audio API)
// ============================================================

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  if (state.muted) return;
  try {
    const ctx = getAudioCtx();
    if (type === 'correct') {
      [[523.25,0,0.12],[659.25,0.1,0.12],[783.99,0.2,0.18],[1046.5,0.32,0.22]].forEach(([freq,delay,dur]) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    } else if (type === 'wrong') {
      [[220,0,0.08],[196,0.06,0.08],[174.6,0.12,0.15]].forEach(([freq,delay,dur]) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    } else if (type === 'complete') {
      [[523.25,0,0.1],[659.25,0.1,0.1],[783.99,0.2,0.1],[1046.5,0.3,0.3],[880,0.5,0.15],[1046.5,0.62,0.4]].forEach(([freq,delay,dur]) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.1);
      });
    } else if (type === 'achievement') {
      // Fanfara osiągnięcia – rosnące złote nuty + finałowy akord
      [[523.25,0,0.1],[659.25,0.1,0.1],[783.99,0.2,0.1],[1046.5,0.3,0.12],[1318.5,0.42,0.22],[1046.5,0.52,0.1],[1318.5,0.62,0.4]].forEach(([freq,delay,dur]) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    } else if (type === 'dukat') {
      // Złota moneta – trzy ostro atakujące "pling" rosnące w górę
      [[1400,0,0.25],[1800,0.12,0.2],[2200,0.22,0.3]].forEach(([freq,delay,dur]) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    }
  } catch(e) { /* audio not available */ }
}

// ============================================================
// DECO INTERACTIVE SOUNDS
// ============================================================

function playDecoNote(freq, wave = 'sine') {
  if (state.muted) return;
  try {
    const ctx = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    // Envelope: attack → sustain → decay
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.22, ctx.currentTime + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.95);
  } catch(e) { /* audio not available */ }
}

function toggleLeftPanel() {
  const isOpening = !document.querySelector('.sidebar-left')?.classList.contains('open');
  document.querySelector('.sidebar-left')?.classList.toggle('open');
  document.getElementById('left-backdrop')?.classList.toggle('show');
  if (isOpening) {
    document.querySelector('.sidebar-right')?.classList.remove('open');
    document.getElementById('right-backdrop')?.classList.remove('show');
  }
}

function toggleRightPanel() {
  const isOpening = !document.querySelector('.sidebar-right')?.classList.contains('open');
  document.querySelector('.sidebar-right')?.classList.toggle('open');
  document.getElementById('right-backdrop')?.classList.toggle('show');
  if (isOpening) {
    document.querySelector('.sidebar-left')?.classList.remove('open');
    document.getElementById('left-backdrop')?.classList.remove('show');
  }
}

function decoClick(el, freq, wave) {
  playDecoNote(freq, wave || 'sine');
  // Animacja bounce – usuń i dodaj z powrotem (wymusz reflow)
  el.classList.remove('deco-popping');
  void el.offsetWidth;
  el.classList.add('deco-popping');
  setTimeout(() => el.classList.remove('deco-popping'), 600);
}

// ============================================================
// DATA & STATE
// ============================================================

const FACTS = [
  "Zero jest jedyną liczbą, która nie jest ani dodatnia, ani ujemna!",
  "Słowo 'matematyka' pochodzi z greckiego 'mathema' – wiedza.",
  "Liczba Pi (π) zawiera każdą możliwą sekwencję cyfr, w tym Twój numer telefonu!",
  "Gdyby złożyć kartkę papieru 103 razy, jej grubość przekroczyłaby rozmiar obserwowalnego Wszechświata!",
  "Liczba Fibonacci: każda liczba to suma dwóch poprzednich: 0, 1, 1, 2, 3, 5, 8, 13...",
  "W 1900 r. matematyk Hilbert zaproponował 23 wielkie problemy. Część jest nierozwiązana do dziś!",
  "Pszczoły instynktownie budują plastry miodu w kształcie sześciokątów – to najbardziej efektywna geometrycznie forma.",
  "Szachy mają więcej możliwych partii niż atomów w obserwowalnym Wszechświecie!"
];

// ============================================================
// LEVELS
// ============================================================

const LEVEL_THRESHOLDS = [0, 30, 100, 250, 500, 900, 1500, 2400, 3700, 5500, 8000];
const LEVEL_NAMES = [
  'Nowicjusz', 'Uczeń', 'Żak', 'Adept', 'Matematyk',
  'Ekspert', 'Mistrz', 'Archimedes', 'Euler', 'Newton', 'Pi-rat 🏴‍☠️'
];

function getLevel(pts)     { return LEVEL_THRESHOLDS.filter(t => pts >= t).length; }
function getLevelName(pts) { return LEVEL_NAMES[getLevel(pts) - 1] || LEVEL_NAMES[LEVEL_NAMES.length - 1]; }
function getNextLevelXp(pts) {
  const lvl = getLevel(pts);
  return lvl < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[lvl] : null;
}
function getPrevLevelXp(pts) {
  const lvl = getLevel(pts);
  return LEVEL_THRESHOLDS[lvl - 1] || 0;
}

// ============================================================
// STREAK FACTS (wyświetlane co 10 odpowiedzi z rzędu)
// ============================================================

const STREAK_FACTS = [
  "Gauss jako 9-latek zsumował liczby od 1 do 100 w kilka sekund — wynik to 5050!",
  "Słowo 'algorytm' pochodzi od imienia Al-Chwarizmiego, perskiego matematyka z IX wieku.",
  "Euler stworzył wzór e^(iπ) + 1 = 0 — matematycy uważają go za najpiękniejszy w historii!",
  "W kartach gry jest 52! możliwych kolejności — to liczba z 68 cyframi!",
  "Ramanujan bez formalnego wykształcenia zapisał 3900 twierdzeń — większość udowodniono dopiero po jego śmierci.",
  "Złota proporcja φ ≈ 1,618 pojawia się w muszelkach, słonecznikach i spiralach galaktyk.",
  "Zagadka Collatza: weź dowolną liczbę, jeśli parzysta → ÷2, jeśli nieparzysta → ×3+1. Zawsze dojdziesz do 1?",
  "Liczba 142857 × 7 = 999 999. Pomnóż ją przez 1–6 — te same cyfry, inna kolejność!",
  "Sekwencja Fibonacciego pojawia się w naturze: płatki kwiatów, gałęzie drzew, spirale muszli.",
  "Hilbert: 'Nie ma nas nie będzie, matematyka będzie trwać'. Pozostawił 23 wielkie problemy — część otwarta do dziś!",
];

// ============================================================
// AVATAR OPTIONS
// ============================================================

const AVATAR_OPTIONS = [
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

let state = {
  currentUser: null,
  currentTopic: null,
  currentDifficulty: 'easy',
  currentAnswer: null,
  currentQuestion: null,
  mistakes: 0,
  questionIndex: 0,
  isFirstAttempt: true,
  answerLocked: false,
  solutionShown: false,
  challengeTime: 60,
  challengeActive: false,
  challengeInterval: null,
  challengeTimeLeft: 60,
  challengeCorrect: 0,
  theme: 'space',
  multActiveRows: new Set([1,2,3,4,5,6,7,8,9,10]),
  multActiveCols: new Set([1,2,3,4,5,6,7,8,9,10]),
  answerStreak: 0,
  avatarEmoji: localStorage.getItem('mq_avatar') || '',
  dukaty: 0,
  ownedAvatars: [],
  muted: localStorage.getItem('mq_muted') === '1',
  achievements: [],
  bonusPts: 0,
  ownedTitles: [],
  activeTitle: '',
  server: localStorage.getItem('mq_server') || 'global', // 'global' | 'class'
  classTopics: null,        // null = brak klasy, Set<string> = odblokowane tematy
  classInfo: null,          // { className, grade, schoolName }
  teacherClassId: null,     // aktualnie wybrana klasa w panelu nauczyciela / server select
  pvp: {
    state: 'idle',          // idle | challenge_pending | my_turn_choose | my_turn_playing | waiting_opponent | match_finished
    pollInterval: null,
    match: null,
    challenge: null,
    topics: [],
    topic: null,
    startedAt: null,
    pvpScore: 0,
    timerInterval: null,
    opponentName: '',
    iWon: null,
  },
};

// ============================================================
// CLASS / SCHOOL SYSTEM
// ============================================================

// ── Wybór serwera ─────────────────────────────────────────────

function showServerSelect() {
  const overlay = document.getElementById('serverSelectOverlay');
  const u = state.currentUser;

  // Podtytuł
  document.getElementById('serverSelectSub').textContent =
    u ? `Witaj, ${u.name}! Na który serwer wchodzisz?` : 'Wybierz serwer';

  // Link do panelu nauczyciela
  const teacherLink = document.getElementById('serverTeacherLink');
  teacherLink.classList.toggle('visible', !!(u && u.role === 'teacher'));

  // Karta klasowa
  const classCard        = document.getElementById('serverCardClass');
  const classBadge       = document.getElementById('serverCardClassBadge');
  const inviteWrap       = document.getElementById('serverCardInvite');
  const teacherClassWrap = document.getElementById('serverTeacherClassWrap');

  const isTeacher     = u?.role === 'teacher';
  const teacherClasses = u?.teacher_classes || [];
  const studentClassId = u?.class_id || null;

  // Ukryj wszystkie warianty
  classBadge.style.display       = 'none';
  inviteWrap.style.display       = 'none';
  teacherClassWrap.style.display = 'none';
  classCard.onclick               = null;

  if (!u) {
    classCard.classList.add('disabled');
  } else if (isTeacher && teacherClasses.length > 0) {
    // Nauczyciel z klasami — dropdown wyboru klasy
    classCard.classList.remove('disabled');
    teacherClassWrap.style.display = '';
    const sel = document.getElementById('serverTeacherClassSelect');
    sel.innerHTML = teacherClasses.map(c =>
      `<option value="${c.id}" ${state.teacherClassId === c.id ? 'selected' : ''}>Klasa ${c.grade}${c.name}</option>`
    ).join('');
    if (!state.teacherClassId) state.teacherClassId = teacherClasses[0].id;
    sel.onchange = () => { state.teacherClassId = parseInt(sel.value); };
    classCard.onclick = () => selectServer('class');
  } else if (studentClassId) {
    // Uczeń w klasie
    classCard.classList.remove('disabled');
    classBadge.style.display = '';
    classBadge.textContent = state.classInfo
      ? `Klasa ${state.classInfo.grade}${state.classInfo.className}`
      : 'Twoja klasa';
    classCard.onclick = () => selectServer('class');
  } else {
    // Brak klasy — pokaż input kodu
    classCard.classList.remove('disabled');
    inviteWrap.style.display = '';
    document.getElementById('serverInviteErr').textContent = '';
    document.getElementById('serverInviteInput').value = '';
  }

  overlay.style.display = 'flex';
}

function hideServerSelect() {
  document.getElementById('serverSelectOverlay').style.display = 'none';
}

async function serverJoinClass() {
  const input = document.getElementById('serverInviteInput');
  const errEl = document.getElementById('serverInviteErr');
  const code  = input.value.trim().toUpperCase();
  errEl.style.color = 'var(--red)';
  errEl.textContent = '';

  if (!code) { errEl.textContent = 'Wpisz kod!'; return; }

  const check = await api('POST', '/api/invite/check', { code });
  if (!check.valid) { errEl.textContent = check.error || 'Nieprawidłowy kod'; return; }

  errEl.style.color = 'var(--accent3)';
  errEl.textContent = `✓ ${check.grade}${check.className} · ${check.schoolName}`;

  const join = await api('POST', '/api/class/join', { code });
  if (join.error) { errEl.style.color = 'var(--red)'; errEl.textContent = join.error; return; }
  join.newAchs?.forEach(a => showAchievementToast(a));

  const me = await api('GET', '/api/me');
  if (me.user) state.currentUser = me.user;
  await loadClassTopics();
  // Odśwież kartę i od razu wejdź na serwer klasowy
  showServerSelect();
  setTimeout(() => selectServer('class'), 500);
}

function selectServer(s) {
  state.server = s;
  localStorage.setItem('mq_server', s);
  hideServerSelect();
  applyClassTopicFilter();
  updateServerIndicator();
  renderLeaderboards();

  // Jeśli uczeń miał aktywny temat i przełączył się na serwer klasowy,
  // a ten temat nie jest odblokowany — wróć do ekranu wyboru tematu
  if (s === 'class' && state.currentTopic && state.classTopics !== null
      && state.currentUser?.role !== 'teacher'
      && CLASS_MANAGED_TOPICS.has(state.currentTopic)
      && !state.classTopics.has(state.currentTopic)) {
    state.currentTopic = null;
    document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('exerciseArea').classList.remove('visible');
    document.getElementById('welcomeScreen').style.display = '';
    showToast('Ten temat nie jest odblokowany na serwerze klasowym', 'info');
  }
}

function updateServerIndicator() {
  const ind = document.getElementById('serverIndicator');
  const lbl = document.getElementById('serverIndicatorLabel');
  if (!state.currentUser) { ind.style.display = 'none'; return; }
  ind.style.display = '';
  if (state.server === 'class') {
    ind.className = 'server-indicator class';
    lbl.textContent = state.classInfo
      ? `Klasa ${state.classInfo.grade}${state.classInfo.className}`
      : 'Klasowy';
  } else {
    ind.className = 'server-indicator';
    lbl.textContent = 'Globalny';
  }
}

// ── Tematy zarządzane przez nauczyciela ────────────────────────

// Tematy zarządzane przez nauczyciela (muszą odpowiadać ALL_TOPICS w school.js)
const CLASS_MANAGED_TOPICS = new Set([
  // Klasy 1–3
  'Dodawanie i odejmowanie','Mnożenie i dzielenie','Tabliczka mnożenia','Porządkowanie liczb',
  'Zegar i czas','Figury geometryczne',
  // Klasy 4–6
  'Świat liczb','Liczenie w głowie','Własności działań','Dodawanie pisemne','Odejmowanie pisemne',
  'Mnożenie pisemne','Dzielenie pisemne','Dzielenie z resztą','Mnożenie liczb z zerami na końcu',
  'O ile? Ile razy?','Kolejność działań','Potęgowanie','Podzielność liczb','Zaokrąglanie',
  'Systemy liczbowe','Porównywanie liczb całkowitych','Działania na liczbach całkowitych',
  'Zapisywanie ułamka zwykłego','Porównywanie ułamków','Skracanie i rozszerzanie ułamków','Zapisywanie liczby mieszanej',
  'Zamiana liczb mieszanych na ułamki niewłaściwe','Dodawanie i odejmowanie ułamków',
  'Mnożenie ułamków','Dzielenie ułamków','Zapisywanie i odczytywanie ułamków dziesiętnych',
  'Dodawanie ułamków dziesiętnych','Odejmowanie ułamków dziesiętnych','Mnożenie ułamków dziesiętnych',
  'Dzielenie ułamków dziesiętnych','Zamiana ułamków dziesiętnych na zwykłe i odwrotnie',
  'Zamiana ułamków na procenty','Obliczanie ułamka danej liczby',
  'Obliczanie liczby, gdy dany jest jej procent','Liczby wymierne',
  'Tworzenie i odczytywanie wyrażeń algebraicznych','Obliczanie wartości wyrażeń algebraicznych',
  'Porządkowanie wyrażeń algebraicznych','Równania',
  'Kąty i proste','Figury płaskie','Trójkąty','Czworokąty','Pola i obwody','Skala',
  'Graniastosłupy i ich podstawowe własności','Ostrosłupy i ich podstawowe własności',
  'Walec, stożek, kula','Czas i zegar','Jednostki miar','Szybkość, droga, czas',
  'Średnia arytmetyczna',
  // Klasy 7–8
  'Liczby wymierne i rzeczywiste','Wartość bezwzględna','Liczby pierwsze i złożone',
  'Rozkład liczby na czynniki pierwsze','Wyznaczanie NWD','Wyznaczanie NWW','Rozwinięcia dziesiętne',
  'Obliczanie procentu danej liczby','Obliczanie liczby na podstawie jej procentu',
  'Jakim procentem jednej liczby jest druga?','Obliczenia procentowe w praktyce',
  'Potęga liczby wymiernej','Mnożenie i dzielenie potęg (ta sama podstawa)',
  'Mnożenie i dzielenie potęg (ten sam wykładnik)','Potęga potęgi','Notacja wykładnicza',
  'Pierwiastek kwadratowy i sześcienny','Szacowanie pierwiastków','Działania na pierwiastkach',
  'Dodawanie i odejmowanie sum algebraicznych','Mnożenie sumy przez jednomian',
  'Mnożenie sum algebraicznych',
  'Sprawdzanie, czy dana liczba spełnia równanie','Równania I stopnia z jedną niewiadomą',
  'Przekształcanie wzorów','Proporcja i jej własności','Wielkości wprost proporcjonalne',
  'Podział proporcjonalny','Twierdzenie Pitagorasa','Twierdzenie odwrotne do twierdzenia Pitagorasa',
  'Trójkąt 30-60-90','Trójkąt 45-45-90','Wielokąty i ich pola','Okrąg i koło — długość i pole',
  'Układ współrzędnych','Graniastosłupy — pole powierzchni i objętość',
  'Ostrosłupy — pole powierzchni i objętość',
  'Prawdopodobieństwo zdarzenia','Reguła mnożenia i dodawania',
  // Szkoła średnia
  'Liczby wymierne i niewymierne','Wyrażenia algebraiczne','Wzory skróconego mnożenia',
  'Pierwiastki — upraszczanie i działania','Potęga o wykładniku wymiernym',
  'Nierówności liniowe i przedziały','Działania na zbiorach',
  'Wartość bezwzględna — równania i nierówności','Układ równań liniowych',
  'Równanie liniowe z parametrem','Nierówności kwadratowe','Równanie kwadratowe z parametrem',
  'Równania wymierne','Pojęcie funkcji','Monotoniczność i miejsce zerowe',
  'Przekształcenia wykresów funkcji','Wektory','Funkcja liniowa','Funkcja kwadratowa — postaci',
  'Funkcja wykładnicza','Funkcja logarytmiczna','Pojęcie logarytmu','Własności logarytmów',
  'Równania wykładnicze','Równania logarytmiczne','Działania na wielomianach',
  'Dzielenie wielomianów','Równania wielomianowe','Wyrażenia wymierne — upraszczanie',
  'Trygonometria kąta ostrego','Trygonometria kąta rozwartego','Wzory trygonometryczne',
  'Twierdzenie sinusów','Twierdzenie cosinusów','Równanie prostej na płaszczyźnie',
  'Odległość punktów i prostych','Równanie okręgu','Symetrie na płaszczyźnie',
  'Kąty w okręgu','Twierdzenie Talesa i podobieństwo','Pola i obwody figur',
  'Ciąg arytmetyczny','Ciąg geometryczny','Zastosowania ciągów',
  'Permutacje i kombinacje','Prawdopodobieństwo klasyczne','Prawdopodobieństwo warunkowe',
  'Statystyka opisowa','Graniastosłupy — pola i objętości','Ostrosłupy — pola i objętości',
  'Walec i stożek — pola i objętości','Kula — pole i objętość',
  'Granica funkcji','Pochodna — definicja i wzory','Zastosowania pochodnej',
]);

async function loadClassTopics() {
  if (!state.currentUser) return;

  if (state.currentUser.role === 'teacher') {
    // Nauczyciel — zainicjuj teacherClassId jeśli nie ustawiony
    const classes = state.currentUser.teacher_classes || [];
    if (!state.teacherClassId && classes.length > 0) state.teacherClassId = classes[0].id;
    const cls = classes.find(c => c.id === state.teacherClassId);
    if (cls) {
      state.classInfo = { className: cls.name, grade: cls.grade, schoolName: cls.schoolName };
    }
    // Nauczyciel widzi wszystkie tematy — brak filtrowania
    state.classTopics = null;
    applyClassTopicFilter();
    updateWelcomeClassSection();
    return;
  }

  const data = await api('GET', '/api/class/topics');
  if (data.classId) {
    state.classTopics = new Set(data.topics.filter(t => t.unlocked).map(t => t.topic));
    state.classInfo   = { className: data.className, grade: data.grade, schoolName: data.schoolName };
  } else {
    state.classTopics = null;
    state.classInfo   = null;
  }
  applyClassTopicFilter();
  updateWelcomeClassSection();
}

function applyClassTopicFilter() {
  const isClassMode = state.server === 'class'
    && state.classTopics !== null
    && state.currentUser?.role !== 'teacher';

  // Ukryj/pokaż przyciski tematów
  document.querySelectorAll('.topic-btn').forEach(btn => {
    const m = (btn.getAttribute('onclick') || '').match(/selectTopic\('([^']+)'/);
    if (!m) return;
    const topic = m[1];
    const hide = isClassMode && CLASS_MANAGED_TOPICS.has(topic) && !state.classTopics.has(topic);
    btn.style.display = hide ? 'none' : '';
    btn.classList.remove('class-locked');
  });

  // Ukryj etykiety sekcji, po których nie ma widocznych tematów
  document.querySelectorAll('.topics-list').forEach(list => {
    let label = null;
    let hasVisible = false;
    Array.from(list.children).forEach(el => {
      if (el.classList.contains('topic-section-label')) {
        if (label) label.style.display = hasVisible ? '' : 'none';
        label = el;
        hasVisible = false;
      } else if (el.classList.contains('topic-btn')) {
        if (el.style.display !== 'none') hasVisible = true;
      }
    });
    if (label) label.style.display = hasVisible ? '' : 'none';
  });

  // Ukryj całe grupy poziomów bez widocznych tematów
  document.querySelectorAll('.level-group').forEach(group => {
    const anyVisible = Array.from(group.querySelectorAll('.topic-btn'))
      .some(btn => btn.style.display !== 'none');
    group.style.display = anyVisible ? '' : 'none';
  });
}

function updateWelcomeClassSection() {
  // Sekcja welcome screena — badge gdy na serwerze klasowym
  const badgeEl = document.getElementById('classBadge');
  const inviteEl = document.getElementById('classInviteSection');
  if (inviteEl) inviteEl.style.display = 'none'; // przeniesione do server select overlay
  if (!badgeEl) return;
  if (state.currentUser && state.classInfo && state.server === 'class') {
    badgeEl.style.display = '';
    document.getElementById('classBadgeText').textContent =
      `Klasa ${state.classInfo.grade}${state.classInfo.className} · ${state.classInfo.schoolName}`;
  } else {
    badgeEl.style.display = 'none';
  }
}

async function submitInviteCode() {
  const input  = document.getElementById('inviteCodeInput');
  const errEl  = document.getElementById('inviteError');
  const code   = input.value.trim().toUpperCase();
  errEl.style.color = 'var(--red)';
  errEl.textContent = '';

  if (!code) { errEl.textContent = 'Wpisz kod!'; return; }

  const check = await api('POST', '/api/invite/check', { code });
  if (!check.valid) { errEl.textContent = check.error || 'Nieprawidłowy kod'; return; }

  errEl.style.color = 'var(--accent3)';
  errEl.textContent = `✓ Dołączasz do klasy ${check.grade}${check.className} w ${check.schoolName}…`;

  const join = await api('POST', '/api/class/join', { code });
  if (join.error) {
    errEl.style.color = 'var(--red)';
    errEl.textContent = join.error;
    return;
  }
  join.newAchs?.forEach(a => showAchievementToast(a));

  // Odśwież dane użytkownika
  const me = await api('GET', '/api/me');
  if (me.user) state.currentUser = me.user;
  input.value = '';
  await loadClassTopics();
}

async function leaveClass() {
  await api('POST', '/api/class/leave', {});
  if (state.currentUser) state.currentUser.class_id = null;
  state.classTopics = null;
  state.classInfo   = null;
  applyClassTopicFilter();
  updateWelcomeClassSection();
}

// ============================================================
// TEACHER PANEL MODAL
// ============================================================

let _tpTab = 'topics';

function openTeacherPanel() {
  document.getElementById('tpOverlay').style.display = 'flex';
  const classes = state.currentUser?.teacher_classes || [];
  const bar = document.getElementById('tpClassBar');
  const sel = document.getElementById('tpClassSelect');
  bar.style.display = '';
  if (classes.length > 0) {
    if (!state.teacherClassId) state.teacherClassId = classes[0].id;
    sel.style.display = '';
    document.querySelector('[onclick="tpDeleteClass()"]').style.display = '';
    sel.innerHTML = classes.map(c =>
      `<option value="${c.id}" ${state.teacherClassId === c.id ? 'selected' : ''}>Klasa ${c.grade}${c.name} · ${c.schoolName}</option>`
    ).join('');
  } else {
    // Brak klas — ukryj dropdown i usuń, pokaż tylko "+ Dodaj" i od razu otwórz formularz
    sel.style.display = 'none';
    document.querySelector('[onclick="tpDeleteClass()"]').style.display = 'none';
    state.teacherClassId = null;
    setTimeout(() => tpToggleAddClass(), 50);
  }
  tpShowTab(_tpTab);
}

function closeTeacherPanel() {
  document.getElementById('tpOverlay').style.display = 'none';
}

function tpCloseBg(e) {
  if (e.target.id === 'tpOverlay') closeTeacherPanel();
}

function tpShowTab(tab) {
  _tpTab = tab;
  document.getElementById('tpTabTopics').classList.toggle('active',   tab === 'topics');
  document.getElementById('tpTabInvites').classList.toggle('active',  tab === 'invites');
  document.getElementById('tpTabStudents').classList.toggle('active', tab === 'students');
  if (tab === 'topics')        tpLoadTopics();
  else if (tab === 'students') tpLoadStudents();
  else                         tpLoadInvites();
}

let _tpTooltipCache = {};

async function tpLoadStudents() {
  _tpTooltipCache = {};
  const body = document.getElementById('tpBody');
  body.innerHTML = '<div style="color:var(--text3)">Ładowanie…</div>';
  if (!state.teacherClassId) { body.innerHTML = '<div style="color:var(--text3)">Wybierz klasę.</div>'; return; }

  const students = await api('GET', `/api/teacher/students?classId=${state.teacherClassId}`);
  if (!Array.isArray(students)) { body.innerHTML = '<div style="color:var(--red)">Błąd ładowania</div>'; return; }

  if (students.length === 0) {
    body.innerHTML = '<div style="color:var(--text3);font-size:13px">Brak uczniów w tej klasie.</div>';
    return;
  }

  // Zapisz dane tematów do cache tooltipa
  for (const s of students) _tpTooltipCache[s.id] = s.topics || [];

  body.innerHTML = `
    <div style="font-size:13px;color:var(--text2);margin-bottom:4px">
      ${students.length} ${students.length === 1 ? 'uczeń' : 'uczniów'} w klasie
    </div>
    <div class="tp-students-table">
      <div class="tp-students-header">
        <span class="tp-sth-name">Uczeń</span>
        <span class="tp-sth-pts">Ten tydzień</span>
        <span class="tp-sth-pts">Sezonowe</span>
        <span class="tp-sth-pts">Łącznie</span>
        <span class="tp-sth-pts" style="min-width:110px">Reset hasła</span>
        <span class="tp-sth-action"></span>
      </div>
      ${students.map((s, i) => `
        <div class="tp-student-row">
          <span class="tp-std-rank">${i + 1}.</span>
          <span class="tp-std-name">${escHtml(s.name)}</span>
          <span class="tp-std-pts tp-std-week" style="${s.week_points > 0 ? 'color:var(--accent)' : ''}" onmouseenter="tpShowTopicTooltip(event,${s.id})" onmouseleave="tpHideTopicTooltip()">${s.week_points ?? 0}</span>
          <span class="tp-std-pts">${s.class_season_points ?? 0}</span>
          <span class="tp-std-pts">${s.class_total_points ?? 0}</span>
          <span class="tp-std-pts" style="min-width:110px" id="resetcell-${s.id}">
            <button class="tp-std-reset" style="font-size:11px;width:auto;padding:2px 8px" onclick="tpResetStudentPassword(${s.id}, this)">🔑 Generuj kod</button>
          </span>
          <button class="tp-std-remove" title="Usuń z klasy" onclick="tpRemoveStudent(${s.id}, '${escHtml(s.name)}')">✕</button>
        </div>`).join('')}
    </div>`;
}

function tpShowTopicTooltip(event, studentId) {
  const tt = document.getElementById('tpTopicTooltip');
  if (!tt) return;
  const topics = _tpTooltipCache[studentId] || [];
  tt.innerHTML = topics.length === 0
    ? '<div class="ttp-title">Postęp w tematach</div><div class="ttp-empty">Brak postępu</div>'
    : `<div class="ttp-title">Postęp w tematach</div>${topics.map(t => `<div class="ttp-row"><span>${escHtml(t.topic)}</span><span class="ttp-pts">${t.points} pkt</span></div>`).join('')}`;
  tt.style.left = (event.clientX + 14) + 'px';
  tt.style.top  = (event.clientY + 14) + 'px';
  tt.style.display = 'block';
  // Nie wychodź poza ekran
  const rect = tt.getBoundingClientRect();
  if (rect.right  > window.innerWidth  - 8) tt.style.left = (event.clientX - rect.width  - 8) + 'px';
  if (rect.bottom > window.innerHeight - 8) tt.style.top  = (event.clientY - rect.height - 8) + 'px';
}

function tpHideTopicTooltip() {
  const tt = document.getElementById('tpTopicTooltip');
  if (tt) tt.style.display = 'none';
}

async function tpResetStudentPassword(studentId, btn) {
  const cell = btn.parentElement;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const data = await api('POST', '/api/teacher/reset-token', { studentId, classId: state.teacherClassId });
    if (data.error) {
      cell.innerHTML = `<span style="color:var(--red);font-size:11px">${escHtml(data.error)}</span>`;
    } else {
      cell.innerHTML = `<span style="font-family:monospace;font-weight:900;font-size:15px;letter-spacing:3px;color:var(--accent)">${data.token}</span><span style="color:var(--text3);font-size:10px;margin-left:4px">24h</span>`;
    }
  } catch(e) {
    cell.innerHTML = `<span style="color:var(--red);font-size:11px">Błąd</span>`;
  }
}

async function tpRemoveStudent(studentId, studentName) {
  if (!confirm(`Usunąć ucznia „${studentName}" z klasy?\n\nUczeń straci dostęp do serwera klasowego.`)) return;
  const data = await api('DELETE', `/api/teacher/students/${studentId}?classId=${state.teacherClassId}`);
  if (data.error) { alert(data.error); return; }
  tpLoadStudents();
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function tpLoadTopics() {
  const body = document.getElementById('tpBody');
  body.innerHTML = '<div style="color:var(--text3)">Ładowanie…</div>';
  if (!state.teacherClassId) {
    body.innerHTML = '<div style="color:var(--text3);font-size:13px">Nie masz jeszcze żadnej klasy. Utwórz klasę przyciskiem powyżej.</div>';
    return;
  }
  const topics = await api('GET', `/api/teacher/topics?classId=${state.teacherClassId}`);
  if (!Array.isArray(topics)) { body.innerHTML = '<div style="color:var(--red)">Błąd ładowania</div>'; return; }

  // Grupuj po poziomie, zachowując oryginalną kolejność
  const levels = [];
  const levelMap = {};
  for (const t of topics) {
    if (!levelMap[t.level]) { levelMap[t.level] = []; levels.push(t.level); }
    levelMap[t.level].push(t);
  }

  body.innerHTML = '<div style="font-size:13px;color:var(--text2);margin-bottom:4px">Włącz tematy, które uczniowie mogą ćwiczyć na serwerze klasowym.</div>';

  for (const level of levels) {
    const ts      = levelMap[level];
    const onCount = ts.filter(t => t.unlocked).length;
    const sec     = document.createElement('div');
    sec.className = 'tp-level-section';
    sec.innerHTML = `
      <div class="tp-level-header" onclick="tpToggleLevel(this.parentElement)">
        <span class="tp-level-arrow">▼</span>
        <span class="tp-level-name">${level}</span>
        <span class="tp-level-count" id="tplc-${CSS.escape(level)}">${onCount}/${ts.length}</span>
      </div>
      <div class="tp-level-body">
        ${ts.map(t => `
          <div class="tp-topic-row ${t.unlocked ? 'on' : ''}" id="tpr-${CSS.escape(t.topic)}">
            <span class="tp-topic-name">${t.topic}</span>
            <button class="tp-toggle ${t.unlocked ? 'on' : ''}"
              onclick="tpToggleTopic('${t.topic.replace(/'/g,"\\'")}', this)"></button>
          </div>`).join('')}
      </div>`;
    body.appendChild(sec);
  }
}

function tpToggleLevel(section) {
  section.classList.toggle('collapsed');
}

async function tpToggleTopic(topic, btn) {
  const nowOn = !btn.classList.contains('on');
  btn.classList.toggle('on', nowOn);
  const row = btn.closest('.tp-topic-row');
  row.classList.toggle('on', nowOn);
  // Zaktualizuj licznik X/Y w nagłówku sekcji
  const section = row.closest('.tp-level-section');
  if (section) {
    const levelName = section.querySelector('.tp-level-name')?.textContent;
    const rows = section.querySelectorAll('.tp-topic-row');
    const onRows = section.querySelectorAll('.tp-topic-row.on');
    const cntEl = document.getElementById('tplc-' + CSS.escape(levelName));
    if (cntEl) cntEl.textContent = `${onRows.length}/${rows.length}`;
  }
  await api('PUT', '/api/teacher/topics', { topic, unlocked: nowOn, classId: state.teacherClassId });
  await loadClassTopics();
}

async function tpLoadInvites() {
  const body = document.getElementById('tpBody');
  body.innerHTML = '<div style="color:var(--text3)">Ładowanie…</div>';
  const invites = await api('GET', `/api/teacher/invites?classId=${state.teacherClassId || ''}`);

  body.innerHTML = `
    <div class="tp-section-header">
      <span>Kody zaproszenia <span style="color:var(--text3);font-weight:400;font-size:12px">(jednorazowe, ważne 7 dni)</span></span>
      <button class="btn btn-primary btn-sm" onclick="tpGenerateInvite()">+ Nowy kod</button>
    </div>
    <div id="tpInvitesList"></div>`;

  tpRenderInvites(invites);
}

function tpRenderInvites(invites) {
  const list = document.getElementById('tpInvitesList');
  if (!list) return;
  if (!invites.length) { list.innerHTML = '<div style="color:var(--text3);font-size:13px">Brak kodów.</div>'; return; }
  list.innerHTML = invites.map(inv => {
    let meta, codeClass = 'tp-code';
    if (inv.used) {
      meta = `<span class="tp-invite-meta used">✓ Użyty: ${inv.usedByName}</span>`;
    } else if (inv.expired) {
      meta = `<span class="tp-invite-meta">⌛ Wygasł</span>`;
      codeClass += ' expired';
    } else {
      const days = inv.expiresAt ? Math.ceil((inv.expiresAt - Date.now()/1000) / 86400) : '?';
      meta = `<span class="tp-invite-meta free">● Wolny · wygasa za ${days}d</span>`;
    }
    return `<div class="tp-invite-row">
      <span class="${codeClass}">${inv.code}</span>
      ${meta}
    </div>`;
  }).join('');
}

async function tpGenerateInvite() {
  const data = await api('POST', '/api/teacher/invite', { classId: state.teacherClassId });
  if (data.code) tpLoadInvites();
}

function tpSelectClass(classId) {
  state.teacherClassId = parseInt(classId);
  tpShowTab(_tpTab); // przeładuj aktualną zakładkę
}

async function tpDeleteClass() {
  const cls = (state.currentUser?.teacher_classes || []).find(c => c.id === state.teacherClassId);
  if (!cls) return;

  const label = `Klasa ${cls.grade}${cls.name} · ${cls.schoolName}`;
  if (!confirm(`Czy na pewno chcesz usunąć ${label}?\n\nWszyscy uczniowie zostaną odpisani od klasy. Tej operacji nie można cofnąć.`)) return;

  const data = await api('DELETE', `/api/teacher/classes/${state.teacherClassId}`);
  if (data.error) { alert(data.error); return; }

  // Odśwież dane
  const me = await api('GET', '/api/me');
  if (me.user) state.currentUser = me.user;

  const remaining = state.currentUser.teacher_classes || [];
  state.teacherClassId = remaining.length > 0 ? remaining[0].id : null;
  openTeacherPanel();
}

async function tpToggleAddClass() {
  const form = document.getElementById('tpAddClassForm');
  const isOpen = form.style.display === 'flex';
  form.style.display = isOpen ? 'none' : 'flex';
  document.getElementById('tpAddClassErr').textContent = '';
  if (!isOpen) {
    const classes = state.currentUser?.teacher_classes || [];
    const schoolWrap = document.getElementById('tpNewClassSchoolWrap');
    if (classes.length === 0) {
      schoolWrap.style.display = 'flex';
      const schools = await api('GET', '/api/schools');
      document.getElementById('tpNewClassSchool').innerHTML =
        (schools || []).map(s => `<option value="${s.id}">${s.name} — ${s.city}</option>`).join('');
    } else {
      schoolWrap.style.display = 'none';
    }
  }
}

async function tpSubmitAddClass() {
  const name  = document.getElementById('tpNewClassName').value.trim();
  const grade = document.getElementById('tpNewClassGrade').value;
  const errEl = document.getElementById('tpAddClassErr');
  errEl.textContent = '';
  if (!name || !grade) { errEl.textContent = 'Wpisz nazwę i poziom klasy.'; return; }

  const classes  = state.currentUser?.teacher_classes || [];
  const schoolId = classes.length === 0
    ? parseInt(document.getElementById('tpNewClassSchool').value)
    : null;

  const data = await api('POST', '/api/teacher/classes', { name, grade: parseInt(grade), schoolId });
  if (data.error) { errEl.textContent = data.error; return; }

  // Odśwież teacher_classes w stanie
  const me = await api('GET', '/api/me');
  if (me.user) state.currentUser = me.user;

  state.teacherClassId = data.id;
  document.getElementById('tpAddClassForm').style.display = 'none';
  document.getElementById('tpNewClassName').value  = '';
  document.getElementById('tpNewClassGrade').value = '';
  openTeacherPanel(); // przeładuj pasek klas i zakładkę
}

function updateTeacherBtn() {
  const btn = document.getElementById('teacherPanelBtn');
  if (btn) btn.style.display = state.currentUser?.role === 'teacher' ? '' : 'none';
}

// ============================================================
// ADMIN PANEL
// ============================================================

function updateAdminBtn() {
  const btn = document.getElementById('adminPanelBtn');
  if (btn) btn.style.display = state.currentUser?.role === 'admin' ? '' : 'none';
}

function openChangelog() { document.getElementById('changelogOverlay').style.display = ''; }
function closeChangelog() { document.getElementById('changelogOverlay').style.display = 'none'; }

function openAdminPanel() {
  _apRoleFilter = '';
  document.getElementById('apOverlay').style.display = 'flex';
  apShowTab('users');
}

function closeAdminPanel() {
  document.getElementById('apOverlay').style.display = 'none';
}

function apCloseBg(e) {
  if (e.target.id === 'apOverlay') closeAdminPanel();
}

function apShowTab(tab) {
  document.getElementById('apTabUsers').classList.toggle('active',   tab === 'users');
  document.getElementById('apTabSchools').classList.toggle('active', tab === 'schools');
  document.getElementById('apTabStats').classList.toggle('active',   tab === 'stats');
  if (tab === 'users')        apLoadUsers();
  else if (tab === 'schools') apLoadSchools();
  else                        apLoadStats();
}

async function apLoadSchools() {
  const body = document.getElementById('apBody');
  body.innerHTML = '<div style="color:var(--text3)">Ładowanie…</div>';
  const schools = await api('GET', '/api/admin/schools');
  if (!Array.isArray(schools)) {
    body.innerHTML = `<div style="color:var(--red)">${escHtml(schools.error || 'Błąd')}</div>`;
    return;
  }

  const schoolOptions = schools.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');

  body.innerHTML = `
    <details style="margin-bottom:14px">
      <summary style="cursor:pointer;font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;user-select:none">+ Dodaj szkołę</summary>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <input id="apSchoolName" class="ap-search" type="text" placeholder="Nazwa szkoły" style="flex:2;min-width:140px">
        <input id="apSchoolCity" class="ap-search" type="text" placeholder="Miasto" style="flex:1;min-width:100px">
        <button class="btn btn-sm" onclick="apAddSchool()" style="flex-shrink:0">Dodaj</button>
      </div>
      <div id="apSchoolErr" style="font-size:12px;color:var(--red);margin-top:4px"></div>
    </details>

    <details style="margin-bottom:14px">
      <summary style="cursor:pointer;font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;user-select:none">+ Dodaj klasę</summary>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <select id="apClassSchool" class="ap-role-sel" style="flex:2;min-width:140px;padding:7px 8px;font-size:13px">
          ${schoolOptions || '<option disabled>Brak szkół</option>'}
        </select>
        <input id="apClassName"    class="ap-search" type="text" placeholder='Nazwa (np. 4b)' style="flex:1;min-width:80px">
        <input id="apClassTeacher" class="ap-search" type="text" placeholder="Login nauczyciela" style="flex:2;min-width:120px">
        <button class="btn btn-sm" onclick="apAddClass()" style="flex-shrink:0">Dodaj</button>
      </div>
      <div id="apClassErr" style="font-size:12px;color:var(--red);margin-top:4px"></div>
    </details>

    <div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
      Szkoły i klasy (${schools.length})
    </div>
    ${schools.length === 0
      ? '<div style="color:var(--text3);font-style:italic">Brak szkół</div>'
      : schools.map(s => `
        <div style="margin-bottom:12px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${escHtml(s.name)}${s.city ? ` <span style="color:var(--text3);font-weight:400;font-size:12px">· ${escHtml(s.city)}</span>` : ''}</div>
          ${s.classes.length === 0
            ? '<div style="color:var(--text3);font-size:12px;padding-left:10px;font-style:italic">Brak klas</div>'
            : s.classes.map(c => `
              <div class="ap-user-row" style="padding-left:10px">
                <div class="ap-user-name" style="font-size:13px">${escHtml(c.name)}</div>
                <div style="font-size:12px;color:var(--text3)">${c.teacherName ? escHtml(c.teacherName) : '<i>brak nauczyciela</i>'}</div>
              </div>
            `).join('')}
        </div>
      `).join('')}
  `;
}

async function apAddSchool() {
  const name = document.getElementById('apSchoolName').value.trim();
  const city = document.getElementById('apSchoolCity').value.trim();
  const err  = document.getElementById('apSchoolErr');
  err.textContent = '';
  if (!name) { err.textContent = 'Podaj nazwę szkoły'; return; }
  const res = await api('POST', '/api/admin/schools', { name, city });
  if (res.error) { err.textContent = res.error; return; }
  showToast(`Dodano szkołę: ${name}`, 'success');
  apLoadSchools();
}

async function apAddClass() {
  const schoolId    = document.getElementById('apClassSchool').value;
  const name        = document.getElementById('apClassName').value.trim();
  const teacherName = document.getElementById('apClassTeacher').value.trim();
  const err         = document.getElementById('apClassErr');
  err.textContent = '';
  if (!schoolId || !name) { err.textContent = 'Podaj szkołę i nazwę klasy'; return; }
  const res = await api('POST', '/api/admin/classes', { schoolId, name, teacherName: teacherName || undefined });
  if (res.error) { err.textContent = res.error; return; }
  showToast(`Dodano klasę ${name}${teacherName ? ` (${teacherName})` : ''}`, 'success');
  apLoadSchools();
}

let _apRoleFilter = '';
let _apSearchTimer = null;

async function apLoadUsers(q = '', role = _apRoleFilter) {
  _apRoleFilter = role;
  const body = document.getElementById('apBody');
  body.innerHTML = '<div style="color:var(--text3)">Ładowanie…</div>';
  const p = new URLSearchParams();
  if (q)    p.set('q', q);
  if (role) p.set('role', role);
  const users = await api('GET', `/api/admin/users${p.toString() ? '?' + p : ''}`);
  if (!Array.isArray(users)) {
    body.innerHTML = `<div style="color:var(--red)">${escHtml(users.error || 'Błąd')}</div>`;
    return;
  }

  const filters = [
    { val: '',        lbl: 'Wszyscy' },
    { val: 'student', lbl: 'Uczniowie' },
    { val: 'teacher', lbl: 'Nauczyciele' },
    { val: 'admin',   lbl: 'Admini' },
  ];
  const filterBar = filters.map(f => `
    <button onclick="apLoadUsers(document.getElementById('apSearch')?.value||'','${f.val}')"
      style="padding:4px 12px;border-radius:20px;border:1px solid var(--border);background:${role===f.val?'var(--accent)':'var(--bg)'};color:${role===f.val?'#fff':'var(--text3)'};font-size:12px;cursor:pointer;font-family:var(--font-body)">
      ${f.lbl}
    </button>`).join('');

  const plural = users.length === 1 ? 'użytkownik' : 'użytkowników';
  body.innerHTML = `
    <input id="apSearch" class="ap-search" type="text" placeholder="🔍 Szukaj po nazwie…"
      value="${escHtml(q)}" oninput="apSearchDebounce(this.value)">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 4px">${filterBar}</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:2px">${users.length} ${plural}</div>
    ${users.map(u => `
      <div class="ap-user-row" id="ap-row-${u.id}">
        <div class="ap-user-name">${escHtml(u.name)}</div>
        <div class="ap-user-pts">${u.season_points} pkt</div>
        <select class="ap-role-sel" onchange="apChangeRole(${u.id}, this.value, this)"
          ${u.id === state.currentUser?.id ? 'disabled title="Nie możesz zmienić własnej roli"' : ''}>
          <option value="student" ${u.role === 'student' ? 'selected' : ''}>Uczeń</option>
          <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Nauczyciel</option>
          <option value="admin"   ${u.role === 'admin'   ? 'selected' : ''}>Admin</option>
        </select>
        <button class="btn btn-sm" onclick="apResetPassword(${u.id}, '${escHtml(u.name)}', this)"
          style="font-size:11px;padding:4px 9px;flex-shrink:0">🔑 Reset</button>
      </div>
    `).join('')}
  `;
}

function apSearchDebounce(val) {
  clearTimeout(_apSearchTimer);
  _apSearchTimer = setTimeout(() => apLoadUsers(val), 300);
}

async function apChangeRole(userId, role, selectEl) {
  const res = await api('PATCH', `/api/admin/users/${userId}/role`, { role });
  if (res.ok) {
    showToast(`Rola zmieniona na: ${role === 'student' ? 'Uczeń' : role === 'teacher' ? 'Nauczyciel' : 'Admin'}`, 'success');
  } else {
    showToast(res.error || 'Błąd', 'error');
    apLoadUsers(document.getElementById('apSearch')?.value || '');
  }
}

async function apResetPassword(userId, userName, btn) {
  btn.disabled = true;
  const res = await api('POST', `/api/admin/users/${userId}/reset-token`);
  btn.disabled = false;
  if (res.token) {
    const row = document.getElementById(`ap-row-${userId}`);
    // Usuń poprzedni token jeśli jest
    row.nextElementSibling?.classList.contains('ap-token') && row.nextElementSibling.remove();
    const tokenDiv = document.createElement('div');
    tokenDiv.className = 'ap-token';
    tokenDiv.textContent = res.token;
    row.insertAdjacentElement('afterend', tokenDiv);
    setTimeout(() => tokenDiv.remove(), 60000);
    showToast(`Kod dla ${userName}: ${res.token}`, 'success');
  } else {
    showToast(res.error || 'Błąd', 'error');
  }
}

async function apLoadStats() {
  const body = document.getElementById('apBody');
  body.innerHTML = '<div style="color:var(--text3)">Ładowanie…</div>';
  const s = await api('GET', '/api/admin/stats');
  if (s.error) { body.innerHTML = `<div style="color:var(--red)">${escHtml(s.error)}</div>`; return; }
  body.innerHTML = `
    <div class="ap-stat-cards">
      <div class="ap-stat-card"><div class="ap-n">${s.totalUsers}</div><div class="ap-lbl">Użytkownicy</div></div>
      <div class="ap-stat-card"><div class="ap-n">${s.totalTeachers}</div><div class="ap-lbl">Nauczyciele</div></div>
      <div class="ap-stat-card"><div class="ap-n">${s.totalAdmins}</div><div class="ap-lbl">Admini</div></div>
      <div class="ap-stat-card"><div class="ap-n">${s.totalSchools}</div><div class="ap-lbl">Szkoły</div></div>
      <div class="ap-stat-card"><div class="ap-n">${s.totalClasses}</div><div class="ap-lbl">Klasy</div></div>
    </div>
  `;
}

// ============================================================
// POINTS (lokalna kalkulacja do wyświetlania)
// ============================================================

function calcPoints(done) {
  if (done < 10) return 10;
  if (done < 20) return 5;
  return 1;
}

function getTopicProgress(topic) {
  return state.currentUser?.topics?.[topic] || { done: 0, points: 0 };
}

// ============================================================
// AUTH
// ============================================================

let isRegisterMode = false;

function switchToRegister() {
  isRegisterMode = true;
  document.getElementById('loginTitle').textContent = 'Utwórz konto!';
  document.getElementById('loginSub').innerHTML = 'Wybierz unikalną nazwę i hasło<br><span style="font-size:0.8em;opacity:0.7">⚠️ Nie używaj prawdziwego imienia ani danych osobowych</span>';
  document.getElementById('loginBtn').innerHTML = '<span>🌟</span> Zarejestruj się!';
  document.getElementById('loginSwitch').innerHTML = 'Masz już konto? <a onclick="switchToLogin()">Zaloguj się</a>';
  document.getElementById('loginDeco').textContent = '⭐';
}

function switchToLogin() {
  isRegisterMode = false;
  document.getElementById('loginTitle').textContent = 'Witaj w Pi-ratMath!';
  document.getElementById('loginSub').textContent = 'Zaloguj się, aby śledzić swoje postępy';
  document.getElementById('loginBtn').innerHTML = '<span>🎯</span> Wejdź do gry!';
  document.getElementById('loginSwitch').innerHTML = 'Nie masz konta? <a onclick="switchToRegister()">Zarejestruj się</a>';
  document.getElementById('loginDeco').textContent = '🐀';
  document.getElementById('resetForm').style.display  = 'none';
  document.getElementById('loginBtn').style.display   = '';
  document.getElementById('usernameInput').style.display = '';
  document.getElementById('passwordInput').style.display = '';
  document.getElementById('resetSwitch').style.display   = '';
  document.getElementById('loginError').textContent = '';
}

function switchToReset() {
  document.getElementById('resetForm').style.display   = 'block';
  document.getElementById('loginBtn').style.display    = 'none';
  document.getElementById('usernameInput').style.display = 'none';
  document.getElementById('passwordInput').style.display = 'none';
  document.getElementById('loginSwitch').style.display   = 'none';
  document.getElementById('resetSwitch').style.display   = 'none';
  document.getElementById('loginTitle').textContent = 'Reset hasła';
  document.getElementById('loginSub').textContent   = '';
  document.getElementById('loginDeco').textContent  = '🔑';
  document.getElementById('loginError').textContent = '';
}

async function submitReset() {
  const token       = document.getElementById('resetTokenInput').value.trim().toUpperCase();
  const newPassword = document.getElementById('resetPassInput').value;
  const err         = document.getElementById('loginError');
  err.textContent   = '';

  if (!token || !newPassword) { err.textContent = 'Wypełnij oba pola'; return; }

  const data = await api('POST', '/api/reset-password', { token, newPassword });
  if (data.error) { err.textContent = data.error; return; }

  err.style.color = 'var(--green)';
  err.textContent = '✓ Hasło zmienione! Możesz się zalogować.';
  document.getElementById('resetTokenInput').value = '';
  document.getElementById('resetPassInput').value  = '';
  setTimeout(() => { err.style.color = ''; switchToLogin(); }, 2000);
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const name = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const err = document.getElementById('loginError');
  err.textContent = '';

  const endpoint = isRegisterMode ? '/api/register' : '/api/login';
  const data = await api('POST', endpoint, { name, password });

  if (data.error) {
    err.textContent = data.error;
    return;
  }

  state.currentUser = data.user;
  state.dukaty = data.user.dukaty || 0;
  state.ownedAvatars = JSON.parse(data.user.owned_avatars || '[]');
  state.ownedTitles  = JSON.parse(data.user.owned_titles  || '[]');
  state.activeTitle  = data.user.active_title || '';
  loadAchievementsState(data.user);
  document.getElementById('loginModal').style.display = 'none';
  updateUserPanel();
  renderLeaderboards();
  handleDailyBonus(data.dailyBonus, data.dailyStreak);
  data.newAchs?.forEach(a => showAchievementToast(a));
  await loadClassTopics();
  updateServerIndicator();
  updateTeacherBtn();
  updateAdminBtn();
  showServerSelect();
});

// ============================================================
// INIT
// ============================================================

async function initApp() {
  generateStars();
  initSeasonTimer();
  showRandomFact();

  const savedTheme = localStorage.getItem('mq_theme') || 'space';
  applyTheme(savedTheme);
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
  document.querySelector(`.theme-dot.${savedTheme}`)?.classList.add('active');
  initSoundToggle();
  markWipTopics();

  // Sprawdź czy sesja aktywna
  const data = await api('GET', '/api/me');
  if (data.user) {
    state.currentUser = data.user;
    state.dukaty = data.user.dukaty || 0;
    state.ownedAvatars = JSON.parse(data.user.owned_avatars || '[]');
    state.ownedTitles  = JSON.parse(data.user.owned_titles  || '[]');
    state.activeTitle  = data.user.active_title || '';
    loadAchievementsState(data.user);
    document.getElementById('loginModal').style.display = 'none';
    updateUserPanel();
    handleDailyBonus(data.dailyBonus, data.dailyStreak);
    data.newAchs?.forEach(a => showAchievementToast(a));
    await loadClassTopics();
    updateServerIndicator();
    updateTeacherBtn();
    updateAdminBtn();
    // Przy odświeżeniu strony nie pokazujemy ponownie server select — pamiętamy wybór
  }

  renderLeaderboards();
}

// ============================================================
// STARS
// ============================================================

function generateStars() {
  const c = document.getElementById('starsContainer');
  c.innerHTML = '';
  const isPink = document.body.classList.contains('theme-pink');
  const symbols = ['💕','🌸','✨','🌷','💖','⭐','🌟','💫'];
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    if (isPink) {
      s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      const size = 10 + Math.random() * 8;
      s.style.cssText = `font-size:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${3+Math.random()*5}s;--op:${0.15+Math.random()*0.25};animation-delay:-${Math.random()*6}s;`;
    } else {
      const size = Math.random() * 2.5 + 0.5;
      s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;--op:${0.2+Math.random()*0.6};animation-delay:-${Math.random()*5}s;`;
    }
    c.appendChild(s);
  }
}

// ============================================================
// SEASON TIMER
// ============================================================

function initSeasonTimer() {
  const seasonEnd = new Date('2026-03-31T23:59:59').getTime();
  function update() {
    const diff = Math.max(0, seasonEnd - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('seasonTimer').textContent =
      `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  update();
  setInterval(update, 1000);
}

// ============================================================
// FACTS
// ============================================================

function showRandomFact() {
  document.getElementById('factText').textContent = FACTS[Math.floor(Math.random() * FACTS.length)];
}

// ============================================================
// SOUND TOGGLE
// ============================================================

function toggleSound() {
  state.muted = !state.muted;
  localStorage.setItem('mq_muted', state.muted ? '1' : '0');
  const btn = document.getElementById('soundToggle');
  btn.textContent = state.muted ? '🔇' : '🔊';
  btn.classList.toggle('muted', state.muted);
}

function initSoundToggle() {
  const btn = document.getElementById('soundToggle');
  if (state.muted) {
    btn.textContent = '🔇';
    btn.classList.add('muted');
  }
}

// THEME
// ============================================================

function setTheme(theme, el) {
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
  el.classList.add('active');
  applyTheme(theme);
  localStorage.setItem('mq_theme', theme);
  if (state.currentUser) {
    api('POST', '/api/event', { event: 'theme_change' }).then(r => r.newAchs?.forEach(showAchievementToast));
  }
}

function applyTheme(theme) {
  document.body.className = '';
  if (theme === 'pink') document.body.classList.add('theme-pink');
  if (theme === 'classic') document.body.classList.add('theme-classic');
  state.theme = theme;
  generateStars();
}

// ============================================================
// SIDEBAR
// ============================================================

function toggleLevel(idx, btn) {
  const list = document.getElementById(`topics-${idx}`);
  const isOpen = list.classList.contains('open');
  document.querySelectorAll('.topics-list').forEach(l => l.classList.remove('open'));
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('open', 'active'));
  if (!isOpen) {
    list.classList.add('open');
    btn.classList.add('open', 'active');
  }
}

function openAboutModal() {
  document.getElementById('aboutModalOverlay').style.display = 'flex';
}
function closeAboutModal(e) {
  if (e && e.target !== document.getElementById('aboutModalOverlay')) return;
  document.getElementById('aboutModalOverlay').style.display = 'none';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAboutModal();
});

let _ggbLoaded = false;
function _loadGeogebra(callback) {
  if (typeof GGBApplet !== 'undefined') { callback(); return; }
  if (_ggbLoaded) { /* script loading, queue */ document.addEventListener('ggbReady', callback, { once: true }); return; }
  _ggbLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://cdn.geogebra.org/apps/deployggb.js';
  s.onload = () => { document.dispatchEvent(new Event('ggbReady')); callback(); };
  document.head.appendChild(s);
}

function _buildSinusDesc(a, b, c, d) {
  function fmt(n) { return Math.round(n * 1000) / 1000; }
  const af = fmt(a), bf = fmt(b), cf = fmt(c), df = fmt(d);
  const lines = [];

  // Amplituda
  if (Math.abs(af - 1) < 0.01) {
    lines.push({ label: `a = ${af}`, text: 'Amplituda standardowa — brak rozciągnięcia pionowego' });
  } else if (af > 0) {
    lines.push({ label: `a = ${af}`, text: `Wykres <strong>${af > 1 ? 'rozciągnięty' : 'ściśnięty'} ${af}×</strong> w pionie` });
  } else {
    const abs = Math.abs(af);
    lines.push({ label: `a = ${af}`, text: `Wykres <strong>odbity</strong> względem OX${abs !== 1 ? `, amplituda ${abs}` : ''}` });
  }

  // Okres
  if (Math.abs(bf - 1) < 0.01) {
    lines.push({ label: `b = ${bf}`, text: 'Okres standardowy: 2π ≈ 6,28' });
  } else {
    const period = (2 * Math.PI / Math.abs(bf)).toFixed(2).replace('.', ',');
    lines.push({ label: `b = ${bf}`, text: `Wykres <strong>${bf > 1 ? 'ściśnięty' : 'rozciągnięty'} ${Math.abs(bf)}×</strong> poziomo — okres = 2π/${Math.abs(bf)} ≈ ${period}` });
  }

  // Przesunięcie fazowe: y = sin(bx + c) = sin(b(x + c/b)), shift = –c/b
  if (Math.abs(cf) < 0.01) {
    lines.push({ label: `c = ${cf}`, text: 'Brak przesunięcia fazowego' });
  } else {
    const shift = fmt(-cf / bf);
    const shiftAbs = Math.abs(shift);
    const dir = shift >= 0 ? 'prawo' : 'lewo';
    lines.push({ label: `c = ${cf}`, text: `Wykres przesunięty o <strong>${shiftAbs}</strong> w ${dir} (−c/b)` });
  }

  // Przesunięcie pionowe
  if (Math.abs(df) < 0.01) {
    lines.push({ label: `d = ${df}`, text: 'Brak przesunięcia pionowego' });
  } else {
    const dir = df > 0 ? 'górę' : 'dół';
    lines.push({ label: `d = ${df}`, text: `Wykres przesunięty o <strong>${Math.abs(df)}</strong> w ${dir}` });
  }

  return lines.map(l =>
    `<div class="ggb-desc-line"><em>${l.label}</em>${l.text}</div>`
  ).join('');
}

function _setupSinusListener(api) {
  let _timer;
  function update() {
    clearTimeout(_timer);
    _timer = setTimeout(() => {
      const el = document.getElementById('ggb-sinus-desc');
      if (!el) return;
      try {
        el.innerHTML = _buildSinusDesc(
          api.getValue('a'), api.getValue('b'),
          api.getValue('c'), api.getValue('d')
        );
      } catch(e) {}
    }, 60);
  }
  api.registerUpdateListener(update);
  update();
}

function _initGgbSinus() {
  const wrap = document.getElementById('ggb-sinus');
  if (!wrap) return;
  if (wrap.dataset.ggbInit) {
    // Applet już wstrzyknięty — wymuś przerysowanie po ponownym pokazaniu
    window.dispatchEvent(new Event('resize'));
    return;
  }
  wrap.dataset.ggbInit = '1';
  const applet = new GGBApplet({
    appName:             'graphing',
    width:               800,
    height:              500,
    showToolBar:         true,
    showAlgebraInput:    true,
    showMenuBar:         false,
    filename:            '/geogebra/przeksztalceniaSinus.ggb',
    enableRightClick:    false,
    scaleContainerClass: 'ggb-wrap',
  }, true);
  applet.inject('ggb-sinus');

  // GeoGebra rejestruje się jako window.ggbApplet — pollujemy aż będzie gotowy
  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    if (attempts > 40) { clearInterval(poll); return; }
    try {
      const api = window.ggbApplet;
      if (api && typeof api.getValue === 'function') {
        clearInterval(poll);
        _setupSinusListener(api);
        window.dispatchEvent(new Event('resize'));
      }
    } catch(e) {}
  }, 500);
}

const AID_TITLES = {
  sp_mnozenie:  'Tabliczka mnożenia — plansza',
  sp_ulamki:    'Ułamki — wizualizacja',
  sp_kolejnosc: 'Kolejność działań — schemat',
  ss_sinus:     'Przekształcenia wykresu funkcji sinus',
  ss_kwadrat:   'Funkcja kwadratowa — wykres',
  ss_trygono:   'Trygonometria — okrąg jednostkowy',
};

function selectAid(aidId, el) {
  document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('exerciseArea').classList.remove('visible');
  document.getElementById('aidsScreen').classList.add('visible');
  document.querySelectorAll('.aid-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('aid-' + aidId);
  if (panel) panel.style.display = '';
  const titleEl = document.getElementById('aidTitle');
  if (titleEl) titleEl.textContent = '📚 ' + (AID_TITLES[aidId] || 'Pomoce naukowe');
  if (aidId === 'ss_sinus') requestAnimationFrame(() => _loadGeogebra(_initGgbSinus));
}

function selectTopic(topic, el) {
  if (state.server === 'class' && state.classTopics !== null && CLASS_MANAGED_TOPICS.has(topic) && !state.classTopics.has(topic)) {
    showToast('Ten temat nie jest jeszcze odblokowany przez nauczyciela', 'info');
    return;
  }
  document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('aidsScreen').classList.remove('visible');
  el.classList.add('active');

  state.currentTopic = topic;
  state.currentDifficulty = 'easy';
  state.mistakes = 0;
  state.questionIndex = 0;

  document.querySelectorAll('.diff-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-easy').classList.add('active');

  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('exerciseArea').classList.add('visible');
  document.getElementById('topicTitle').textContent = topic;

  // Pokaż / ukryj planszę tabliczki mnożenia
  const multPanel = document.getElementById('multTablePanel');
  if (topic === 'Tabliczka mnożenia') {
    multPanel.style.display = 'block';
    buildMultTable();
  } else {
    multPanel.style.display = 'none';
  }

  hideChallengeSetup();
  showExerciseCard();
  loadQuestion();
  updateStatsRow();
}

// ============================================================
// MULTIPLICATION TABLE GRID
// ============================================================

function buildMultTable() {
  const grid = document.getElementById('multGrid');
  grid.innerHTML = '';

  // Corner
  const corner = document.createElement('div');
  corner.className = 'mg-cell mg-corner';
  corner.textContent = '×';
  grid.appendChild(corner);

  // Column headers
  for (let c = 1; c <= 10; c++) {
    const h = document.createElement('div');
    h.className = 'mg-cell mg-header' + (state.multActiveCols.has(c) ? '' : ' inactive');
    h.textContent = c;
    h.title = state.multActiveCols.has(c) ? `Wyłącz ${c} z kolumn` : `Włącz ${c} do kolumn`;
    h.onclick = () => toggleMultCol(c);
    grid.appendChild(h);
  }

  // Rows
  for (let r = 1; r <= 10; r++) {
    const rh = document.createElement('div');
    rh.className = 'mg-cell mg-header' + (state.multActiveRows.has(r) ? '' : ' inactive');
    rh.textContent = r;
    rh.title = state.multActiveRows.has(r) ? `Wyłącz ${r} z wierszy` : `Włącz ${r} do wierszy`;
    rh.onclick = () => toggleMultRow(r);
    grid.appendChild(rh);

    for (let c = 1; c <= 10; c++) {
      const cell = document.createElement('div');
      const rowOn = state.multActiveRows.has(r);
      const colOn = state.multActiveCols.has(c);
      cell.className = 'mg-cell mg-val' + (rowOn && colOn ? ' both-active' : ' inactive');
      cell.textContent = r * c;
      grid.appendChild(cell);
    }
  }

  const rc = state.multActiveRows.size, cc = state.multActiveCols.size;
  document.getElementById('multInfo').textContent =
    `Aktywne: ${rc} wierszy × ${cc} kolumn — ${rc * cc} kombinacji w ćwiczeniach`;
}

function toggleMultRow(r) {
  if (state.multActiveRows.has(r)) {
    if (state.multActiveRows.size > 1) state.multActiveRows.delete(r);
  } else {
    state.multActiveRows.add(r);
  }
  buildMultTable();
}

function toggleMultCol(c) {
  if (state.multActiveCols.has(c)) {
    if (state.multActiveCols.size > 1) state.multActiveCols.delete(c);
  } else {
    state.multActiveCols.add(c);
  }
  buildMultTable();
}

// ============================================================
// DIFFICULTY
// ============================================================

function setDifficulty(diff, el) {
  document.querySelectorAll('.diff-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  state.currentDifficulty = diff;
  state.mistakes = 0;

  if (diff === 'challenge') {
    stopChallenge();
    showChallengeSetup();
  } else {
    hideChallengeSetup();
    showExerciseCard();
    loadQuestion();
    document.getElementById('timerBarWrap').classList.remove('visible');
  }
}

function showChallengeSetup() {
  document.getElementById('challengeSetupCard').style.display = 'block';
  document.getElementById('exerciseCard').style.display = 'none';
  document.getElementById('timerBarWrap').classList.remove('visible');
}

function hideChallengeSetup() {
  document.getElementById('challengeSetupCard').style.display = 'none';
}

function showExerciseCard() {
  document.getElementById('exerciseCard').style.display = 'block';
}

function selectTime(t, el) {
  document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  state.challengeTime = t;
}

// ============================================================
// CHALLENGE MODE
// ============================================================

function startChallenge() {
  hideChallengeSetup();
  showExerciseCard();
  state.challengeActive = true;
  state.challengeTimeLeft = state.challengeTime;
  state.challengeCorrect = 0;
  state.mistakes = 0;

  document.getElementById('challengeScore').textContent = '0';
  document.getElementById('timerBarWrap').classList.add('visible');
  document.getElementById('challengeTimer').classList.remove('warning');

  loadQuestion();

  state.challengeInterval = setInterval(() => {
    state.challengeTimeLeft--;
    const timerEl = document.getElementById('challengeTimer');
    timerEl.textContent = state.challengeTimeLeft;
    const pct = (state.challengeTimeLeft / state.challengeTime) * 100;
    document.getElementById('timerFill').style.width = pct + '%';
    if (state.challengeTimeLeft <= 10) timerEl.classList.add('warning');
    if (state.challengeTimeLeft <= 0) endChallenge();
  }, 1000);
}

function stopChallenge() {
  if (state.challengeInterval) { clearInterval(state.challengeInterval); state.challengeInterval = null; }
  state.challengeActive = false;
}

function endChallenge() {
  stopChallenge();
  document.getElementById('timerBarWrap').classList.remove('visible');
  const correct = state.challengeCorrect;
  playSound('complete');
  showToast(`⏱️ Koniec! Odpowiedziałeś poprawnie na ${correct} zadań!`, correct > 0 ? 'correct' : 'wrong');
  setTimeout(() => {
    showChallengeSetup();
    document.getElementById('exerciseCard').style.display = 'none';
  }, 3000);
}

// ============================================================
// QUESTION GENERATION
// ============================================================

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function primeFactorsOf(n) {
  const factors = [];
  for (let d = 2; d * d <= n; d++) {
    while (n % d === 0) { factors.push(d); n = Math.floor(n / d); }
  }
  if (n > 1) factors.push(n);
  return factors;
}

function gcdOf(a, b) {
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

function lcmOf(a, b) {
  return (a / gcdOf(a, b)) * b;
}

function evalSymbolicExpr(str) {
  let s = str.trim()
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/sqrt\s*\(\s*(\d+(?:\.\d+)?)\s*\)/gi, 'Math.sqrt($1)')
    .replace(/sqrt\s*(\d+(?:\.\d+)?)/gi, 'Math.sqrt($1)')
    .replace(/√(\d+(?:\.\d+)?)/g, 'Math.sqrt($1)')
    .replace(/π|pi\b/gi, String(Math.PI))
    .replace(/[×·]/g, '*')
    .replace(/[−–—]/g, '-');
  try {
    const result = new Function('return (' + s + ')')();
    return typeof result === 'number' ? result : NaN;
  } catch { return NaN; }
}

function absInsert(sym) {
  const input = document.getElementById('absInput');
  if (!input) return;
  const pos = input.selectionStart ?? input.value.length;
  input.value = input.value.slice(0, pos) + sym + input.value.slice(pos);
  input.selectionStart = input.selectionEnd = pos + sym.length;
  input.focus();
}

function commonFactors(f1, f2) {
  const count = {};
  f1.forEach(f => count[f] = (count[f] || 0) + 1);
  const common = [];
  f2.forEach(f => { if (count[f] > 0) { common.push(f); count[f]--; } });
  return common.sort((a, b) => a - b);
}

function nearRoundHint(op, n) {
  for (let r = 10; r <= 500; r += (r < 100 ? 10 : 100)) {
    if (n === r - 1) {
      if (op === '+') return `Zauważ, że ${n} to o 1 mniej niż ${r} — dodaj ${r} i odejmij 1`;
      if (op === '-') return `Zauważ, że ${n} to o 1 mniej niż ${r} — odejmij ${r} i dodaj 1`;
    }
    if (n === r - 2) {
      if (op === '+') return `Zauważ, że ${n} to o 2 mniej niż ${r} — dodaj ${r} i odejmij 2`;
      if (op === '-') return `Zauważ, że ${n} to o 2 mniej niż ${r} — odejmij ${r} i dodaj 2`;
    }
    if (n === r + 1) {
      if (op === '+') return `Zauważ, że ${n} to o 1 więcej niż ${r} — dodaj ${r} i dodaj jeszcze 1`;
      if (op === '-') return `Zauważ, że ${n} to o 1 więcej niż ${r} — odejmij ${r} i odejmij jeszcze 1`;
    }
    if (n === r + 2) {
      if (op === '+') return `Zauważ, że ${n} to o 2 więcej niż ${r} — dodaj ${r} i dodaj jeszcze 2`;
      if (op === '-') return `Zauważ, że ${n} to o 2 więcej niż ${r} — odejmij ${r} i odejmij jeszcze 2`;
    }
  }
  return null;
}

// ============================================================
// ŚWIAT LICZB – helpers (konwersja liczba ↔ słowa po polsku)
// ============================================================

function polishNumber(n) {
  if (n === 0) return 'zero';
  const ones  = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
  const teens = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście',
                 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
  const tArr  = ['', 'dziesięć', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt',
                 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
  const hArr  = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset',
                 'siedemset', 'osiemset', 'dziewięćset'];
  function below1000(x) {
    if (x === 0) return '';
    const parts = [];
    const h = Math.floor(x / 100), rem = x % 100;
    if (h) parts.push(hArr[h]);
    if (rem >= 10 && rem < 20) { parts.push(teens[rem - 10]); }
    else { const t = Math.floor(rem / 10), o = rem % 10; if (t) parts.push(tArr[t]); if (o) parts.push(ones[o]); }
    return parts.join(' ');
  }
  function thuForm(x) {
    if (x === 1) return 'tysiąc';
    const lt = x % 100, lo = x % 10;
    if (lt >= 12 && lt <= 14) return 'tysięcy';
    if (lo >= 2 && lo <= 4) return 'tysiące';
    return 'tysięcy';
  }
  function milForm(x) {
    if (x === 1) return 'milion';
    const lt = x % 100, lo = x % 10;
    if (lt >= 12 && lt <= 14) return 'milionów';
    if (lo >= 2 && lo <= 4) return 'miliony';
    return 'milionów';
  }
  const parts = [];
  const mil  = Math.floor(n / 1_000_000);
  const thou = Math.floor((n % 1_000_000) / 1000);
  const rem  = n % 1000;
  if (mil)  parts.push(mil  === 1 ? 'milion'  : below1000(mil)  + ' ' + milForm(mil));
  if (thou) parts.push(thou === 1 ? 'tysiąc'  : below1000(thou) + ' ' + thuForm(thou));
  if (rem)  parts.push(below1000(rem));
  return parts.join(' ') || 'zero';
}

function fmtNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

// ── Zadania tekstowe: zapisywanie ułamka ─────────────────────
function genFractionWordProblem(d) {
  const maxN = d === 'easy' ? 6 : 12;

  const type = rand(0, 6);

  if (type === 0) {
    // K z N przedmiotów
    const n = rand(3, maxN), k = rand(1, n - 1);
    const tmpl = [
      `Było ${n} balonów, a ${k} z nich pękło. Jaki ułamek balonów pękło?`,
      `W klasie jest ${n} uczniów, z czego ${k} nosi okulary. Jaki ułamek uczniów nosi okulary?`,
      `W koszyczku leży ${n} owoców, a ${k} to jabłka. Jaki ułamek owoców stanowią jabłka?`,
      `Ciasto podzielono na ${n} równych kawałków i zjedzono ${k}. Jaki ułamek ciasta zjedzono?`,
      `Na półce stoi ${n} książek. ${k} z nich to powieści. Jaki ułamek książek to powieści?`,
      `W słoiku jest ${n} cukierków, a ${k} to czekoladki. Jaki ułamek stanowią czekoladki?`,
      `Droga ma ${n} km. Przejechano ${k} km. Jaki ułamek drogi pokonano?`,
      `Na parkingu stoi ${n} samochodów, ${k} z nich to rowery elektryczne. Jaki ułamek stanowią rowery?`,
      `W ogrodzie jest ${n} drzew, a ${k} to jabłonie. Jaki ułamek drzew stanowią jabłonie?`,
    ];
    return { type: 'fraction_read', k, n, text: tmpl[rand(0, tmpl.length - 1)] };
  }

  if (type === 1) {
    // Ile pozostało (N - K)
    const n = rand(3, maxN), k = rand(1, n - 1);
    const left = n - k;
    const tmpl = [
      `Tata kupił ${n} bułek. ${k} już zjedzono. Jaki ułamek bułek pozostał?`,
      `W paczce było ${n} herbatników. Zjedliśmy ${k}. Jaki ułamek herbatników pozostało?`,
      `Na talerzu leżało ${n} ciasteczek. Wzięto ${k}. Jaki ułamek ciasteczek został na talerzu?`,
    ];
    return { type: 'fraction_read', k: left, n, text: tmpl[rand(0, tmpl.length - 1)] };
  }

  // type 2–6 → algebraiczne opisy ułamka
  return genFractionAlgebraic(d, maxN);
}

function genFractionAlgebraic(d, maxN) {
  const variant = rand(0, 11);

  if (variant === 0) {
    // mianownik = licznik + diff
    const k = rand(1, maxN - 2), diff = rand(1, Math.min(maxN - k, 8));
    const n = k + diff;
    return { type: 'fraction_read', k, n,
      text: `Licznik ułamka wynosi ${k}, a mianownik jest o ${diff} większy od licznika. Jaki to ułamek?`,
      hint: `Mianownik = ${k} + ${diff} = ${n}` };
  }

  if (variant === 1) {
    // licznik = mianownik - diff
    const n = rand(3, maxN), diff = rand(1, n - 1), k = n - diff;
    return { type: 'fraction_read', k, n,
      text: `Mianownik ułamka wynosi ${n}, a licznik jest o ${diff} mniejszy od mianownika. Jaki to ułamek?`,
      hint: `Licznik = ${n} − ${diff} = ${k}` };
  }

  if (variant === 2) {
    // mianownik = times × licznik
    const k = rand(1, Math.floor(maxN / 2)), times = rand(2, 4), n = k * times;
    return { type: 'fraction_read', k, n,
      text: `Licznik ułamka wynosi ${k}. Mianownik jest ${times} razy większy od licznika. Jaki to ułamek?`,
      hint: `Mianownik = ${k} × ${times} = ${n}` };
  }

  if (variant === 3) {
    // licznik = mianownik / times
    const times = rand(2, 4), k = rand(1, Math.floor(maxN / times)), n = k * times;
    return { type: 'fraction_read', k, n,
      text: `Mianownik ułamka wynosi ${n}. Licznik jest ${times} razy mniejszy od mianownika. Jaki to ułamek?`,
      hint: `Licznik = ${n} ÷ ${times} = ${k}` };
  }

  if (variant === 4) {
    // suma licznika i mianownika = S, licznik = k
    const k = rand(1, maxN - 2), n = rand(k + 1, maxN), S = k + n;
    return { type: 'fraction_read', k, n,
      text: `Suma licznika i mianownika pewnego ułamka wynosi ${S}. Licznik wynosi ${k}. Jaki to ułamek?`,
      hint: `Mianownik = ${S} − ${k} = ${n}` };
  }

  if (variant === 5) {
    // suma licznika i mianownika = S, mianownik = n
    const n = rand(3, maxN), k = rand(1, n - 1), S = k + n;
    return { type: 'fraction_read', k, n,
      text: `Suma licznika i mianownika pewnego ułamka wynosi ${S}. Mianownik wynosi ${n}. Jaki to ułamek?`,
      hint: `Licznik = ${S} − ${n} = ${k}` };
  }

  if (variant === 6) {
    // mianownik - licznik = diff, mianownik podany
    const n = rand(3, maxN), diff = rand(1, n - 1), k = n - diff;
    return { type: 'fraction_read', k, n,
      text: `Mianownik pewnego ułamka wynosi ${n}. Różnica mianownika i licznika wynosi ${diff}. Jaki to ułamek?`,
      hint: `Licznik = ${n} − ${diff} = ${k}` };
  }

  if (variant === 7) {
    // mianownik - licznik = diff, licznik podany
    const k = rand(1, maxN - 2), diff = rand(1, maxN - k), n = k + diff;
    return { type: 'fraction_read', k, n,
      text: `Licznik pewnego ułamka wynosi ${k}. Różnica mianownika i licznika wynosi ${diff}. Jaki to ułamek?`,
      hint: `Mianownik = ${k} + ${diff} = ${n}` };
  }

  if (variant === 8) {
    // mianownik = 2×licznik + extra
    const k = rand(1, Math.floor((maxN - 1) / 2)), extra = rand(1, maxN - 2 * k), n = 2 * k + extra;
    return { type: 'fraction_read', k, n,
      text: `Mianownik ułamka jest o ${extra} więcej niż dwa razy jego licznik, który wynosi ${k}. Jaki to ułamek?`,
      hint: `Mianownik = 2 × ${k} + ${extra} = ${n}` };
  }

  if (variant === 9) {
    // licznik i mianownik tworzą "odwróconą" parę — suma znana, różnica znana
    // k + n = S, n - k = D  →  k = (S-D)/2, n = (S+D)/2  (oboje parzyste lub nieparzyste)
    const k = rand(1, Math.floor(maxN / 2) - 1), n = rand(k + 2, maxN);
    if ((k + n) % 2 !== (n - k) % 2) {
      // fallback — wróć do wariantu 0
      const k2 = rand(1, maxN - 2), diff2 = rand(1, Math.min(maxN - k2, 6)), n2 = k2 + diff2;
      return { type: 'fraction_read', k: k2, n: n2,
        text: `Licznik ułamka wynosi ${k2}, a mianownik jest o ${diff2} większy. Jaki to ułamek?`,
        hint: `Mianownik = ${k2} + ${diff2} = ${n2}` };
    }
    const S = k + n, D = n - k;
    return { type: 'fraction_read', k, n,
      text: `Suma licznika i mianownika ułamka wynosi ${S}, a ich różnica (mianownik minus licznik) wynosi ${D}. Jaki to ułamek?`,
      hint: `Licznik = (${S} − ${D}) ÷ 2 = ${k},  mianownik = (${S} + ${D}) ÷ 2 = ${n}` };
  }

  if (variant === 10) {
    // realia — konkrety z życia
    const tmpl = d === 'easy' ? [
      { text: 'Tydzień ma 7 dni. Jaki ułamek tygodnia stanowią 2 dni?', k: 2, n: 7 },
      { text: 'Tydzień ma 7 dni. Jaki ułamek tygodnia stanowią 3 dni?', k: 3, n: 7 },
      { text: 'Rok ma 4 pory roku. Jaki ułamek roku stanowi 1 pora roku?', k: 1, n: 4 },
      { text: 'Doba ma 24 godziny. Jaki ułamek doby stanowią 6 godzin?', k: 6, n: 24, hint: 'Mianownik = 24 (godziny w dobie)' },
      { text: 'Doba ma 24 godziny. Jaki ułamek doby stanowią 8 godzin?', k: 8, n: 24, hint: 'Mianownik = 24 (godziny w dobie)' },
    ] : [
      { text: 'Rok ma 12 miesięcy. Jaki ułamek roku stanowią 3 miesiące letnie (czerwiec, lipiec, sierpień)?', k: 3, n: 12 },
      { text: 'Rok ma 12 miesięcy. Jaki ułamek roku stanowią miesiące zimowe (grudzień, styczeń, luty)?', k: 3, n: 12 },
      { text: 'Rok ma 12 miesięcy. Jaki ułamek roku stanowią 4 miesiące?', k: 4, n: 12 },
      { text: 'Godzina ma 60 minut. Jaki ułamek godziny stanowi kwadrans (15 minut)?', k: 15, n: 60, hint: 'Kwadrans = 15 minut' },
      { text: 'Godzina ma 60 minut. Jaki ułamek godziny stanowi pół godziny?', k: 30, n: 60 },
      { text: 'Tydzień ma 7 dni. Jaki ułamek tygodnia stanowią dni weekendowe (sobota i niedziela)?', k: 2, n: 7 },
      { text: 'Tydzień ma 7 dni. Jaki ułamek tygodnia stanowią dni robocze (poniedziałek–piątek)?', k: 5, n: 7 },
      { text: 'Minuta ma 60 sekund. Jaki ułamek minuty stanowi 20 sekund?', k: 20, n: 60, hint: 'Mianownik = 60 (sekundy w minucie)' },
    ];
    return { type: 'fraction_read', ...tmpl[rand(0, tmpl.length - 1)] };
  }

  // variant === 11: mianownik jest iloczynem dwóch podanych liczb
  {
    const a = rand(2, 4), b = rand(2, 4), n = a * b;
    if (n > maxN) {
      // fallback
      const k2 = rand(1, maxN - 1), n2 = maxN;
      return { type: 'fraction_read', k: k2, n: n2,
        text: `Mianownik ułamka wynosi ${n2}, a licznik jest równy ${k2}. Jaki to ułamek?` };
    }
    const k = rand(1, n - 1);
    return { type: 'fraction_read', k, n,
      text: `Mianownik ułamka jest iloczynem liczb ${a} i ${b}. Licznik wynosi ${k}. Jaki to ułamek?`,
      hint: `Mianownik = ${a} × ${b} = ${n}` };
  }
}

// ── Skracanie i rozszerzanie ułamków — helpery ────────────────────────────
function qFrac(a, b) {
  return `<span class="qf"><span class="qf-t">${a}</span><span class="qf-b">${b}</span></span>`;
}
function qBlank() { return `<span class="qf-blank">?</span>`; }

function genFractionOpByK(d) {
  const pool = d === 'easy' ? [2,3,4,5,6] : [2,3,4,5,6,7,8,9,10,12];
  const maxK = d === 'easy' ? 5 : 12;
  const k = rand(2, maxK);
  const b = pool[rand(0, pool.length - 1)];
  const a = rand(1, b - 1);
  if (Math.random() < 0.5) {
    return { type: 'fraction_op', a, b, k, op: 'extend', ans_a: a * k, ans_b: b * k,
      hint: `Rozszerzamy przez ${k}: ${a}×${k}=${a*k}, ${b}×${k}=${b*k}` };
  } else {
    return { type: 'fraction_op', a: a * k, b: b * k, k, op: 'reduce', ans_a: a, ans_b: b,
      hint: `Skracamy przez ${k}: ${a*k}÷${k}=${a}, ${b*k}÷${k}=${b}` };
  }
}

function genFractionFillNum(d) {
  const pool = d === 'easy' ? [2,3,4,5,6] : [2,3,4,5,6,7,8,9,10,12,15];
  const maxK = d === 'easy' ? 5 : 12;
  const k = rand(2, maxK), b = pool[rand(0, pool.length - 1)], a = rand(1, b - 1);
  if (Math.random() < 0.6) {
    return { q_html: `${qFrac(a,b)} = ${qFrac(qBlank(), b*k)}`, a: a * k,
      hint: `Mianownik ×${k} (${b}×${k}=${b*k}), więc licznik też ×${k}: ${a}×${k}=${a*k}` };
  } else {
    return { q_html: `${qFrac(a*k, b*k)} = ${qFrac(qBlank(), b)}`, a,
      hint: `Mianownik ÷${k} (${b*k}÷${k}=${b}), więc licznik też ÷${k}: ${a*k}÷${k}=${a}` };
  }
}

function genFractionFillDen(d) {
  const pool = d === 'easy' ? [2,3,4,5,6] : [2,3,4,5,6,7,8,9,10,12,15];
  const maxK = d === 'easy' ? 5 : 12;
  const k = rand(2, maxK), b = pool[rand(0, pool.length - 1)], a = rand(1, b - 1);
  if (Math.random() < 0.6) {
    return { q_html: `${qFrac(a,b)} = ${qFrac(a*k, qBlank())}`, a: b * k,
      hint: `Licznik ×${k} (${a}×${k}=${a*k}), więc mianownik też ×${k}: ${b}×${k}=${b*k}` };
  } else {
    return { q_html: `${qFrac(a*k, b*k)} = ${qFrac(a, qBlank())}`, a: b,
      hint: `Licznik ÷${k} (${a*k}÷${k}=${a}), więc mianownik też ÷${k}: ${b*k}÷${k}=${b}` };
  }
}

function genFractionChain(d) {
  const pool = d === 'easy' ? [2,3,4,5] : [2,3,4,5,6,7,8];
  const b = pool[rand(0, pool.length - 1)], a = rand(1, b - 1);
  const numSteps = rand(3, 4), usedKs = new Set(), ks = [];
  while (ks.length < numSteps) { const k = rand(2, d === 'easy' ? 6 : 15); if (!usedKs.has(k)) { ks.push(k); usedKs.add(k); } }
  ks.sort((x, y) => x - y);
  const blankIdx = rand(0, numSteps - 1), blankK = ks[blankIdx];
  const numBlank = Math.random() < 0.5;
  const parts = ks.map((k, i) => i === blankIdx
    ? (numBlank ? qFrac(qBlank(), b*k) : qFrac(a*k, qBlank()))
    : qFrac(a*k, b*k));
  const hint = numBlank
    ? `Mianownik to ${b}×${blankK}=${b*blankK}, więc licznik = ${a}×${blankK}=${a*blankK}`
    : `Licznik to ${a}×${blankK}=${a*blankK}, więc mianownik = ${b}×${blankK}=${b*blankK}`;
  return { q_html: `${qFrac(a,b)} = ${parts.join(' = ')}`, a: numBlank ? a*blankK : b*blankK, hint };
}

function genFractionEqCheck(d) {
  const pool = d === 'easy' ? [2,3,4,5,6] : [2,3,4,5,6,7,8,9,10,12,15];
  const b = pool[rand(0, pool.length - 1)], a = rand(1, b - 1);
  if (Math.random() < 0.5) {
    const k = rand(2, d === 'easy' ? 5 : 10);
    return { type: 'fraction_eq_check', a1: a, b1: b, a2: a*k, b2: b*k, ans: '=',
      hint: `${a}×${k}=${a*k}, ${b}×${k}=${b*k} — ten sam ułamek, tylko rozszerzony` };
  } else {
    // Pułapka: zmieniony jeden składnik przy rozszerzaniu
    const k = rand(2, d === 'easy' ? 5 : 10), delta = rand(1, 2);
    const a2 = a * k + delta;
    return { type: 'fraction_eq_check', a1: a, b1: b, a2, b2: b*k, ans: '≠',
      hint: `Sprawdź: ${a}×${k}=${a*k}, a nie ${a2} — licznik jest o ${delta} za duży` };
  }
}

const TOPIC_GENERATORS = {
  'Dodawanie i odejmowanie': (d) => {
    const max = d === 'easy' ? 20 : d === 'medium' ? 100 : 1000;
    const a = rand(1, max), b = rand(1, max);
    const sub = Math.random() > 0.5 && a >= b;
    if (sub) return { q: `${a} − ${b} = ?`, a: a - b };
    return { q: `${a} + ${b} = ?`, a: a + b };
  },
  'Mnożenie i dzielenie': (d) => {
    const max = d === 'easy' ? 10 : d === 'medium' ? 25 : 99;
    const a = rand(2, max), b = rand(2, 10);
    const div = Math.random() > 0.5;
    if (div) return { q: `${a*b} ÷ ${b} = ?`, a: a };
    return { q: `${a} × ${b} = ?`, a: a * b };
  },
  'Tabliczka mnożenia': (d) => {
    const rows = [...state.multActiveRows];
    const cols = [...state.multActiveCols];
    if (rows.length === 0 || cols.length === 0) return { q: '? × ? = ?', a: 0 };
    const a = rows[rand(0, rows.length - 1)];
    const b = cols[rand(0, cols.length - 1)];
    const showDiv = d !== 'easy' && Math.random() > 0.5;
    if (showDiv) return { q: `${a * b} ÷ ${b} = ?`, a: a };
    return { q: `${a} × ${b} = ?`, a: a * b };
  },
  'Zapisywanie ułamka zwykłego': (d) => {
    // 55% szans na rysunek, 45% na zadanie tekstowe
    if (Math.random() < 0.55) {
      const denoms = d === 'easy' ? [2, 3, 4] : [2, 3, 4, 5, 6, 8, 10];
      const n = denoms[Math.floor(Math.random() * denoms.length)];
      const k = rand(1, n - 1);
      const shape = Math.random() < 0.5 ? 'circle' : 'rect';
      return { type: 'fraction_read', k, n, shape };
    }
    return genFractionWordProblem(d);
  },
  'Porównywanie ułamków': (d) => {
    const r = Math.random();
    const easy = d === 'easy';
    if (easy ? r < 0.5 : r < 0.1) {
      // Ten sam mianownik (easy: 50%, medium: 10%)
      const denoms = easy ? [2,3,4,5,6,8] : [4,5,6,7,8,9,10,12,15,20,25,30];
      const n = denoms[rand(0, denoms.length - 1)];
      let a = rand(1, n - 1), b = rand(1, n - 1);
      while (a === b) b = rand(1, n - 1);
      const ans = a < b ? '<' : '>';
      return { type: 'fraction_compare', a1: a, b1: n, a2: b, b2: n, ans,
        hint: `Mianowniki równe — porównaj liczniki: większy licznik = większy ułamek` };
    } else if (easy ? r < 1 : r < 0.3) {
      // Ułamki jednostkowe (easy: 50%, medium: 20%)
      const pool = easy ? [2,3,4,5,6,8] : [2,3,4,5,6,7,8,9,10,12,15,20,25,30];
      let a = pool[rand(0, pool.length - 1)], b = pool[rand(0, pool.length - 1)];
      while (a === b) b = pool[rand(0, pool.length - 1)];
      const ans = a < b ? '>' : '<';
      return { type: 'fraction_compare', a1: 1, b1: a, a2: 1, b2: b, ans,
        hint: `Im większy mianownik, tym mniejsza część — np. 1/10 to mniejszy kawałek niż 1/3` };
    } else if (r < 0.55) {
      // Ten sam licznik: a/b vs a/c (medium: 25%)
      const pool = [3,4,5,6,7,8,9,10,12,15,18,20,24,30];
      let b = pool[rand(0, pool.length - 1)], c = pool[rand(0, pool.length - 1)];
      while (b === c) c = pool[rand(0, pool.length - 1)];
      const a = rand(2, Math.min(b, c) - 1);
      const ans = b < c ? '>' : '<';
      return { type: 'fraction_compare', a1: a, b1: b, a2: a, b2: c, ans,
        hint: `Liczniki równe (${a}) — im większy mianownik, tym mniejszy ułamek` };
    } else if (r < 0.8) {
      // Ułamki (n-1)/n — blisko 1 (medium: 25%)
      // większy mianownik = bliżej 1 = większy ułamek: 14/15 > 11/12
      const pool = [3,4,5,6,7,8,9,10,11,12,15,19,20,24,29,30];
      let b = pool[rand(0, pool.length - 1)], c = pool[rand(0, pool.length - 1)];
      while (b === c) c = pool[rand(0, pool.length - 1)];
      const ans = b > c ? '>' : '<';
      return { type: 'fraction_compare', a1: b - 1, b1: b, a2: c - 1, b2: c, ans,
        hint: `Sprawdź ile brakuje każdemu do 1: brakuje 1/${b} i 1/${c} — mniejsza różnica = bliżej 1 = większy ułamek` };
    } else if (r < 0.9) {
      // Liczby mieszane z tym samym mianownikiem (w1 === w2 → trzeba porównać ułamki)
      const n = rand(3, 20);
      const w = rand(1, 6);
      let n1 = rand(1, n - 1), n2 = rand(1, n - 1);
      while (n1 === n2) n2 = rand(1, n - 1);
      const ans = n1 < n2 ? '<' : '>';
      return { type: 'fraction_compare', whole1: w, a1: n1, b1: n, whole2: w, a2: n2, b2: n, ans,
        hint: `Części całkowite równe (${w}), porównaj ułamki: ${n1}/${n} ${ans} ${n2}/${n}` };
    } else {
      // Pułapka: liczba mieszana z niewłaściwą częścią ułamkową
      // np. 1 5/3 vs 2 1/3 — trzeba przeliczyć: 1+5/3 = 2+2/3 > 2+1/3
      const n = rand(3, 6);
      const w1 = rand(1, 3);
      const w2 = w1 + 1; // w2 = w1+1, żeby "wyglądało" jakby w2 było większe
      // ułamkowa część lewej strony: niewłaściwy (n+1..2n-1)/n
      const n1 = rand(n + 1, 2 * n - 1);
      // ułamkowa część prawej: właściwy (1..n-1)/n
      const n2 = rand(1, n - 1);
      const v1 = w1 + n1 / n, v2 = w2 + n2 / n;
      const ans = v1 < v2 ? '<' : '>';
      // wyłącz całości z lewej dla hintu
      const extraW = Math.floor(n1 / n), remainder = n1 % n;
      const realW1 = w1 + extraW;
      const hint = `Uwaga — ${n1}/${n} to ułamek niewłaściwy! ${w1} ${n1}/${n} = ${realW1}${remainder ? ` ${remainder}/${n}` : ''}, porównaj z ${w2} ${n2}/${n}`;
      return { type: 'fraction_compare', whole1: w1, a1: n1, b1: n, whole2: w2, a2: n2, b2: n, ans, hint };
    }
  },
  'Skracanie i rozszerzanie ułamków': (d) => {
    const r = Math.random();
    if (r < 0.20) return genFractionOpByK(d);
    if (r < 0.45) return genFractionFillNum(d);
    if (r < 0.70) return genFractionFillDen(d);
    if (r < 0.87) return genFractionChain(d);
    return genFractionEqCheck(d);
  },
  'Ułamki zwykłe': (d) => {
    const denom = rand(2, d === 'easy' ? 6 : 12);
    const n1 = rand(1, denom - 1), n2 = rand(1, denom - 1);
    return { q: `${n1}/${denom} + ${n2}/${denom} = ?/${denom}`, a: n1 + n2 };
  },
  'Procenty': (d) => {
    const percs = [10, 20, 25, 50];
    const p = percs[rand(0, percs.length - 1)];
    const val = rand(d === 'easy' ? 10 : 100, d === 'easy' ? 100 : 1000);
    const rounded = Math.round(val / (100/p)) * (100/p);
    return { q: `${p}% z ${rounded} = ?`, a: (p / 100) * rounded };
  },
  'Równania liniowe': (d) => {
    const b = rand(1, 20), c = rand(1, 50), x = rand(1, 15);
    return { q: `${b}x + ${c} = ${b * x + c}`, a: x };
  },
  'Potęgi i pierwiastki': (d) => {
    const base = rand(2, d === 'easy' ? 5 : 12);
    if (Math.random() > 0.4) {
      const sq = rand(2, d === 'easy' ? 10 : 15);
      return { q: `√${sq*sq} = ?`, a: sq };
    }
    return { q: `${base}² = ?`, a: base * base };
  },
  'Funkcje kwadratowe': (d) => {
    const a2 = rand(1, 3), b2 = rand(-5, 5), c2 = rand(-10, 10), x = rand(-5, 5);
    const val = a2 * x * x + b2 * x + c2;
    return { q: `f(x) = ${a2}x² ${b2>=0?'+':''}${b2}x ${c2>=0?'+':''}${c2}, f(${x}) = ?`, a: val };
  },

  // ── DODAWANIE PISEMNE ────────────────────────────────────────
  'Dodawanie pisemne': (d) => {
    if (d === 'easy') {
      let numbers, answer, carries, attempts = 0;
      do {
        const digits = rand(2, 4);
        answer = rand(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
        const a = rand(Math.floor(answer * 0.25), Math.floor(answer * 0.75));
        numbers = [a, answer - a];
        carries = computeCarries(numbers);
        attempts++;
      } while (carries.filter(c => c > 0).length > 1 && attempts < 80);
      return { type: 'written-addition', numbers, answer, carries };
    } else {
      const count = d === 'medium' ? rand(2, 4) : rand(3, 5);
      const maxVal = d === 'medium' ? 999 : 9999;
      const numbers = Array.from({ length: count }, () => rand(10, maxVal));
      const answer = numbers.reduce((s, n) => s + n, 0);
      const carries = computeCarries(numbers);
      return { type: 'written-addition', numbers, answer, carries };
    }
  },

  // ── ODEJMOWANIE PISEMNE ──────────────────────────────────────
  'Odejmowanie pisemne': (d) => {
    let a, b, borrows, attempts = 0;
    do {
      const digits = rand(2, 4);
      a = rand(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
      b = rand(1, a - 1);
      borrows = computeBorrows(a, b);
      attempts++;
    } while (d === 'easy' && borrows.some(bw => bw > 0) && attempts < 100);
    return { type: 'written-subtraction', numbers: [a, b], answer: a - b, borrows };
  },

  // ── DZIELENIE PISEMNE ────────────────────────────────────────
  'Dzielenie pisemne': (d) => {
    const divisor = d === 'challenge' ? rand(11, 19)
                  : d === 'medium'   ? rand(2, 99)
                  :                    rand(2, 9);
    const qMin = d === 'easy' ? 100 : (d === 'medium' ? 1000 : 12);
    // qMax dobrany tak, żeby dzielna nie przekraczała zadanej liczby cyfr
    const qMax = d === 'easy'   ? Math.floor(999999 / divisor)    // dzielna ≤ 6 cyfr
               : d === 'medium' ? Math.floor(99999999 / divisor)  // dzielna ≤ 8 cyfr
               : 99;
    let quotient, dividend, steps;
    let attempts = 0;
    do {
      quotient = rand(qMin, qMax);
      dividend = quotient * divisor;
      steps = computeDivisionSteps(dividend, divisor);
      attempts++;
    } while (steps.length !== String(quotient).length && attempts < 80);
    return {
      type: 'written-division',
      numbers: [dividend, divisor],
      answer: quotient,
      steps
    };
  },

  // ── DZIELENIE Z RESZTĄ ───────────────────────────────────────
  'Dzielenie z resztą': (d) => {
    const isEasy = d === 'easy';
    const bMax  = isEasy ? 9  : d === 'medium' ? 20  : 50;
    const qMax  = isEasy ? 9  : d === 'medium' ? 20  : 40;
    const b     = rand(2, bMax);
    const quot  = rand(1, qMax);
    // Reszta prawie zawsze > 0 (czyste dzielenie mniej pouczające)
    const rem   = Math.random() < 0.85 ? rand(1, b - 1) : 0;
    const a     = b * quot + rem;

    // Na łatwym — zawsze pełny format (obie luki); na wyższych — czasem proste pytanie
    if (!isEasy && Math.random() < 0.4) {
      const v = rand(0, 2);
      if (v === 0) {
        return {
          q:    `Jaka jest reszta z dzielenia ${a} przez ${b}?`,
          a:    rem,
          hint: `${a} = ${quot} × ${b} + ?`,
        };
      } else if (v === 1) {
        return {
          q:    `Ile razy ${b} mieści się w ${a}?`,
          a:    quot,
          hint: `${quot} × ${b} = ${b * quot}, a ${(quot + 1) * b} > ${a}`,
        };
      } else {
        return {
          q:    `Jaka liczba podzielona przez ${b} daje iloraz ${quot} i resztę ${rem}?`,
          a,
          hint: `? = ${quot} × ${b} + ${rem}`,
        };
      }
    }

    return {
      type: 'div_rem',
      a, b, quot, rem,
      hint: `${a} = ? × ${b} + ?\nSprawdź: ${quot} × ${b} = ${b * quot}`,
    };
  },

  // ── MNOŻENIE LICZB Z ZERAMI NA KOŃCU ─────────────────────────
  'Mnożenie liczb z zerami na końcu': (d) => {
    const isEasy = d === 'easy';

    if (isEasy) {
      const op  = rand(0, 1); // 0 = mnożenie, 1 = dzielenie
      const pow = [10, 100, 1000][rand(0, 2)];
      const z   = Math.log10(pow);
      const zStr = z === 1 ? 'jedno zero' : z === 2 ? 'dwa zera' : 'trzy zera';

      if (op === 0) {
        const a = rand(1, Math.floor(9999 / pow));
        return {
          q:    `${a} × ${pow} = ?`,
          a:    a * pow,
          hint: `Dopisz ${zStr} na końcu liczby ${a}`,
        };
      } else {
        const result = rand(1, 999);
        const a = result * pow;
        return {
          q:     `${a} ÷ ${pow} = ?`,
          a:     result,
          hint: `Przekreśl ${zStr} na końcu: ${a} → ${result}`,
        };
      }
    } else {
      const tensM    = [20, 30, 40, 50, 60, 70, 80, 90];
      const hundredsM = [200, 300, 400, 500, 600, 700, 800, 900];
      const allM     = [...tensM, ...hundredsM];
      const mult     = allM[rand(0, allM.length - 1)];
      const isTens   = mult < 100;
      const digit    = mult / (isTens ? 10 : 100);
      const maxA     = isTens ? 50 : 20;
      const a        = rand(2, maxA);
      const result   = a * mult;
      const powStr   = isTens ? 'jedno zero' : 'dwa zera';

      const mode = rand(0, 2);
      if (mode === 0) {
        return {
          q:    `${a} × ${mult} = ?`,
          a:    result,
          hint: `${a} × ${digit} = ${a * digit}, potem dopisz ${powStr}: ${result}`,
        };
      } else if (mode === 1) {
        return {
          q:    `? × ${mult} = ${result}`,
          a,
          hint: `Podziel ${result} przez ${mult}: ${result} ÷ ${mult} = ?`,
        };
      } else {
        return {
          q:    `${result} ÷ ${mult} = ?`,
          a,
          hint:  `Przekreśl ${powStr} w obu liczbach: ${result} → ${result / (isTens ? 10 : 100)}, ${mult} → ${digit}`,
          hint2: `Potem: ${result / (isTens ? 10 : 100)} ÷ ${digit} = ?`,
        };
      }
    }
  },

  // ── MNOŻENIE PISEMNE ─────────────────────────────────────────
  'Mnożenie pisemne': (d) => {
    if (d === 'easy') {
      const a = rand(11, 999);
      const b = rand(2, 9);
      const answer = a * b;
      const mulCarries = computeMulCarries(a, b);
      return { type: 'written-multiplication', numbers: [a, b], answer, mulCarries, partials: [{ value: answer, shift: 0 }] };
    } else {
      const aDigits = rand(2, 3);
      const bDigits = d === 'medium' ? rand(2, 2) : rand(2, 3);
      const a = rand(Math.pow(10, aDigits - 1), Math.pow(10, aDigits) - 1);
      const b = rand(Math.pow(10, bDigits - 1), Math.pow(10, bDigits) - 1);
      const answer = a * b;
      const bStr = String(b);
      const partials = bStr.split('').reverse().map((digit, shift) => ({
        value: a * parseInt(digit), shift
      }));
      return { type: 'written-multiplication', numbers: [a, b], answer, partials };
    }
  },

  // ── ZAOKRĄGLANIE ─────────────────────────────────────────────
  'Zaokrąglanie': (d) => {
    const intNames = ['jedności','dziesiątek','setek','tysięcy','dziesiątek tysięcy','setek tysięcy','milionów'];
    const decNamesA = ['','pierwszej cyfry po przecinku','drugiej cyfry po przecinku',
                       'trzeciej cyfry po przecinku','czwartej cyfry po przecinku'];
    const decNamesB = ['','części dziesiętnych','części setnych',
                       'części tysięcznych','części dziesięciotysięcznych'];
    const decNames = rand(0, 1) ? decNamesA : decNamesB;

    if (d !== 'medium') {
      // Łatwy / challenge: liczby naturalne, do 7 cyfr
      const digits = rand(2, 7);
      const number = rand(10 ** (digits - 1), 10 ** digits - 1);
      const r = rand(1, digits - 1);
      const answer = Math.round(number / 10 ** r) * 10 ** r;
      const numberStr = String(number);
      const decidingIdx = numberStr.length - r;
      return { type: 'rounding', numberStr, r, answer, orderName: intNames[r], isDecimal: false, decidingIdx };
    } else {
      // Średni: liczba z ułamkiem dziesiętnym, zaokrąglanie do rzędów całkowitych LUB po przecinku
      const decTotal = rand(2, 4);              // co najmniej 2 miejsca dziesiętne
      const intPart  = rand(10, 9999);          // co najmniej 2 cyfry całkowite
      const intDigits = String(intPart).length;
      const decDigits = Array.from({ length: decTotal }, () => rand(0, 9));
      const numberStr = `${intPart}.${decDigits.join('')}`;
      const dotIdx = numberStr.indexOf('.');

      // Zbiór poprawnych wartości r:
      //   r >= 0: zaokrąglanie do rzędu całkowitego (r=0 → jedności, r=1 → dziesiątek, …)
      //   r <  0: zaokrąglanie do miejsc po przecinku (r=-1 → 1 miejsce, …)
      const validR = [];
      for (let r = 0; r <= Math.min(intDigits - 1, 3); r++) validR.push(r);
      for (let r = -1; r >= -(decTotal - 1); r--) validR.push(r);
      const r = validR[rand(0, validR.length - 1)];

      // Odpowiedź
      const numVal = parseFloat(numberStr);
      const answer = r >= 0
        ? Math.round(numVal / 10 ** r) * 10 ** r
        : Math.round(numVal * 10 ** (-r)) / 10 ** (-r);

      // Indeks decydującej cyfry
      let decidingIdx;
      if (r === 0) decidingIdx = dotIdx + 1;          // pierwsza cyfra po przecinku
      else if (r > 0) decidingIdx = intDigits - r;    // cyfra w części całkowitej
      else decidingIdx = dotIdx + 1 + (-r);            // cyfra w części ułamkowej

      const decToRound = r < 0 ? -r : 0;
      return { type: 'rounding', numberStr, r, answer,
               orderName: r >= 0 ? intNames[r] : decNames[-r],
               isDecimal: r < 0, decidingIdx, decToRound };
    }
  },

  // ── POTĘGOWANIE ───────────────────────────────────────────────
  'Potęgowanie': (d) => {
    // Wyzwanie = ten sam poziom co średni (tylko na czas)
    const isEasy = d === 'easy';
    // Zbiór podstaw dla kwadratów: 1–16 + 20,30,40,50 (bez 17–19)
    const sqBases = isEasy
      ? [1,2,3,4,5,6,7,8,9,10]
      : [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,20,30,40,50];

    // zero_exp i zero_base mają mniejszą wagę (1x zamiast 2x)
    const types = isEasy
      ? ['sq_fwd', 'cu_fwd']
      : ['sq_fwd', 'sq_fwd', 'cu_fwd', 'cu_fwd',
         'pow10_fwd', 'pow10_fwd', 'pow2_fwd', 'pow2_fwd',
         'sq_rev', 'sq_rev', 'sq_rev', 'cu_rev', 'cu_rev', 'cu_rev',
         'pow2_rev_exp', 'pow2_rev_exp', 'pow10_rev_exp', 'pow10_rev_exp',
         'zero_exp', 'zero_base'];
    // Blokada powtórek — losuj ponownie jeśli ten sam typ co poprzedni
    let type;
    do { type = types[rand(0, types.length - 1)]; } while (type === state.lastPowerType);
    state.lastPowerType = type;

    if (type === 'sq_fwd') {
      const base = sqBases[rand(0, sqBases.length - 1)];
      return { type: 'power', sub: 'fwd', base, exp: 2, answer: base ** 2 };
    } else if (type === 'cu_fwd') {
      const base = rand(1, isEasy ? 6 : 10);
      return { type: 'power', sub: 'fwd', base, exp: 3, answer: base ** 3 };
    } else if (type === 'pow10_fwd') {
      const exp = rand(1, 5);
      return { type: 'power', sub: 'fwd', base: 10, exp, answer: 10 ** exp };
    } else if (type === 'pow2_fwd') {
      const exp = rand(1, 10);
      return { type: 'power', sub: 'fwd', base: 2, exp, answer: 2 ** exp };
    } else if (type === 'sq_rev') {
      // □² = wynik  →  podaj podstawę
      const base = sqBases[rand(0, sqBases.length - 1)];
      return { type: 'power', sub: 'rev_base', base, exp: 2, result: base ** 2, answer: base,
        hint: `Szukasz liczby, której kwadrat to ${base**2}.\nKtóra liczba × ona sama = ${base**2}?` };
    } else if (type === 'cu_rev') {
      const base = rand(2, 10);
      return { type: 'power', sub: 'rev_base', base, exp: 3, result: base ** 3, answer: base,
        hint: `Szukasz liczby, której sześcian to ${base**3}.\nKtóra liczba × ona sama × ona sama = ${base**3}?` };
    } else if (type === 'pow2_rev_exp') {
      // 2^□ = wynik  →  podaj wykładnik
      const exp = rand(1, 10);
      return { type: 'power', sub: 'rev_exp', base: 2, exp, result: 2 ** exp, answer: exp };
    } else if (type === 'pow10_rev_exp') {
      const exp = rand(1, 5);
      return { type: 'power', sub: 'rev_exp', base: 10, exp, result: 10 ** exp, answer: exp };
    } else if (type === 'zero_exp') {
      // a⁰ = 1
      const base = rand(2, 20);
      return { type: 'power', sub: 'fwd', base, exp: 0, answer: 1 };
    } else {
      // 0ⁿ = 0  (n > 0)
      const exp = rand(2, 6);
      return { type: 'power', sub: 'fwd', base: 0, exp, answer: 0 };
    }
  },

  // ── KOLEJNOŚĆ DZIAŁAŃ ─────────────────────────────────────────
  'Kolejność działań': (d) => {
    const isEasy = d === 'easy';

    const easyTpls = [
      () => { const a=rand(1,15),b=rand(2,8),c=rand(2,8);
              return { expr:`${a} + ${b} · ${c}`, answer:a+b*c }; },
      () => { const b=rand(2,6),c=rand(2,6),a=rand(b*c+2,b*c+25);
              return { expr:`${a} - ${b} · ${c}`, answer:a-b*c }; },
      () => { const c=rand(2,8),k=rand(2,8),b=c*k,a=rand(1,15);
              return { expr:`${a} + ${b} ÷ ${c}`, answer:a+k }; },
      () => { const c=rand(2,8),k=rand(3,9),b=c*k,a=rand(k+2,k+20);
              return { expr:`${a} - ${b} ÷ ${c}`, answer:a-k }; },
      () => { const a=rand(2,6),b=rand(2,6),c=rand(2,6),d=rand(2,6);
              return { expr:`${a} · ${b} + ${c} · ${d}`, answer:a*b+c*d }; },
      () => { const c=rand(2,5),d=rand(2,5),a=rand(c+2,9),b=rand(d+2,9);
              if (a*b <= c*d) return null;
              return { expr:`${a} · ${b} - ${c} · ${d}`, answer:a*b-c*d }; },
      // lewo-prawo: a - b + c (≠ a−(b+c))
      () => { const b=rand(2,8),c=rand(2,8),a=rand(b+c+2,b+c+20);
              return { expr:`${a} - ${b} + ${c}`, answer:a-b+c }; },
      // lewo-prawo: a ÷ b · c
      () => { const b=rand(2,8),k=rand(2,8),a=b*k,c=rand(2,8);
              return { expr:`${a} ÷ ${b} · ${c}`, answer:k*c }; },
      // lewo-prawo: a · b ÷ c (b wielokrotność c)
      () => { const c=rand(2,6),m=rand(2,5),b=c*m,a=rand(2,8);
              return { expr:`${a} · ${b} ÷ ${c}`, answer:a*m }; },
      // lewo-prawo: a - b - c (≠ a-(b-c))
      () => { const b=rand(2,8),c=rand(2,8),a=rand(b+c+2,b+c+20);
              return { expr:`${a} - ${b} - ${c}`, answer:a-b-c }; },
    ];

    const medTpls = [
      () => { const a=rand(2,12),b=rand(2,12),c=rand(2,8);
              return { expr:`(${a} + ${b}) · ${c}`, answer:(a+b)*c }; },
      () => { const b=rand(2,8),c=rand(2,8),a=rand(b+2,b+15);
              return { expr:`(${a} - ${b}) · ${c}`, answer:(a-b)*c }; },
      () => { const a=rand(2,8),b=rand(2,10),c=rand(2,10);
              return { expr:`${a} · (${b} + ${c})`, answer:a*(b+c) }; },
      () => { const c=rand(2,6),a=rand(2,8),b=rand(c+2,c+12);
              return { expr:`${a} · (${b} - ${c})`, answer:a*(b-c) }; },
      () => { const c=rand(2,8),res=rand(3,12),sum=c*res,a=rand(1,sum-1),b=sum-a;
              return { expr:`(${a} + ${b}) ÷ ${c}`, answer:res }; },
      () => { const b=rand(2,7),c=rand(2,7),d=rand(2,10),a=rand(1,15);
              const ans=a+b*c-d; if(ans<=0) return null;
              return { expr:`${a} + ${b} · ${c} - ${d}`, answer:ans }; },
      () => { const a=rand(2,8),b=rand(2,8),c=rand(2,6),d=rand(1,15);
              return { expr:`(${a} + ${b}) · ${c} + ${d}`, answer:(a+b)*c+d }; },
      () => { const a=rand(2,8),b=rand(2,8),c=rand(2,6),d=rand(1,10);
              const ans=(a+b)*c-d; if(ans<=0) return null;
              return { expr:`(${a} + ${b}) · ${c} - ${d}`, answer:ans }; },
      () => { const a=rand(3,9),b=rand(3,9),c=rand(2,8),d=rand(2,8);
              const ans=a*b-c-d; if(ans<=0) return null;
              return { expr:`${a} · ${b} - (${c} + ${d})`, answer:ans }; },
      () => { const d=rand(2,5),c=rand(d+2,d+8),a=rand(2,8),b=rand(2,8);
              return { expr:`(${a} + ${b}) · (${c} - ${d})`, answer:(a+b)*(c-d) }; },
      // ─ Potęgi ─
      () => { const a=rand(2,9),b=rand(2,8),c=rand(2,8);
              return { expr:`${a}<sup>2</sup> + ${b} · ${c}`, answer:a**2+b*c }; },
      () => { const a=rand(3,9),b=rand(2,6),c=rand(2,6);
              if(a**2 <= b*c) return null;
              return { expr:`${a}<sup>2</sup> - ${b} · ${c}`, answer:a**2-b*c }; },
      () => { const a=rand(2,8),b=rand(2,8),c=rand(2,7);
              return { expr:`${a} · ${b} + ${c}<sup>2</sup>`, answer:a*b+c**2 }; },
      () => { const c=rand(2,6),a=rand(c+1,9),b=rand(c+1,9);
              if(a*b <= c**2) return null;
              return { expr:`${a} · ${b} - ${c}<sup>2</sup>`, answer:a*b-c**2 }; },
      () => { const s=rand(3,8),c=rand(1,s**2-2),a=rand(1,s-1),b=s-a;
              return { expr:`(${a} + ${b})<sup>2</sup> - ${c}`, answer:s**2-c }; },
      () => { const b=rand(2,7),a=rand(b+1,9);
              return { expr:`${a}<sup>2</sup> - ${b}<sup>2</sup>`, answer:a**2-b**2 }; },
      // ─ Nawiasy w nawiasach ─
      () => { const a=rand(1,10),b=rand(2,5),c=rand(2,5),d=rand(2,5);
              return { expr:`(${a} + ${b} · ${c}) · ${d}`, answer:(a+b*c)*d }; },
      () => { const b=rand(2,4),c=rand(2,4),d=rand(2,5),a=rand(b*c+2,b*c+15);
              return { expr:`(${a} - ${b} · ${c}) · ${d}`, answer:(a-b*c)*d }; },
      () => { const a=rand(2,6),b=rand(1,8),c=rand(2,5),d=rand(2,5);
              return { expr:`${a} · (${b} + ${c} · ${d})`, answer:a*(b+c*d) }; },
      () => { const c=rand(2,6),d=rand(2,6),b=rand(2,5),a=rand(c+d+2,c+d+15);
              return { expr:`(${a} - (${c} + ${d})) · ${b}`, answer:(a-c-d)*b }; },
      () => { const a=rand(2,6),b=rand(2,6),c=rand(2,5),e=rand(2,6);
              const p=(a+b)*c,kMin=Math.ceil(p/e)+1,k=rand(kMin,kMin+4),dv=e*k-p;
              if(dv<=0||dv>40) return null;
              return { expr:`((${a} + ${b}) · ${c} + ${dv}) ÷ ${e}`, answer:k }; },
      // lewo-prawo z nawiasem: a ÷ (b + c) · d
      () => { const b=rand(2,5),c=rand(2,5),d=rand(2,6),s=b+c,a=s*rand(2,5);
              return { expr:`${a} ÷ (${b} + ${c}) · ${d}`, answer:(a/s)*d }; },
      // (a + b) · c ÷ d — c wielokrotność d
      () => { const a=rand(2,8),b=rand(2,8),d=rand(2,5),m=rand(2,4),c=d*m;
              return { expr:`(${a} + ${b}) · ${c} ÷ ${d}`, answer:(a+b)*m }; },
      // potęga + nawias: a² + (b - c) · d
      () => { const a=rand(2,7),b=rand(3,10),c=rand(2,b-1),d=rand(2,6);
              return { expr:`${a}<sup>2</sup> + (${b} - ${c}) · ${d}`, answer:a**2+(b-c)*d }; },
      // a - (b - c): pułapka odwrotna do a-b-c
      () => { const c=rand(2,8),b=rand(c+2,c+15),a=rand(2,20);
              return { expr:`${a} - (${b} - ${c})`, answer:a-b+c }; },
    ];

    const tpls = isEasy ? easyTpls : medTpls;
    let result = null, idx = -1;
    for (let tries = 0; tries < 20 && !result; tries++) {
      const i = rand(0, tpls.length - 1);
      if (i === state.lastOOIdx) continue;
      result = tpls[i]();
      if (result) idx = i;
    }
    if (!result) {
      const a=rand(1,10),b=rand(2,5),c=rand(2,5);
      result = { expr:`${a} + ${b} · ${c}`, answer:a+b*c }; idx=0;
    }
    state.lastOOIdx = idx;
    return { type:'order_ops', q:result.expr, answer:result.answer };
  },

  // ── PODZIELNOŚĆ LICZB ─────────────────────────────────────────
  'Podzielność liczb': (d) => {
    const easyPool = [2, 3, 4, 5, 9, 10, 100];
    const medPool  = [2, 3, 4, 5, 6, 9, 10, 15, 18, 30, 45, 90, 100, 300, 900];
    const pool = d === 'easy' ? easyPool : medPool;
    const minN = d === 'easy' ? 100 : 900;
    const maxN = d === 'easy' ? 9999 : (d === 'medium' ? 99999 : 999999);

    let n, correct, wrong;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (d !== 'easy') {
        const base = pool[rand(0, pool.length - 1)];
        const maxM = Math.floor(maxN / base);
        const minM = Math.ceil(minN / base);
        n = (minM <= maxM) ? base * rand(minM, maxM) : rand(minN, maxN);
      } else {
        n = rand(minN, maxN);
      }
      correct = pool.filter(p => n % p === 0);
      wrong   = pool.filter(p => n % p !== 0);
      if (correct.length >= 2 && wrong.length >= 2) break;
    }

    // Pokaż max 4 poprawne + uzupełnij do 6 błędnymi
    const shownC = [...correct].sort(() => Math.random() - 0.5).slice(0, Math.min(4, correct.length));
    const shownW = [...wrong].sort(() => Math.random() - 0.5).slice(0, 6 - shownC.length);
    const options = [...shownC, ...shownW].sort((a, b) => a - b);
    return { type: 'divisibility', n, options, answers: shownC };
  },

  // ── O ILE? ILE RAZY? ─────────────────────────────────────────
  'O ile? Ile razy?': (d) => {
    // mode 0-1: porównanie (luka), 2: znajdź o X większą/mniejszą, 3: znajdź K razy większą/mniejszą
    const mode = rand(0, 3);

    if (mode === 0) {
      // "Liczba A jest o D większa/mniejsza od liczby B"
      const bMax = d === 'easy' ? 100 : d === 'medium' ? 1000 : 9999;
      const dMax = d === 'easy' ? 50  : d === 'medium' ? 500  : 9999;
      const B = rand(10, bMax);
      const D = rand(1, dMax);
      const A = B + D;
      const bigger = rand(0, 1);
      const [v0, v1, v2, rel] = bigger
        ? [A, D, B, 'większa']
        : [B, D, A, 'mniejsza'];
      const parts = ['Liczba ', ` jest o `, ` ${rel} od liczby `, ''];
      const given = [v0, v1, v2];
      const blankIdx = rand(0, 2);
      return { type: 'comparison', parts, given, blankIdx, answer: given[blankIdx] };
    } else if (mode === 1) {
      // "Liczba A jest K razy większa/mniejsza od liczby B"
      const bMax = d === 'easy' ? 12 : d === 'medium' ? 50  : 200;
      const kMax = d === 'easy' ? 9  : d === 'medium' ? 20  : 50;
      const B = rand(2, bMax);
      const K = rand(2, kMax);
      const A = B * K;
      const bigger = rand(0, 1);
      const [v0, v1, v2, rel] = bigger
        ? [A, K, B, 'większa']
        : [B, K, A, 'mniejsza'];
      const parts = ['Liczba ', ' jest ', ` razy ${rel} od liczby `, ''];
      const given = [v0, v1, v2];
      const blankIdx = rand(0, 2);
      return { type: 'comparison', parts, given, blankIdx, answer: given[blankIdx] };
    } else if (mode === 2) {
      // "Znajdź liczbę o D większą/mniejszą od B"
      const bMax = d === 'easy' ? 80  : d === 'medium' ? 500  : 5000;
      const dMax = d === 'easy' ? 40  : d === 'medium' ? 200  : 2000;
      const bigger = rand(0, 1);
      if (bigger) {
        const B = rand(5, bMax);
        const D = rand(1, dMax);
        return { q: `Znajdź liczbę o ${D} większą od ${B}.`,
                 a: B + D, hint: `${B} + ${D} = ?` };
      } else {
        const D = rand(1, dMax);
        const B = rand(D + 1, dMax + 10); // B > D, żeby wynik był dodatni
        return { q: `Znajdź liczbę o ${D} mniejszą od ${B}.`,
                 a: B - D, hint: `${B} − ${D} = ?` };
      }
    } else {
      // "Znajdź liczbę K razy większą/mniejszą od B"
      const bMax = d === 'easy' ? 12 : d === 'medium' ? 50  : 200;
      const kMax = d === 'easy' ? 9  : d === 'medium' ? 12  : 30;
      const bigger = rand(0, 1);
      const B = rand(2, bMax);
      const K = rand(2, kMax);
      if (bigger) {
        return { q: `Znajdź liczbę ${K} razy większą od ${B}.`,
                 a: B * K, hint: `${B} × ${K} = ?` };
      } else {
        const A = B * K; // A = baza, K razy mniejsza → B
        return { q: `Znajdź liczbę ${K} razy mniejszą od ${A}.`,
                 a: B, hint: `${A} ÷ ${K} = ?` };
      }
    }
  },

  // ── POJĘCIE FUNKCJI ─────────────────────────────────────────
  'Pojęcie funkcji': (d) => {
    const isEasy = d === 'easy';

    function uniq(n, mn, mx) {
      const s = new Set();
      for (let t = 0; t < 200 && s.size < n; t++) s.add(rand(mn, mx));
      return [...s];
    }

    function makePairs(isFunc) {
      const n = rand(3, 4);
      let xs, ys;
      if (isFunc) {
        xs = uniq(n, 1, 8);
        ys = Array.from({ length: n }, () => rand(1, 8));
      } else {
        xs = uniq(n - 1, 1, 8);
        const di = rand(0, xs.length - 1);
        const dupX = xs[di];
        ys = Array.from({ length: n - 1 }, () => rand(1, 8));
        let dy; do { dy = rand(1, 8); } while (dy === ys[di]);
        xs.splice(rand(0, n - 1), 0, dupX);
        ys.splice(rand(0, n - 1), 0, dy);
      }
      const pairs = xs.map((x, i) => [x, ys[i]]);
      pairs.sort(() => Math.random() - 0.5);
      return { type: 'function_q', subType: 'pairs', pairs, isFunction: isFunc };
    }

    if (isEasy) {
      const easyLinear = [
        'y = x + 1', 'y = 2x', 'y = x − 3', 'y = 3x + 2',
        'y = −x + 5', 'y = 4x − 1', 'y = x + 4', 'y = 2x − 3',
        'y = −2x + 1', 'y = x − 7',
      ];
      if (Math.random() < 0.5) return makePairs(Math.random() > 0.5);
      return { type: 'function_q', subType: 'formula', formula: easyLinear[rand(0, easyLinear.length - 1)], isFunction: true,
        hint: 'Funkcja liniowa — każdemu x odpowiada dokładnie jedna wartość.' };
    }

    // Medium: pary, tabelka, wzór lub słowne
    const subTypes = ['pairs', 'pairs', 'table', 'table', 'formula', 'formula', 'words', 'words'];
    const subType = subTypes[rand(0, subTypes.length - 1)];
    const isFunc = Math.random() > 0.5;

    if (subType === 'pairs') return makePairs(isFunc);

    if (subType === 'table') {
      let xs, ys;
      if (isFunc) {
        xs = uniq(4, -3, 4);
        ys = Array.from({ length: 4 }, () => rand(-4, 4));
      } else {
        xs = uniq(3, -3, 4);
        const di = rand(0, 2);
        const dupX = xs[di];
        ys = Array.from({ length: 3 }, () => rand(-4, 4));
        let dy; do { dy = rand(-4, 4); } while (dy === ys[di]);
        xs.splice(rand(0, 3), 0, dupX);
        ys.splice(rand(0, 3), 0, dy);
      }
      const pairs = xs.map((x, i) => [x, ys[i]]).sort((a, b) => a[0] - b[0]);
      return { type: 'function_q', subType: 'table', pairs, isFunction: isFunc };
    }

    if (subType === 'words') {
      const wordExamples = [
        { text: 'Każdej osobie w klasie przyporządkowujemy jej wzrost w centymetrach.', isFunction: true,  hint: 'Każda osoba ma dokładnie jeden wzrost.' },
        { text: 'Każdemu uczniowi przyporządkowujemy jego numer w dzienniku.',           isFunction: true,  hint: 'Każdy uczeń ma jeden numer.' },
        { text: 'Każdemu krajowi przyporządkowujemy jego stolicę.',                       isFunction: true,  hint: 'Każdy kraj ma dokładnie jedną stolicę.' },
        { text: 'Każdemu kwadratowi przyporządkowujemy jego pole.',                       isFunction: true,  hint: 'Pole kwadratu jest jednoznacznie określone przez długość boku.' },
        { text: 'Każdemu uczniowi przyporządkowujemy datę jego urodzin.',                 isFunction: true,  hint: 'Każdy człowiek urodził się dokładnie jednego dnia.' },
        { text: 'Każdemu samochodowi przyporządkowujemy jego numer rejestracyjny.',       isFunction: true,  hint: 'Jeden samochód – jeden numer rejestracyjny.' },
        { text: 'Każdej liczbie naturalnej przyporządkowujemy jej kwadrat.',              isFunction: true,  hint: 'Kwadrat liczby jest jednoznaczny: n² to jedna wartość.' },
        { text: 'Każdemu produktowi w sklepie przyporządkowujemy jego cenę.',             isFunction: true,  hint: 'Jeden produkt ma jedną cenę.' },
        { text: 'Każdemu kołu przyporządkowujemy jego obwód.',                            isFunction: true,  hint: 'Obwód koła to 2πr – jedna wartość dla danego promienia.' },
        { text: 'Każdemu uczniowi przyporządkowujemy ocenę końcową z matematyki.',        isFunction: true,  hint: 'Jedna ocena końcowa na świadectwie.' },
        { text: 'Każdemu dniu roku szkolnego przyporządkowujemy liczbę lekcji w tym dniu.', isFunction: true,  hint: 'W danym dniu odbywa się określona liczba lekcji.' },
        { text: 'Każdej osobie przyporządkowujemy jej rodzeństwo.',                       isFunction: false, hint: 'Ktoś może mieć brata i siostrę – to dwie osoby, nie jedna.' },
        { text: 'Każdej liczbie naturalnej przyporządkowujemy jej dzielnik.',             isFunction: false, hint: 'Liczba 6 ma cztery dzielniki: 1, 2, 3 i 6.' },
        { text: 'Każdemu miastu przyporządkowujemy jego mieszkańca.',                     isFunction: false, hint: 'Miasto ma wielu mieszkańców – nie można wskazać jednego.' },
        { text: 'Każdemu uczniowi przyporządkowujemy przedmiot szkolny, który lubi.',     isFunction: false, hint: 'Uczeń może lubić kilka przedmiotów jednocześnie.' },
        { text: 'Każdej liczbie dodatniej przyporządkowujemy liczbę, której kwadrat jest jej równy.', isFunction: false, hint: 'Np. dla 4: zarówno 2, jak i −2, bo (−2)² = 4.' },
        { text: 'Każdej osobie przyporządkowujemy kraj, który odwiedziła.',               isFunction: false, hint: 'Jedna osoba może odwiedzić wiele krajów.' },
        { text: 'Każdemu uczniowi przyporządkowujemy jego kolegę z klasy.',               isFunction: false, hint: 'Każdy uczeń ma wielu kolegów – wynik nie jest jednoznaczny.' },
        { text: 'Każdemu wielokątowi przyporządkowujemy jego wierzchołek.',               isFunction: false, hint: 'Wielokąt ma wiele wierzchołków.' },
        { text: 'Każdemu uczniowi przyporządkowujemy wszystkie jego oceny z matematyki.', isFunction: false, hint: 'Uczeń może mieć kilka ocen w ciągu semestru.' },
        { text: 'Każdej osobie przyporządkowujemy imię jej przyjaciela.',                 isFunction: false, hint: 'Można mieć kilku przyjaciół.' },
        { text: 'Każdemu słowu języka polskiego przyporządkowujemy jego synonim.',        isFunction: false, hint: 'Wiele słów ma kilka synonimów.' },
      ];
      const ex = wordExamples[rand(0, wordExamples.length - 1)];
      return { type: 'function_q', subType: 'words', text: ex.text, isFunction: ex.isFunction, hint: ex.hint };
    }

    // formula
    const funcF = [
      { f: 'y = 2x + 3',                              hint: 'Funkcja liniowa — każdemu x odpowiada dokładnie jedna wartość.' },
      { f: 'y = x<sup>2</sup>',                        hint: 'Parabola — dla każdego x jest dokładnie jedno y = x².' },
      { f: 'y = x<sup>3</sup> − 2',                    hint: 'Wielomian — każdemu x odpowiada dokładnie jedna wartość.' },
      { f: 'y = |x|',                                  hint: 'Wartość bezwzględna jest jednoznaczna — każdemu x odpowiada jedno y.' },
      { f: 'y = √x &nbsp;(dla x ≥ 0)',                hint: 'Pierwiastek arytmetyczny jest zawsze nieujemny — jedna wartość dla każdego x.' },
      { f: 'y = x<sup>2</sup> + 2x + 1',              hint: 'Wielomian — każdemu x odpowiada dokładnie jedna wartość.' },
      { f: 'y = 3x − 1',                              hint: 'Funkcja liniowa — każdemu x odpowiada dokładnie jedna wartość.' },
      { f: 'y = x<sup>4</sup> − 2x<sup>2</sup> + 1',  hint: 'Wielomian parzysty — dla każdego x jest dokładnie jedno y.' },
      { f: 'y = x<sup>3</sup> + x<sup>2</sup> − 2',   hint: 'Wielomian — każdemu x odpowiada dokładnie jedna wartość.' },
      { f: 'y = 1/x &nbsp;(dla x ≠ 0)',               hint: 'Funkcja homograficzna — dla każdego x ≠ 0 jest dokładnie jedno y = 1/x.' },
      { f: 'y = 1/(x − 2) &nbsp;(dla x ≠ 2)',         hint: 'Funkcja homograficzna — dla każdego x ≠ 2 jest dokładnie jedno y.' },
      { f: 'y = 2/(x + 1) &nbsp;(dla x ≠ −1)',        hint: 'Funkcja homograficzna — dla każdego x ≠ −1 jest dokładnie jedno y.' },
    ];
    const notFuncF = [
      { f: 'x<sup>2</sup> + y<sup>2</sup> = 4',        hint: 'To okrąg — np. dla x = 0: y = 2 lub y = −2 (dwie wartości!).' },
      { f: 'y<sup>2</sup> = x',                        hint: 'Np. dla x = 4: y = 2 lub y = −2 — dwie wartości dla jednego x.' },
      { f: 'x<sup>2</sup> + y<sup>2</sup> = 9',        hint: 'To okrąg — dla wielu x istnieją dwie wartości y.' },
      { f: '|y| = x &nbsp;(dla x ≥ 0)',               hint: 'Np. dla x = 3: y = 3 lub y = −3 — dwie wartości.' },
      { f: 'y<sup>2</sup> = x + 1',                    hint: 'Np. dla x = 3: y² = 4, więc y = 2 lub y = −2.' },
      { f: 'x<sup>2</sup> + y<sup>2</sup> = 16',       hint: 'To okrąg — np. dla x = 0: y = 4 lub y = −4.' },
      { f: 'x<sup>2</sup> + y<sup>2</sup> = 25',       hint: 'To okrąg — np. dla x = 0: y = 5 lub y = −5.' },
    ];
    const chosen = isFunc ? funcF[rand(0, funcF.length - 1)] : notFuncF[rand(0, notFuncF.length - 1)];
    return { type: 'function_q', subType: 'formula', formula: chosen.f, isFunction: isFunc, hint: chosen.hint };
  },

  // ── ŚWIAT LICZB ────────────────────────────────────────────
  'Świat liczb': (d) => {
    const isEasy = d === 'easy';

    function sfShuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // Zmienia jedną cyfrę w n → distractors brzmią podobnie, różnią się jednym składnikiem
    function wrongNums(n) {
      const str = String(n), len = str.length;
      const digits = [...str].map(Number);
      const ws = new Set();
      for (let t = 0; t < 300 && ws.size < 3; t++) {
        const newDigs = [...digits];
        const pos = rand(0, len - 1);
        let d;
        do { d = pos === 0 ? rand(1, 9) : rand(0, 9); } while (d === newDigs[pos]);
        newDigs[pos] = d;
        const w = parseInt(newDigs.join(''));
        if (w !== n) ws.add(w);
      }
      return [...ws];
    }

    function mkExpand(n) {
      const str = String(n), len = str.length;
      const digits = str.split('').map(Number);
      const places = digits.map((_, i) => Math.pow(10, len - 1 - i));
      const nonZero = digits.map((d, i) => d ? i : -1).filter(i => i >= 0);
      const bp = nonZero[rand(0, nonZero.length - 1)];
      const terms = digits.map((d, i) => {
        const p = places[i], ps = fmtNum(p);
        if (i === bp) return p === 1 ? '___' : `___ · ${ps}`;
        return p === 1 ? String(d) : `${d} · ${ps}`;
      });
      return { type: 'expand', q: `${fmtNum(n)} = ${terms.join(' + ')}`, answer: digits[bp] };
    }

    if (isEasy) {
      const n = rand(100, 999);
      const subs = ['num_read', 'num_read', 'num_write', 'expand'];
      const sub = subs[rand(0, subs.length - 1)];
      if (sub === 'num_read') {
        return { type: 'num_read', q: `Zapisz cyframi: ${polishNumber(n)}`, answer: n };
      } else if (sub === 'num_write') {
        const correct = polishNumber(n);
        const opts = sfShuffle([correct, ...wrongNums(n).map(polishNumber)]);
        return { type: 'num_write', n, options: opts, correctIdx: opts.indexOf(correct) };
      } else {
        return mkExpand(n);
      }
    } else {
      const ranges = [[1000, 9999], [10000, 99999], [100000, 999999], [1000000, 9999999]];
      const [mn, mx] = ranges[rand(0, ranges.length - 1)];
      const n = rand(mn, mx);
      const subs = ['num_read', 'num_read', 'num_write', 'expand', 'digit_count'];
      const sub = subs[rand(0, subs.length - 1)];
      if (sub === 'num_write') {
        const correct = polishNumber(n);
        const opts = sfShuffle([correct, ...wrongNums(n).map(polishNumber)]);
        return { type: 'num_write', n, options: opts, correctIdx: opts.indexOf(correct) };
      } else if (sub === 'expand') {
        return mkExpand(n);
      } else if (sub === 'digit_count') {
        return { type: 'num_read', q: `Ile cyfr ma liczba: ${polishNumber(n)}?`, answer: String(n).length };
      } else {
        return { type: 'num_read', q: `Zapisz cyframi: ${polishNumber(n)}`, answer: n };
      }
    }
  },

  'Szacowanie pierwiastków': (d) => {
    const SQ = new Set([1,4,9,16,25,36,49,64,81,100,121,144,169,196,225,256,289,324,361,400,441,484,529]);
    const CU = new Set([1,8,27,64,125,216,343,512,729,1000]);
    let x;
    if (d === 'easy') {
      do { x = rand(2, 80); } while (SQ.has(x));
      const lo = Math.floor(Math.sqrt(x)), hi = lo + 1;
      return { type: 'sqrt_bounds', display: `\u221a${x}`, latex: `\\sqrt{${x}}`, lo, hi, rawX: x, kind: 'sqrt' };
    }
    // medium i challenge — ten sam poziom: warianty z wyrażeniami
    const variant = rand(0, 3);
    if (variant === 0) {
      // √x + k  (dodawanie/odejmowanie)
      do { x = rand(2, 400); } while (SQ.has(x));
      const sqLo = Math.floor(Math.sqrt(x)), sqHi = sqLo + 1;
      const k = rand(1, 4) * (Math.random() < 0.5 ? 1 : -1);
      const latex = k > 0 ? `\\sqrt{${x}} + ${k}` : `\\sqrt{${x}} - ${Math.abs(k)}`;
      const disp  = k > 0 ? `\u221a${x} + ${k}` : `\u221a${x} \u2212 ${Math.abs(k)}`;
      return { type: 'sqrt_bounds', display: disp, latex, lo: sqLo + k, hi: sqHi + k, rawX: x, kind: 'sqrt_offset', offset: k };
    } else if (variant === 1) {
      // -√x  (liczby ujemne)
      do { x = rand(2, 400); } while (SQ.has(x));
      const sqLo = Math.floor(Math.sqrt(x)), sqHi = sqLo + 1;
      return { type: 'sqrt_bounds', display: `\u2212\u221a${x}`, latex: `-\\sqrt{${x}}`, lo: -sqHi, hi: -sqLo, rawX: x, kind: 'neg_sqrt', offset: 0 };
    } else if (variant === 2) {
      // ∛x  (pierwiastek sześcienny)
      do { x = rand(2, 500); } while (CU.has(x));
      const lo = Math.floor(Math.cbrt(x)), hi = lo + 1;
      return { type: 'sqrt_bounds', display: `\u221b${x}`, latex: `\\sqrt[3]{${x}}`, lo, hi, rawX: x, kind: 'cube', offset: 0 };
    } else {
      // √x  duże liczby
      do { x = rand(100, 500); } while (SQ.has(x));
      const lo = Math.floor(Math.sqrt(x)), hi = lo + 1;
      return { type: 'sqrt_bounds', display: `\u221a${x}`, latex: `\\sqrt{${x}}`, lo, hi, rawX: x, kind: 'sqrt', offset: 0 };
    }
  },

  'Rozkład liczby na czynniki pierwsze': (d) => {
    let n, factors;
    if (d === 'easy') {
      do { n = rand(12, 100); factors = primeFactorsOf(n); } while (factors.length < 2);
    } else {
      do { n = rand(60, 600); factors = primeFactorsOf(n); } while (factors.length < 3);
    }
    return { type: 'prime_factors', n, factors };
  },

  'Wyznaczanie NWD': (d) => {
    let a, b, gcd;
    if (d === 'easy') {
      do {
        a = rand(6, 60); b = rand(6, 60); gcd = gcdOf(a, b);
      } while (gcd < 2 || a === b || a % b === 0 || b % a === 0);
      return { type: 'nwd', a, b, factorsA: primeFactorsOf(a), factorsB: primeFactorsOf(b), gcd };
    }
    // medium/challenge: ~35% szans na 3 liczby
    if (Math.random() < 0.35) {
      let c;
      do {
        a = rand(10, 150); b = rand(10, 150); c = rand(10, 150);
        gcd = gcdOf(gcdOf(a, b), c);
      } while (gcd < 2 || a === b || a === c || b === c);
      return { type: 'nwd', a, b, c, factorsA: primeFactorsOf(a), factorsB: primeFactorsOf(b), factorsC: primeFactorsOf(c), gcd };
    }
    do {
      a = rand(20, 200); b = rand(20, 200); gcd = gcdOf(a, b);
    } while (gcd < 2 || a === b || a % b === 0 || b % a === 0);
    return { type: 'nwd', a, b, factorsA: primeFactorsOf(a), factorsB: primeFactorsOf(b), gcd };
  },

  'Wyznaczanie NWW': (d) => {
    let a, b, lcm;
    if (d === 'easy') {
      do {
        a = rand(2, 20); b = rand(2, 20); lcm = lcmOf(a, b);
      } while (gcdOf(a, b) < 2 || a === b || lcm > 200);
    } else {
      do {
        a = rand(10, 150); b = rand(10, 150); lcm = lcmOf(a, b);
      } while (gcdOf(a, b) < 2 || a === b || lcm > 6000);
    }
    return { type: 'nww', a, b, factorsA: primeFactorsOf(a), factorsB: primeFactorsOf(b), lcm };
  },

  'Liczenie w głowie': (d) => {
    const easy = d === 'easy';

    // Równania z niewiadomą □ — tylko na medium/challenge, 25% szans
    if (!easy && Math.random() < 0.25) {
      const etype = rand(0, 3);
      if (etype === 0) {
        const a = rand(10, 150), b = rand(5, 80);
        const c = a + b;
        return Math.random() < 0.5
          ? { q: `□ + ${b} = ${c}`, a, hint: `Odejmij: ${c} − ${b} = ?` }
          : { q: `${a} + □ = ${c}`, a: b, hint: `Odejmij: ${c} − ${a} = ?` };
      } else if (etype === 1) {
        const b = rand(5, 60), c = rand(5, 60);
        const a = b + c;
        return Math.random() < 0.5
          ? { q: `□ − ${b} = ${c}`, a, hint: `Dodaj: ${c} + ${b} = ?` }
          : { q: `${a} − □ = ${c}`, a: b, hint: `Odejmij: ${a} − ${c} = ?` };
      } else if (etype === 2) {
        const a = rand(2, 12), b = rand(2, 12);
        const c = a * b;
        return Math.random() < 0.5
          ? { q: `□ × ${b} = ${c}`, a, hint: `Podziel: ${c} ÷ ${b} = ?` }
          : { q: `${a} × □ = ${c}`, a: b, hint: `Podziel: ${c} ÷ ${a} = ?` };
      } else {
        const b = rand(2, 10), c = rand(2, 12);
        const a = b * c;
        return Math.random() < 0.5
          ? { q: `□ ÷ ${b} = ${c}`, a, hint: `Pomnóż: ${c} × ${b} = ?` }
          : { q: `${a} ÷ □ = ${c}`, a: b, hint: `Podziel: ${a} ÷ ${c} = ?` };
      }
    }

    // Losuje bliską liczbę okrągłą z 40% szansą
    const pickB = (max) => {
      if (Math.random() < 0.50) {
        const nrs = [];
        for (let r = 10; r <= max + 10; r += 10) {
          if (r - 1 >= 2 && r - 1 <= max) nrs.push(r - 1);
          if (r - 2 >= 2 && r - 2 <= max) nrs.push(r - 2);
          if (r + 1 >= 2 && r + 1 <= max) nrs.push(r + 1);
          if (r + 2 >= 2 && r + 2 <= max) nrs.push(r + 2);
        }
        if (nrs.length) return nrs[Math.floor(Math.random() * nrs.length)];
      }
      return rand(2, max);
    };

    const opRoll = Math.random();

    if (opRoll < 0.35) {
      // Dodawanie
      const a = easy ? rand(10, 50) : rand(20, 200);
      const bMax = easy ? 20 : 100;
      const b = pickB(bMax);
      const hint = nearRoundHint('+', b);
      return { q: `${a} + ${b} = ?`, a: a + b, hint };
    }

    if (opRoll < 0.70) {
      // Odejmowanie
      const b = easy ? pickB(20) : pickB(100);
      const a = easy ? rand(b + 1, Math.min(b + 50, 100)) : rand(b + 1, Math.min(b + 200, 400));
      const hint = nearRoundHint('-', b);
      return { q: `${a} − ${b} = ?`, a: a - b, hint };
    }

    if (opRoll < 0.88) {
      // Mnożenie
      const a = easy ? rand(2, 10) : rand(2, 12);
      const b = easy ? rand(2, 10) : rand(11, 50);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      return { q: `${hi} × ${lo} = ?`, a: hi * lo };
    }

    // Dzielenie
    const divisor = easy ? rand(2, 10) : rand(2, 12);
    const result  = easy ? rand(2, 10) : rand(5, 20);
    return { q: `${divisor * result} ÷ ${divisor} = ?`, a: result };
  },

  'Wartość bezwzględna': (d) => {
    const NON_SQ = [2,3,5,6,7,8,10,11,12,13,14,15,17,18,19,20,21,22,23,24,26,27,28,29];
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const absQ = (exprLatex, exprDisplay, answerNumeric, answerLatex, answerDisplay, signHint = null) =>
      ({ type: 'abs_value', exprLatex, exprDisplay, answerNumeric, answerLatex, answerDisplay, signHint });

    if (d === 'easy') {
      const v = rand(0, 3);
      if (v === 0) {
        // negative integer
        const n = rand(1, 30);
        return absQ(`-${n}`, `-${n}`, n, String(n), String(n));
      }
      if (v === 1) {
        // negative decimal
        const choices = [0.5,1.5,2.5,3.7,0.3,4.2,1.25,2.75,0.75,1.1,2.2,3.3,5.5];
        const x = pick(choices);
        return absQ(`-${x}`, `-${x}`, x, String(x), String(x));
      }
      if (v === 2) {
        // negative square root
        const r = pick(NON_SQ);
        return absQ(`-\\sqrt{${r}}`, `-√${r}`, Math.sqrt(r), `\\sqrt{${r}}`, `√${r}`);
      }
      // positive square root (|√r| = √r)
      const r = pick(NON_SQ);
      return absQ(`\\sqrt{${r}}`, `√${r}`, Math.sqrt(r), `\\sqrt{${r}}`, `√${r}`);
    }

    // medium / challenge
    const v = rand(0, 2);
    if (v === 0) {
      // |√a - n|
      const a = pick(NON_SQ.filter(x => x <= 30));
      const n = rand(1, 5);
      const val = Math.sqrt(a) - n;
      const exprL = `\\sqrt{${a}} - ${n}`;
      const exprD = `√${a} - ${n}`;
      const sqA = Math.sqrt(a).toFixed(2).replace('.', ',');
      if (val > 0) {
        return absQ(exprL, exprD, val, `\\sqrt{${a}} - ${n}`, `√${a} - ${n}`,
          `Zauważ, że √${a} ≈ ${sqA}, a ${n} = ${n}`);
      } else {
        return absQ(exprL, exprD, -val, `${n} - \\sqrt{${a}}`, `${n} - √${a}`,
          `Zauważ, że √${a} ≈ ${sqA}, a ${n} = ${n}`);
      }
    }
    if (v === 1) {
      // |π - √a|
      const a = pick([2,3,5,6,7,8,9,10,11,12]);
      const val = Math.PI - Math.sqrt(a);
      const exprL = `\\pi - \\sqrt{${a}}`;
      const exprD = `π - √${a}`;
      const sqA = Math.sqrt(a).toFixed(2).replace('.', ',');
      if (val > 0) {
        return absQ(exprL, exprD, val, `\\pi - \\sqrt{${a}}`, `π - √${a}`,
          `Zauważ, że π ≈ 3,14, a √${a} ≈ ${sqA}`);
      } else {
        return absQ(exprL, exprD, -val, `\\sqrt{${a}} - \\pi`, `√${a} - π`,
          `Zauważ, że π ≈ 3,14, a √${a} ≈ ${sqA}`);
      }
    }
    // |√a - √b|
    const a = pick(NON_SQ.filter(x => x <= 20));
    let b = pick(NON_SQ.filter(x => x <= 20 && x !== a));
    const val = Math.sqrt(a) - Math.sqrt(b);
    const exprL = `\\sqrt{${a}} - \\sqrt{${b}}`;
    const exprD = `√${a} - √${b}`;
    const sqA = Math.sqrt(a).toFixed(2).replace('.', ',');
    const sqB = Math.sqrt(b).toFixed(2).replace('.', ',');
    if (val > 0) {
      return absQ(exprL, exprD, val, `\\sqrt{${a}} - \\sqrt{${b}}`, `√${a} - √${b}`,
        `Zauważ, że √${a} ≈ ${sqA}, a √${b} ≈ ${sqB}`);
    } else {
      return absQ(exprL, exprD, -val, `\\sqrt{${b}} - \\sqrt{${a}}`, `√${b} - √${a}`,
        `Zauważ, że √${a} ≈ ${sqA}, a √${b} ≈ ${sqB}`);
    }
  },

  'Własności działań': (d) => {
    const easy = d === 'easy';
    for (let attempt = 0; attempt < 30; attempt++) {
      const subtype = rand(0, 7);

      // 1. addComplement: 27+18 = 27+3+15 = 30+15
      if (subtype === 0) {
        const a = easy ? rand(11, 50) : rand(21, 150);
        const uA = a % 10;
        const add1 = uA === 0 ? 10 : (10 - uA); // dopełnienie do pełnej dziesiątki
        const bMax = easy ? 49 : 99;
        const b = rand(add1 + 1, bMax);
        if (b <= add1 || b > bMax) continue;
        const add2 = b - add1;
        const mid = a + add1;
        return {
          q: `${a} + ${b} = ?`, a: a + b,
          hint: `Zauważ, że ${b} to ${add1} i ${add2}`,
          hint2: `${a}+${add1}+${add2} = ${mid}+${add2} = ?`
        };
      }

      // 2. subComplement: dwa sposoby (wybierz swój)
      if (subtype === 1) {
        const b = easy ? rand(12, 59) : rand(12, 199);
        if (b % 10 === 0) continue;
        const a = easy ? rand(b + 1, b + 60) : rand(b + 1, b + 200);

        const bRound = Math.floor(b / 10) * 10;
        const bUnits = b % 10;
        const midA = a - bRound;

        const uA = a % 10;
        const hasB = uA !== 0 && b > uA;

        // hint1: krótka wskazówka o rozkładzie
        const hint1 = hasB
          ? `Sposób A: ${b} = ${bRound}+${bUnits}  lub  Sposób B: ${a}−${uA} = ${a - uA}`
          : `Zauważ, że ${b} to ${bRound} i ${bUnits}`;

        // hint2: pełna rozpiska kroków
        const lineA = `A: ${a}−${bRound}−${bUnits} = ${midA}−${bUnits} = ?`;
        const lineB = hasB ? `B: ${a}−${uA}−${b - uA} = ${a - uA}−${b - uA} = ?` : null;
        const hint2 = lineB ? `${lineA}\n${lineB}` : lineA;

        return { q: `${a} − ${b} = ?`, a: a - b, hint: hint1, hint2 };
      }

      // 3. mulDistrib: 3×27 = 3×20+3×7
      if (subtype === 2) {
        const n = easy ? rand(2, 9) : rand(2, 12);
        let m = easy ? rand(12, 59) : rand(12, 99);
        if (m % 10 === 0) m += rand(1, 9);
        if (m > (easy ? 59 : 99)) continue;
        const mTens = Math.floor(m / 10) * 10;
        const mUnits = m % 10;
        const p1 = n * mTens, p2 = n * mUnits;
        return {
          q: `${n} × ${m} = ?`, a: n * m,
          hint: `Zauważ, że ${m} to ${mTens} i ${mUnits}`,
          hint2: `${n}×${mTens} + ${n}×${mUnits} = ${p1}+${p2} = ?`
        };
      }

      // 4. mulNear: 75×9 = 75×10−75
      if (subtype === 3) {
        const a = easy ? rand(11, 30) : rand(11, 99);
        const rounds = easy ? [10, 20, 30] : [10, 20, 30, 40, 50, 100];
        const r = rounds[rand(0, rounds.length - 1)];
        const sign = Math.random() < 0.5 ? -1 : 1;
        const b = r + sign;
        if (b <= 1) continue;
        const direction = sign === -1 ? 'mniej' : 'więcej';
        const op = sign === -1 ? '−' : '+';
        const p1 = a * r;
        return {
          q: `${a} × ${b} = ?`, a: a * b,
          hint: `Zauważ, że ${b} to o 1 ${direction} niż ${r}`,
          hint2: `${a}×${r} ${op} ${a} = ${p1} ${op} ${a} = ?`
        };
      }

      // 5. divDistrib: 138÷3 = (120+18)÷3 = 40+6
      if (subtype === 4) {
        const n = rand(2, easy ? 5 : 9);
        const q1 = rand(2, easy ? 5 : 9) * 10;
        const q2 = rand(1, 9);
        const m1 = q1 * n, m2 = q2 * n;
        const m = m1 + m2;
        return {
          q: `${m} ÷ ${n} = ?`, a: q1 + q2,
          hint: `Zauważ, że ${m} to ${m1} i ${m2}`,
          hint2: `${m1}÷${n} + ${m2}÷${n} = ${q1}+${q2} = ?`
        };
      }

      // 6. doubleHalf: 16×25 = 8×50 = 4×100  (podziel na pół, podwój)
      if (subtype === 5) {
        const useTwentyFive = Math.random() < 0.6;
        if (useTwentyFive) {
          // a musi być podzielne przez 4
          const k = easy ? rand(2, 8) : rand(2, 20);
          const a = k * 4, b = 25;
          const mid1a = a / 2, mid2a = a / 4;
          return {
            q: `${a} × ${b} = ?`, a: a * b,
            hint: `${a}×25 = ${mid1a}×50 (podziel ${a} na pół, pomnóż 25 × 2)`,
            hint2: `${mid1a}×50 = ${mid2a}×100 = ?`
          };
        } else {
          // a musi być parzyste, b=50
          const k = easy ? rand(2, 10) : rand(2, 25);
          const a = k * 2, b = 50;
          const mid1a = a / 2;
          return {
            q: `${a} × ${b} = ?`, a: a * b,
            hint: `${a}×50 = ${mid1a}×100 (podziel ${a} na pół, pomnóż 50 × 2)`,
            hint2: `${mid1a}×100 = ?`
          };
        }
      }

      // 7. addCompensate: 48+37 = 50+35 (zaokrąglij i wyrównaj)
      if (subtype === 6) {
        const uA = rand(6, 9);
        const aTens = easy ? rand(1, 4) * 10 : rand(1, 12) * 10;
        const a = aTens + uA;
        const complement = 10 - uA;
        const aRound = a + complement;
        const bMin = complement + 1;
        const bMax = easy ? 30 : 80;
        if (bMin > bMax) continue;
        const b = rand(bMin, bMax);
        const bAdj = b - complement;
        return {
          q: `${a} + ${b} = ?`, a: a + b,
          hint: `Zaokrąglij ${a} do ${aRound} (+${complement}), od ${b} odejmij ${complement}`,
          hint2: `${aRound} + ${bAdj} = ?`
        };
      }

      // 8. mulBy5: 36×5 = 36×10÷2 = 360÷2
      {
        const a = easy ? rand(2, 20) : rand(10, 100);
        const tenTimes = a * 10;
        return {
          q: `${a} × 5 = ?`, a: a * 5,
          hint: `${a} × 5 = ${a} × 10 ÷ 2`,
          hint2: `${tenTimes} ÷ 2 = ?`
        };
      }
    }
    // fallback
    return { q: `24 + 8 = ?`, a: 32 };
  },

  'Porównywanie liczb całkowitych': (d) => {
    const easy = d === 'easy';
    if (easy) {
      const type = rand(0, 2);
      let a, b;
      if (type === 0) { a = rand(1, 100); b = rand(1, 100); }
      else if (type === 1) { a = rand(-50, -1); b = rand(1, 50); if (Math.random() < 0.5) [a, b] = [b, a]; }
      else { a = rand(-50, -1); b = rand(-50, -1); }
      if (a === b) b = b >= 0 ? b + 1 : b - 1;
      const answer = a < b ? '<' : a > b ? '>' : '=';
      let hint = null;
      if ((a < 0) !== (b < 0)) hint = 'Liczba ujemna jest zawsze mniejsza od dodatniej';
      else if (a < 0 && b < 0) hint = 'Im większa wartość bezwzględna, tym mniejsza liczba ujemna (np. −8 < −3)';
      return { type: 'int_compare', a, b, answer, hint };
    } else {
      const count = rand(4, 5);
      const nums = [];
      const used = new Set();
      while (nums.length < count) {
        const n = rand(-15, 15);
        if (!used.has(n)) { used.add(n); nums.push(n); }
      }
      const direction = Math.random() < 0.5 ? 'asc' : 'desc';
      const sorted = [...nums].sort((x, y) => direction === 'asc' ? x - y : y - x);
      return {
        type: 'int_order', nums, direction, sorted,
        answer: sorted.join(', '),
        hint: 'Liczby ujemne są mniejsze od zera — im dalej od zera w lewo, tym mniejsza'
      };
    }
  },

  // ── POJĘCIE LOGARYTMU ────────────────────────────────────────
  'Pojęcie logarytmu': (d) => {
    const SUB = s => String(s).replace(/./g, c => '₀₁₂₃₄₅₆₇₈₉'['0123456789'.indexOf(c)] ?? c);
    const isEasy = d === 'easy';

    const bases  = isEasy ? [2, 3, 10] : [2, 3, 4, 5, 10];
    const maxExp = isEasy ? 4 : 6;
    const b      = bases[rand(0, bases.length - 1)];
    const logStr = b => `log${SUB(b)}`;

    if (isEasy || Math.random() < 0.5) {
      // Standardowe: log_b(b^n) = n
      const n   = rand(0, maxExp);
      const arg = n === 0 ? 1 : b ** n;
      return {
        q:     `${logStr(b)}(${arg}) = ?`,
        a:     n,
        hint:  n === 0 ? `Logarytm jedynki wynosi zawsze 0` : `${b}^? = ${arg}`,
        hint2: n === 0 ? `${b}^0 = 1` : `${b}^${n} = ${arg}`,
      };
    }

    // Średni — warianty odwrócone
    const variant = rand(0, 1);
    if (variant === 0) {
      // log_b(?) = n  →  znajdź argument
      const n   = rand(1, maxExp);
      const arg = b ** n;
      return {
        q:    `${logStr(b)}(?) = ${n}`,
        a:    arg,
        hint: `${b}^${n} = ?`,
      };
    } else {
      // log_?(arg) = n  →  znajdź podstawę
      const n    = rand(2, 4);
      const pool = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x ** n <= 100000);
      const base = pool[rand(0, pool.length - 1)];
      const arg  = base ** n;
      return {
        q:    `log${SUB('?')}(${arg}) = ${n}`,
        a:    base,
        hint: `?^${n} = ${arg}`,
      };
    }
  },

  // ── SYSTEMY LICZBOWE ─────────────────────────────────────────
  'Systemy liczbowe': (d) => {
    const isEasy = d === 'easy';

    const VALS = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const SYMS = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];

    function toRoman(n) {
      let r = '';
      for (let i = 0; i < VALS.length; i++)
        while (n >= VALS[i]) { r += SYMS[i]; n -= VALS[i]; }
      return r;
    }

    // Rozkład na składniki z symbolami: 199 → "C = 100, XC = 90, IX = 9"
    function breakdown(n) {
      const parts = []; let rem = n;
      for (let i = 0; i < VALS.length; i++) {
        let count = 0;
        while (rem >= VALS[i]) { count++; rem -= VALS[i]; }
        if (count > 0) {
          const sym = SYMS[i].length === 1 ? SYMS[i].repeat(count) : SYMS[i];
          parts.push(`${sym} = ${VALS[i] * count}`);
        }
      }
      return parts.join(', ');
    }

    // Rozkład liczbowy: 199 → "199 = 100 + 90 + 9"
    function arabicBreakdown(n) {
      const parts = []; let rem = n;
      for (let i = 0; i < VALS.length; i++) {
        let count = 0;
        while (rem >= VALS[i]) { count++; rem -= VALS[i]; }
        if (count > 0) parts.push(VALS[i] * count);
      }
      return `${n} = ${parts.join(' + ')}`;
    }

    const SYMBOLS_HINT = `I=1, V=5, X=10, L=50, C=100, D=500, M=1000\nSubtraktywne: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900`;

    const num   = isEasy ? rand(1, 69) : rand(1, 3999);
    const roman = toRoman(num);

    if (rand(0, 1) === 0) {
      // Arabski → Rzymski (odpowiedź tekstowa)
      // hint1: rozkład liczbowy (bez podpowiedzi symboli)
      // hint2: rozkład z symbolami (prawie daje odpowiedź)
      return {
        q:    `Zapisz liczbę ${num} cyframi rzymskimi`,
        a:    roman,
        hint:  arabicBreakdown(num),
        hint2: breakdown(num),
      };
    } else {
      // Rzymski → Arabski (odpowiedź liczbowa)
      // hint1: rozkład z symbolami
      // hint2: tabelka symboli (przypomnienie wartości)
      return {
        q:    `Ile wynosi ${roman}?`,
        a:    num,
        hint:  breakdown(num),
        hint2: SYMBOLS_HINT,
      };
    }
  },

  // ── DZIAŁANIA NA LICZBACH CAŁKOWITYCH ────────────────────────
  'Działania na liczbach całkowitych': (d) => {
    const isEasy = d === 'easy';

    // Ujemne w nawiasach; dodatnie bez (używaj do 2. argumentu i mnożenia/dzielenia)
    function fmt(n) { return n < 0 ? `(${n})` : `${n}`; }
    // Niezerowa losowa liczba całkowita
    function ri(lo, hi) { let v = 0; while (v === 0) v = rand(lo, hi); return v; }
    // Superskrypt unicode (obsługuje wielocyfrowe, np. 10 → ¹⁰)
    function sup(n) { return String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join(''); }

    const SIGN_HINT = '(+)×(+) = +,   (−)×(−) = +,   (+)×(−) = −';

    if (isEasy) {
      const type = rand(0, 3); // 0=add, 1=sub, 2=mul, 3=div
      let a, b, ans, q, hint, hint2;

      if (type === 0) {
        // Dodawanie – wszystkie kombinacje znaków
        a = rand(-12, 12); if (a === 0) a = -5;
        b = rand(-12, 12); if (b === 0) b = 4;
        ans = a + b;
        // Pierwsza liczba bez nawiasów (nawet ujemna), druga w nawiasach jeśli ujemna
        q = `${a} + ${fmt(b)}`;
        if (a < 0 && b < 0) {
          hint  = 'Suma dwóch ujemnych — dodaj moduły i daj minus';
          hint2 = `|${a}| + |${b}| = ${Math.abs(a) + Math.abs(b)}, wynik: −${Math.abs(a) + Math.abs(b)}`;
        } else if (a < 0 || b < 0) {
          hint  = 'Różne znaki — odejmij mniejszy moduł od większego; znak jak ten z większym modułem';
          hint2 = `|${a}| = ${Math.abs(a)},  |${b}| = ${Math.abs(b)} → wynik: ${ans}`;
        } else {
          hint  = 'Oba składniki dodatnie';
          hint2 = `${a} + ${b} = ${ans}`;
        }

      } else if (type === 1) {
        // Odejmowanie – wszystkie kombinacje
        a = rand(-12, 12); if (a === 0) a = 6;
        b = rand(-12, 12); if (b === 0) b = -3;
        ans = a - b;
        q = `${a} − ${fmt(b)}`;
        if (b < 0) {
          hint  = 'Odejmowanie ujemnej = dodawanie jej wartości bezwzględnej';
          hint2 = `${a} − (${b}) = ${a} + ${Math.abs(b)} = ${ans}`;
        } else if (a < 0) {
          hint  = `Obie liczby mają różne znaki — wynik bardziej ujemny`;
          hint2 = `${a} − ${b} = ${ans}`;
        } else {
          hint  = ans < 0 ? `${a} < ${b}, więc wynik jest ujemny` : null;
          hint2 = null;
        }

      } else if (type === 2) {
        // Mnożenie – wszystkie kombinacje znaków
        a = ri(-9, 9);
        b = ri(-9, 9);
        ans = a * b;
        q = `${fmt(a)} × ${fmt(b)}`;
        hint  = SIGN_HINT;
        hint2 = `${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(ans)},  znak: ${ans >= 0 ? '+' : '−'}`;

      } else {
        // Dzielenie – wynik całkowity, wszystkie kombinacje znaków
        const res = ri(-6, 6);
        b = ri(-6, 6);
        a = b * res;
        ans = res; // a / b = res
        q = `${fmt(a)} ÷ ${fmt(b)}`;
        hint  = SIGN_HINT;
        hint2 = `${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(ans)},  znak: ${ans >= 0 ? '+' : '−'}`;
      }

      return { q: `${q} = ?`, a: ans, hint, hint2 };
    }

    // ── MEDIUM – 9 typów ─────────────────────────────────────
    const type = rand(0, 8);
    let a, b, c, w, ans, q, hint, hint2;

    if (type === 0) {
      // Potęga dowolnej ujemnej podstawy (-2 do -5), wykładnik 2–4
      const base = ri(-5, -2);
      const exp  = rand(2, 4);
      ans = Math.pow(base, exp);
      q     = `(${base})${sup(exp)}`;
      const parStr = exp % 2 === 0 ? 'parzysty → wynik +' : 'nieparzysty → wynik −';
      hint  = `Wykładnik ${parStr}`;
      hint2 = `${Array(exp).fill(`(${base})`).join(' × ')} = ${ans}`;

    } else if (type === 1) {
      // Potęgi (−2): wykładnik 0–8 — ważny wzorzec!
      const exp = rand(0, 8);
      ans = Math.pow(-2, exp);
      q     = `(−2)${sup(exp)}`;
      const pow2 = Math.pow(2, exp);
      const parStr = exp % 2 === 0 ? 'parzysty → wynik +' : 'nieparzysty → wynik −';
      hint  = `2${sup(exp)} = ${pow2},  wykładnik ${parStr}`;
      hint2 = exp <= 3
        ? `${Array(exp).fill('(−2)').join(' × ')}${exp === 0 ? ' (def.)' : ''} = ${ans}`
        : `2${sup(exp)} = ${pow2},  znak: ${ans > 0 ? '+' : '−'} → wynik: ${ans}`;

    } else if (type === 2) {
      // a × (b + c) — rozdzielność z dodawaniem
      a = ri(-6, 6);
      b = rand(-6, 6); if (b === 0) b = -2;
      c = rand(-6, 6); if (c === 0) c = 3;
      const inner2 = b + c;
      ans = a * inner2;
      q     = `${fmt(a)} × (${b} + ${fmt(c)})`;
      hint  = `Najpierw oblicz nawiasie: ${b} + ${fmt(c)}`;
      hint2 = `= ${inner2},  więc ${fmt(a)} × ${fmt(inner2)} = ${ans}`;

    } else if (type === 3) {
      // a × (b − c) — rozdzielność z odejmowaniem
      a = ri(-6, 6);
      b = rand(-6, 6); if (b === 0) b = 5;
      c = rand(-6, 6); if (c === 0) c = -2;
      const inner3 = b - c;
      ans = a * inner3;
      q     = `${fmt(a)} × (${b} − ${fmt(c)})`;
      hint  = `Najpierw oblicz nawiasie: ${b} − ${fmt(c)}`;
      hint2 = `= ${inner3},  więc ${fmt(a)} × ${fmt(inner3)} = ${ans}`;

    } else if (type === 4) {
      // −(a − b) — opuszczanie nawiasu poprzedzonego minusem
      a = rand(1, 8); // a > 0 dla czytelności
      b = rand(-8, 8); if (b === 0) b = -3;
      ans = -(a - b); // = -a + b
      q     = `−(${a} − ${fmt(b)})`;
      hint  = 'Minus przed nawiasem zmienia znaki wszystkich składników';
      hint2 = `= ${-a} + ${fmt(b)} = ${ans}`;

    } else if (type === 5) {
      // a + b × c — kolejność działań
      a = rand(-8, 8); if (a === 0) a = -3;
      b = ri(-5, 5);
      c = ri(-5, 5);
      const prod5 = b * c;
      ans = a + prod5;
      q     = `${a} + ${fmt(b)} × ${fmt(c)}`;
      hint  = 'Kolejność działań: najpierw mnożenie!';
      hint2 = `${fmt(b)} × ${fmt(c)} = ${fmt(prod5)},  następnie ${a} + ${fmt(prod5)} = ${ans}`;

    } else if (type === 6) {
      // a × b − c × d — dwa iloczyny
      a = ri(-5, 5); b = ri(-5, 5);
      c = ri(-5, 5); w = ri(-5, 5);
      const p1 = a * b, p2 = c * w;
      ans = p1 - p2;
      q     = `${fmt(a)} × ${fmt(b)} − ${fmt(c)} × ${fmt(w)}`;
      hint  = 'Policz osobno każdy iloczyn, potem odejmij';
      hint2 = `${fmt(a)}×${fmt(b)} = ${fmt(p1)},  ${fmt(c)}×${fmt(w)} = ${fmt(p2)},  wynik: ${p1} − ${fmt(p2)} = ${ans}`;

    } else if (type === 7) {
      // (a + b)² — potęgowanie sumy
      a = rand(-5, 5); if (a === 0) a = 2;
      b = rand(-5, 5); if (b === 0) b = -3;
      const sum7 = a + b;
      ans = sum7 * sum7;
      q     = `(${a} + ${fmt(b)})${sup(2)}`;
      hint  = `Najpierw oblicz sumę w nawiasie: ${a} + ${fmt(b)}`;
      hint2 = `= ${sum7},  następnie (${sum7})${sup(2)} = ${ans}`;

    } else {
      // fmt(base)^2 + b — potęga potem dodawanie
      const base = ri(-6, 6);
      b = rand(-10, 10); if (b === 0) b = 5;
      const pw = base * base;
      ans = pw + b;
      q     = `${fmt(base)}${sup(2)} + ${fmt(b)}`;
      hint  = `Najpierw policz potęgę: ${fmt(base)}${sup(2)}`;
      hint2 = `= ${pw},  następnie ${pw} + ${fmt(b)} = ${ans}`;
    }

    return { q: `${q} = ?`, a: ans, hint, hint2 };
  },

  // ── WŁASNOŚCI LOGARYTMÓW ─────────────────────────────────────
  'Własności logarytmów': (d) => {
    const SUB    = s => String(s).replace(/./g, c => '₀₁₂₃₄₅₆₇₈₉'['0123456789'.indexOf(c)] ?? c);
    const logStr = b => `log${SUB(b)}`;
    const isEasy = d === 'easy';

    const bases = isEasy ? [2, 3, 10] : [2, 3, 5, 10];
    const b     = bases[rand(0, bases.length - 1)];

    // Pary gdzie żaden składnik NIE jest potęgą podstawy → wzór obowiązkowy
    const trickyProduct = [
      { base: 10, a: 2,   b: 5,   ans: 1 },
      { base: 10, a: 4,   b: 25,  ans: 2 },
      { base: 10, a: 8,   b: 125, ans: 3 },
      { base: 10, a: 20,  b: 5,   ans: 2 },
      { base: 10, a: 50,  b: 2,   ans: 2 },
      { base: 10, a: 40,  b: 25,  ans: 3 },
      { base: 6,  a: 2,   b: 3,   ans: 1 },
      { base: 6,  a: 4,   b: 9,   ans: 2 },
      { base: 6,  a: 12,  b: 3,   ans: 2 },
      { base: 6,  a: 8,   b: 27,  ans: 3 },  // 8×27=216=6³
      { base: 6,  a: 18,  b: 2,   ans: 2 },  // 18×2=36=6²
      { base: 12, a: 3,   b: 4,   ans: 1 },
      { base: 12, a: 2,   b: 6,   ans: 1 },  // 2×6=12
      { base: 12, a: 9,   b: 16,  ans: 2 },  // 9×16=144=12²
      { base: 12, a: 4,   b: 36,  ans: 2 },  // 4×36=144=12²
      { base: 14, a: 2,   b: 7,   ans: 1 },  // 2×7=14
      { base: 15, a: 3,   b: 5,   ans: 1 },
      { base: 15, a: 9,   b: 25,  ans: 2 },  // 9×25=225=15²
      { base: 15, a: 45,  b: 5,   ans: 2 },  // 45×5=225=15²
      { base: 21, a: 3,   b: 7,   ans: 1 },  // 3×7=21
      { base: 21, a: 9,   b: 49,  ans: 2 },  // 9×49=441=21²
      { base: 35, a: 5,   b: 7,   ans: 1 },  // 5×7=35
      { base: 35, a: 25,  b: 49,  ans: 2 },  // 25×49=1225=35²
    ];
    const trickyQuotient = [
      { base: 10, a: 20,  b: 2,   ans: 1 },
      { base: 10, a: 50,  b: 5,   ans: 1 },
      { base: 10, a: 200, b: 2,   ans: 2 },
      { base: 10, a: 500, b: 5,   ans: 2 },
      { base: 10, a: 250, b: 25,  ans: 1 },
      { base: 6,  a: 18,  b: 3,   ans: 1 },
      { base: 6,  a: 12,  b: 2,   ans: 1 },
      { base: 6,  a: 54,  b: 9,   ans: 1 },  // 54÷9=6
      { base: 6,  a: 24,  b: 4,   ans: 1 },  // 24÷4=6
      { base: 6,  a: 72,  b: 2,   ans: 2 },
      { base: 12, a: 36,  b: 3,   ans: 1 },
      { base: 12, a: 24,  b: 2,   ans: 1 },
      { base: 12, a: 48,  b: 4,   ans: 1 },  // 48÷4=12
      { base: 12, a: 72,  b: 6,   ans: 1 },  // 72÷6=12
      { base: 14, a: 28,  b: 2,   ans: 1 },  // 28÷2=14
      { base: 14, a: 98,  b: 7,   ans: 1 },  // 98÷7=14
      { base: 15, a: 45,  b: 3,   ans: 1 },  // 45÷3=15
      { base: 15, a: 75,  b: 5,   ans: 1 },  // 75÷5=15
      { base: 21, a: 63,  b: 3,   ans: 1 },  // 63÷3=21
      { base: 21, a: 147, b: 7,   ans: 1 },  // 147÷7=21
      { base: 35, a: 175, b: 5,   ans: 1 },  // 175÷5=35
      { base: 35, a: 245, b: 7,   ans: 1 },  // 245÷7=35
    ];

    // Zadania ze zmianą podstawy  (ans może być ułamkiem dziesiętnym)
    const cobList = [
      // Wyniki całkowite
      { base: 4,   arg: 16,   ans: 2,    c: 2 },
      { base: 4,   arg: 64,   ans: 3,    c: 2 },
      { base: 4,   arg: 256,  ans: 4,    c: 2 },
      { base: 8,   arg: 64,   ans: 2,    c: 2 },
      { base: 8,   arg: 512,  ans: 3,    c: 2 },
      { base: 9,   arg: 81,   ans: 2,    c: 3 },
      { base: 9,   arg: 729,  ans: 3,    c: 3 },
      { base: 27,  arg: 729,  ans: 2,    c: 3 },
      { base: 25,  arg: 625,  ans: 2,    c: 5 },
      { base: 16,  arg: 256,  ans: 2,    c: 2 },
      { base: 16,  arg: 4096, ans: 3,    c: 2 },
      { base: 125, arg: 3125, ans: 2,    c: 5 },
      // Wyniki = 1/2
      { base: 4,   arg: 2,    ans: 0.5,  c: 2 },
      { base: 9,   arg: 3,    ans: 0.5,  c: 3 },
      { base: 25,  arg: 5,    ans: 0.5,  c: 5 },
      { base: 16,  arg: 4,    ans: 0.5,  c: 2 },
      { base: 100, arg: 10,   ans: 0.5,  c: 10 },
      // Wyniki = 3/2
      { base: 4,   arg: 8,    ans: 1.5,  c: 2 },
      { base: 9,   arg: 27,   ans: 1.5,  c: 3 },
      { base: 25,  arg: 125,  ans: 1.5,  c: 5 },
      { base: 16,  arg: 64,   ans: 1.5,  c: 2 },
      // Wyniki = 5/2
      { base: 4,   arg: 32,   ans: 2.5,  c: 2 },
      { base: 9,   arg: 243,  ans: 2.5,  c: 3 },
      // Wyniki = 1/4, 3/4, 5/4, 7/4
      { base: 16,  arg: 2,    ans: 0.25, c: 2 },
      { base: 16,  arg: 8,    ans: 0.75, c: 2 },
      { base: 16,  arg: 32,   ans: 1.25, c: 2 },
      { base: 16,  arg: 128,  ans: 1.75, c: 2 },
    ];

    // Pary gdzie argument NIE jest potęgą podstawy — wzór jest KONIECZNY
    // Iloczyny: a × b = prod (przynajmniej jedno z a,b nie jest potęgą podstawy)
    const forcedProdPairs = [
      { base: 10, a: 2,   b: 5   },  // 2×5=10
      { base: 10, a: 4,   b: 25  },  // 4×25=100
      { base: 10, a: 20,  b: 5   },  // 20×5=100
      { base: 10, a: 50,  b: 2   },  // 50×2=100
      { base: 2,  a: 3,   b: 8   },  // 3×8=24
      { base: 2,  a: 6,   b: 4   },  // 6×4=24
      { base: 2,  a: 3,   b: 16  },  // 3×16=48
      { base: 2,  a: 6,   b: 8   },  // 6×8=48
      { base: 3,  a: 2,   b: 9   },  // 2×9=18
      { base: 3,  a: 2,   b: 27  },  // 2×27=54
      { base: 3,  a: 6,   b: 9   },  // 6×9=54
    ];
    // Ilorazy: a / b = quot (quot jest potęgą podstawy, ale a lub b nie jest)
    const forcedQuotPairs = [
      { base: 10, a: 20,  b: 2,  quot: 10  },
      { base: 10, a: 50,  b: 5,  quot: 10  },
      { base: 10, a: 200, b: 2,  quot: 100 },
      { base: 10, a: 500, b: 5,  quot: 100 },
      { base: 2,  a: 24,  b: 3,  quot: 8   },
      { base: 2,  a: 12,  b: 3,  quot: 4   },
      { base: 2,  a: 48,  b: 3,  quot: 16  },
      { base: 2,  a: 48,  b: 6,  quot: 8   },
      { base: 3,  a: 18,  b: 2,  quot: 9   },
      { base: 3,  a: 54,  b: 2,  quot: 27  },
      { base: 3,  a: 54,  b: 6,  quot: 9   },
    ];

    // Łatwy: 0-3 (wymagają wzorów — argumenty NIE są potęgami podstawy)
    // Średni/Wyzwanie: 0-11 (w tym tricky i zmiana podstawy)
    const mode = isEasy ? rand(0, 3) : rand(0, 11);

    if (mode === 0) {
      // log_b(?) = log_b(a) + log_b(b)  →  ? = a×b  (nie da się bez wzoru)
      const p    = forcedProdPairs[rand(0, forcedProdPairs.length - 1)];
      const prod = p.a * p.b;
      return {
        q:     `${logStr(p.base)}(?) = ${logStr(p.base)}(${p.a}) + ${logStr(p.base)}(${p.b})`,
        a:     prod,
        hint:  `log(a) + log(b) = log(a · b)`,
        hint2: `${p.a} · ${p.b} = ${prod}`,
      };
    } else if (mode === 1) {
      // log_b(?) = log_b(a) − log_b(b)  →  ? = a/b  (nie da się bez wzoru)
      const p = forcedQuotPairs[rand(0, forcedQuotPairs.length - 1)];
      return {
        q:     `${logStr(p.base)}(?) = ${logStr(p.base)}(${p.a}) − ${logStr(p.base)}(${p.b})`,
        a:     p.quot,
        hint:  `log(a) − log(b) = log(a ÷ b)`,
        hint2: `${p.a} ÷ ${p.b} = ${p.quot}`,
      };
    } else if (mode === 2) {
      // log_b(a) + log_b(b) = ?  →  oblicz wynik (integer)
      const p    = trickyProduct[rand(0, trickyProduct.length - 1)];
      const prod = p.a * p.b;
      return {
        q:     `${logStr(p.base)}(${p.a}) + ${logStr(p.base)}(${p.b}) = ?`,
        a:     p.ans,
        hint:  `log(a) + log(b) = log(a · b) = ${logStr(p.base)}(${prod})`,
        hint2: `${p.base}^? = ${prod}`,
      };
    } else if (mode === 3) {
      // log_b(a) − log_b(b) = ?  →  oblicz wynik (integer)  ← przykład: log₂(24)−log₂(3)=3
      const p    = trickyQuotient[rand(0, trickyQuotient.length - 1)];
      const quot = p.a / p.b;
      return {
        q:     `${logStr(p.base)}(${p.a}) − ${logStr(p.base)}(${p.b}) = ?`,
        a:     p.ans,
        hint:  `log(a) − log(b) = log(a ÷ b) = ${logStr(p.base)}(${quot})`,
        hint2: `${p.base}^? = ${quot}`,
      };
    } else if (mode === 4) {
      // log_b(a) + log_b(?) = n  →  ? = b^n / a  (nie da się bez wzoru, nieznana liczba)
      const p    = trickyProduct[rand(0, trickyProduct.length - 1)];
      const prod = p.a * p.b; // = p.base ^ p.ans
      const hideB  = rand(0, 1) === 0;
      const known  = hideB ? p.a : p.b;
      const hidden = hideB ? p.b : p.a;
      return {
        q:     `${logStr(p.base)}(${known}) + ${logStr(p.base)}(?) = ${p.ans}`,
        a:     hidden,
        hint:  `log(a) + log(?) = n  →  log(a · ?) = n  →  a · ? = ${p.base}^${p.ans} = ${prod}`,
        hint2: `? = ${prod} ÷ ${known} = ${hidden}`,
      };
    } else if (mode === 5) {
      // log_b(a) − log_b(?) = n  →  ? = a / b^n  (nie da się bez wzoru)
      const p    = trickyQuotient[rand(0, trickyQuotient.length - 1)];
      const quot = p.a / p.b; // = p.base ^ p.ans
      return {
        q:     `${logStr(p.base)}(${p.a}) − ${logStr(p.base)}(?) = ${p.ans}`,
        a:     p.b,
        hint:  `log(a) − log(?) = n  →  log(a ÷ ?) = n  →  a ÷ ? = ${p.base}^${p.ans} = ${quot}`,
        hint2: `? = ${p.a} ÷ ${quot} = ${p.b}`,
      };
    } else if (mode === 6) {
      // log_b(a^k) = ?  gdzie b = a²  →  wynik ułamkowy (nie da się bez wzoru)
      const powerPairs = [
        { b: 4,   a: 2,  k: 3, ans: 1.5, ak: 8    },
        { b: 4,   a: 2,  k: 5, ans: 2.5, ak: 32   },
        { b: 4,   a: 2,  k: 7, ans: 3.5, ak: 128  },
        { b: 9,   a: 3,  k: 3, ans: 1.5, ak: 27   },
        { b: 9,   a: 3,  k: 5, ans: 2.5, ak: 243  },
        { b: 9,   a: 3,  k: 7, ans: 3.5, ak: 2187 },
        { b: 25,  a: 5,  k: 3, ans: 1.5, ak: 125  },
        { b: 25,  a: 5,  k: 5, ans: 2.5, ak: 3125 },
        { b: 100, a: 10, k: 3, ans: 1.5, ak: 1000 },
      ];
      const p      = powerPairs[rand(0, powerPairs.length - 1)];
      const decStr = String(p.ans).replace('.', ',');
      return {
        q:     `${logStr(p.b)}(${p.a}^${p.k}) = ?`,
        a:     p.ans,
        hint:  `log(a^k) = k · log(a)\n${p.k} · ${logStr(p.b)}(${p.a}) = ?`,
        hint2: `${logStr(p.b)}(${p.a}) = ½  (bo ${p.b} = ${p.a}²)\n${p.k} · ½ = ${decStr}`,
      };
    } else if (mode === 7 || mode === 10) {
      // Zmiana podstawy — wzór: log_a(b) = log_c(b) / log_c(a)
      // Tylko wpisy z ułamkowym wynikiem — wymagają wzoru, nie da się zgadnąć
      const cobFrac = cobList.filter(p => !Number.isInteger(p.ans));
      const p       = cobFrac[rand(0, cobFrac.length - 1)];
      const logCb   = Math.round(Math.log(p.base) / Math.log(p.c));
      const logCarg = Math.round(Math.log(p.arg)  / Math.log(p.c));
      const decStr  = String(p.ans).replace('.', ',');
      return {
        q:     `${logStr(p.base)}(${p.arg}) = ?`,
        a:     p.ans,
        hint:  `Wzór zamiany podstawy (c = ${p.c}):\n${logStr(p.base)}(${p.arg}) = ${logStr(p.c)}(${p.arg}) / ${logStr(p.c)}(${p.base})`,
        hint2: `= ${logCarg} / ${logCb} = ${decStr}`,
      };
    } else if (mode === 8) {
      // Trudny iloczyn — składniki NIE są potęgami podstawy
      const p = trickyProduct[rand(0, trickyProduct.length - 1)];
      return {
        q:     `${logStr(p.base)}(${p.a}) + ${logStr(p.base)}(${p.b}) = ?`,
        a:     p.ans,
        hint:  `log(a) + log(b) = log(a·b) = ${logStr(p.base)}(${p.a * p.b})`,
        hint2: `${p.base}^? = ${p.a * p.b}`,
      };
    } else if (mode === 11) {
      // Zmiana podstawy — uzupełnij brakujący argument we wzorze
      // Wzorzec: log_a(b) = log_c(?) / log_c(a)  lub  log_a(b) = log_c(b) / log_c(?)
      const configs = [
        { a: 2,  cs: [4, 8, 16] },
        { a: 3,  cs: [9, 27]    },
        { a: 5,  cs: [25]       },
        { a: 10, cs: [100]      },
      ];
      const cfg = configs[rand(0, configs.length - 1)];
      const a   = cfg.a;
      const c   = cfg.cs[rand(0, cfg.cs.length - 1)];
      // b – dowolna liczba różna od a i c (niekoniecznie potęga a – chodzi o wzór, nie obliczanie)
      const bPool = [2,3,4,5,6,7,8,9,10,11,12,13,15,17,20,25].filter(n => n !== a && n !== c);
      const b = bPool[rand(0, bPool.length - 1)];

      if (rand(0, 1) === 0) {
        // Brakuje licznika: log_a(b) = log_c(?) / log_c(a)
        const fracHtml = `<span class="log-frac"><span class="log-frac-num">${logStr(c)}(?)</span><span class="log-frac-den">${logStr(c)}(${a})</span></span>`;
        return {
          q:     `${logStr(a)}(${b}) = ${logStr(c)}(?) / ${logStr(c)}(${a})`,
          q_html: `${logStr(a)}(${b}) = ${fracHtml}`,
          a:     b,
          hint:  `Wzór: log_a(b) = log_c(b) / log_c(a)\nLicznik to logarytm z ARGUMENTU oryginalnego logarytmu`,
          hint2: `${logStr(a)}(${b}) = ${logStr(c)}(${b}) / ${logStr(c)}(${a})`,
        };
      } else {
        // Brakuje mianownika: log_a(b) = log_c(b) / log_c(?)
        const fracHtml = `<span class="log-frac"><span class="log-frac-num">${logStr(c)}(${b})</span><span class="log-frac-den">${logStr(c)}(?)</span></span>`;
        return {
          q:     `${logStr(a)}(${b}) = ${logStr(c)}(${b}) / ${logStr(c)}(?)`,
          q_html: `${logStr(a)}(${b}) = ${fracHtml}`,
          a:     a,
          hint:  `Wzór: log_a(b) = log_c(b) / log_c(a)\nMianownik to logarytm z PODSTAWY oryginalnego logarytmu`,
          hint2: `${logStr(a)}(${b}) = ${logStr(c)}(${b}) / ${logStr(c)}(${a})`,
        };
      }
    } else {
      // Trudny iloraz — składniki NIE są potęgami podstawy
      const p = trickyQuotient[rand(0, trickyQuotient.length - 1)];
      return {
        q:     `${logStr(p.base)}(${p.a}) − ${logStr(p.base)}(${p.b}) = ?`,
        a:     p.ans,
        hint:  `log(a) − log(b) = log(a÷b) = ${logStr(p.base)}(${p.a / p.b})`,
        hint2: `${p.base}^? = ${p.a / p.b}`,
      };
    }
  },

  // ── ŚREDNIA ARYTMETYCZNA ──────────────────────────────────────
  'Średnia arytmetyczna': (d) => {
    const isEasy = d === 'easy';

    if (isEasy) {
      // Oblicz średnią z 2–5 liczb (wynik całkowity)
      const count = rand(2, 5);
      const maxVal = 20;
      // Generuj count-1 liczb, dobierz ostatnią tak by średnia była całkowita
      let nums, mean;
      for (let attempt = 0; attempt < 100; attempt++) {
        const partial = Array.from({ length: count - 1 }, () => rand(1, maxVal));
        const targetMean = rand(3, 18);
        const last = targetMean * count - partial.reduce((s, n) => s + n, 0);
        if (last >= 1 && last <= maxVal) {
          nums = [...partial, last];
          // Losowo przetasuj kolejność
          for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
          }
          mean = targetMean;
          break;
        }
      }
      if (!nums) { nums = [4, 8]; mean = 6; } // fallback
      const sum = nums.reduce((s, n) => s + n, 0);
      return {
        q:     `Ile wynosi średnia arytmetyczna liczb: ${nums.join(', ')}?`,
        a:     mean,
        hint:  `Dodaj te liczby: ${nums.join(' + ')} = ${sum}`,
        hint2: `Podziel sumę przez liczbę elementów: ${sum} ÷ ${count} = ?`,
      };
    } else {
      const mode = rand(0, 1);

      if (mode === 0) {
        // Znając średnią i liczbę elementów — znajdź sumę
        const count = rand(3, 8);
        const mean  = rand(5, 50);
        const sum   = mean * count;
        return {
          q:    `Średnia arytmetyczna ${count} liczb wynosi ${mean}. Ile wynosi ich suma?`,
          a:    sum,
          hint: `suma = średnia × liczba elementów = ${mean} × ${count} = ?`,
        };
      } else {
        // Znając kilka liczb i średnią — znajdź brakującą
        const count = rand(3, 5);
        const mean  = rand(5, 25);
        const total = mean * count;
        let known, missing;
        for (let attempt = 0; attempt < 100; attempt++) {
          known = Array.from({ length: count - 1 }, () => rand(1, 30));
          missing = total - known.reduce((s, n) => s + n, 0);
          if (missing >= 1 && missing <= 40) break;
        }
        if (!missing || missing < 1) { known = [8, 12, 6]; mean = 9; missing = 10; }
        const knownSum = known.reduce((s, n) => s + n, 0);
        // Wstaw '?' w losowe miejsce
        const blankPos = rand(0, count - 1);
        const display  = [...known];
        display.splice(blankPos, 0, '?');
        return {
          q:     `Średnia arytmetyczna liczb ${display.join(', ')} wynosi ${mean}. Jaka jest brakująca liczba?`,
          a:     missing,
          hint:  `Suma wszystkich ${count} liczb = ${mean} × ${count} = ${total}`,
          hint2: `Suma znanych liczb to ${knownSum}`,
          hint3: `${total} − ${knownSum} = ${missing}`,
        };
      }
    }
  },
};

function computeCarries(numbers) {
  const answer = numbers.reduce((s, n) => s + n, 0);
  const cols = String(answer).length;
  const carries = [0];
  let carry = 0;
  for (let col = 0; col < cols; col++) {
    const colSum = carry + numbers.reduce((acc, n) => {
      const s = String(n), idx = s.length - 1 - col;
      return acc + (idx >= 0 ? parseInt(s[idx]) : 0);
    }, 0);
    carry = Math.floor(colSum / 10);
    carries[col + 1] = carry;
  }
  return carries;
}

function computeBorrows(a, b) {
  const cols = String(a).length;
  const borrows = [0];
  let borrow = 0;
  for (let col = 0; col < cols; col++) {
    const da = Math.floor(a / Math.pow(10, col)) % 10;
    const db = Math.floor(b / Math.pow(10, col)) % 10;
    const needBorrow = (da - borrow) < db;
    borrow = needBorrow ? 1 : 0;
    borrows[col + 1] = borrow; // pożyczamy Z kolumny col+1
  }
  return borrows;
}

function computeMulCarries(a, b) {
  const aStr = String(a);
  const carries = [0];
  let carry = 0;
  for (let col = 0; col < aStr.length; col++) {
    const da = parseInt(aStr[aStr.length - 1 - col]);
    const prod = da * b + carry;
    carry = Math.floor(prod / 10);
    carries[col + 1] = carry;
  }
  return carries;
}

function computeDivisionSteps(dividend, divisor) {
  const dividendStr = String(dividend);
  const steps = [];
  let current = 0;
  let started = false;
  for (let i = 0; i < dividendStr.length; i++) {
    const prev = current;
    current = current * 10 + parseInt(dividendStr[i]);
    // Akumuluj cyfry na początku aż chunk >= dzielnik (Polish school method)
    if (!started && current < divisor && i < dividendStr.length - 1) continue;
    const chunkDisplay = started
      ? String(prev) + dividendStr[i]   // reszta + ściągnięta cyfra
      : String(current);                // pierwszy chunk (może być wielocyfrowy)
    started = true;
    const qDigit = Math.floor(current / divisor);
    const product = qDigit * divisor;
    const rem = current - product;
    steps.push({ chunk: current, chunkDisplay, qDigit, product, remainder: rem, pos: i });
    current = rem;
  }
  return steps;
}

function buildWMHtml(q) {
  const [a, b] = q.numbers;
  const { answer, partials } = q;
  const isMulti = partials.length > 1;
  const cols = String(answer).length;
  const W = 44;

  const digitAt = (n, col) => {
    const s = String(n), idx = s.length - 1 - col;
    return idx >= 0 ? s[idx] : '';
  };

  let html = '';

  // Wiersz przeniesień (tylko dla łatwego — jednocyfrowy mnożnik)
  if (!isMulti && q.mulCarries) {
    html += `<div class="wa-row">`;
    html += `<div class="wa-cell wa-op-cell"></div>`;
    for (let c = cols - 1; c >= 0; c--) {
      const cv = q.mulCarries[c] || 0;
      html += `<div class="wa-cell wa-carry-cell">${c > 0 && cv > 0 ? cv : ''}</div>`;
    }
    html += `</div>`;
  }

  // Wiersz a
  html += `<div class="wa-row">`;
  html += `<div class="wa-cell wa-op-cell"></div>`;
  for (let c = cols - 1; c >= 0; c--) html += `<div class="wa-cell">${digitAt(a, c)}</div>`;
  html += `</div>`;

  // Wiersz × b
  html += `<div class="wa-row">`;
  html += `<div class="wa-cell wa-op-cell">×</div>`;
  for (let c = cols - 1; c >= 0; c--) html += `<div class="wa-cell">${digitAt(b, c)}</div>`;
  html += `</div>`;

  html += `<div class="wa-line" style="width:${(cols + 1) * W}px"></div>`;

  if (!isMulti) {
    // Łatwe: jeden rząd wyniku (reużywa wain- IDs i checkWrittenAddition)
    html += `<div class="wa-row wa-input-row">`;
    html += `<div class="wa-cell wa-op-cell"></div>`;
    for (let c = cols - 1; c >= 0; c--) {
      html += `<input class="wa-digit-input" id="wain-${c}" maxlength="1" type="text" inputmode="numeric"
        onkeydown="waHandleKey(event,${c},${cols - 1})" oninput="waHandleInput(event,${c},${cols - 1})">`;
    }
    html += `</div>`;
  } else {
    // Średnie/wyzwanie: rzędy iloczynów cząstkowych
    partials.forEach((partial, pIdx) => {
      const pStr = String(partial.value);
      const pLen = pStr.length;
      const s = partial.shift;
      const maxC = s + pLen - 1;
      html += `<div class="wa-row">`;
      html += `<div class="wa-cell wa-op-cell"></div>`;
      for (let c = cols - 1; c >= 0; c--) {
        if (c < s) {
          html += `<div class="wa-cell wm-placeholder">0</div>`;
        } else if (c <= maxC) {
          const pCol = c - s;
          html += `<input class="wa-digit-input" id="wmp-${pIdx}-${c}" maxlength="1" type="text" inputmode="numeric"
            onkeydown="wmHandleKey(event,${pIdx},${c},${maxC},${s},${partials.length})"
            oninput="wmHandleInput(event,${pIdx},${c},${maxC},${s},${partials.length})">`;
        } else {
          html += `<div class="wa-cell"></div>`;
        }
      }
      html += `</div>`;
    });

    html += `<div class="wa-line wm-second-line" style="width:${(cols + 1) * W}px"></div>`;

    // Rząd wyniku końcowego
    html += `<div class="wa-row wa-input-row">`;
    html += `<div class="wa-cell wa-op-cell"></div>`;
    for (let c = cols - 1; c >= 0; c--) {
      html += `<input class="wa-digit-input" id="wmr-${c}" maxlength="1" type="text" inputmode="numeric"
        onkeydown="wmResultHandleKey(event,${c},${cols - 1})"
        oninput="wmResultHandleInput(event,${c},${cols - 1})">`;
    }
    html += `</div>`;
  }

  return `<div class="wa-wrap"><div class="wa-block" style="width:${(cols + 1) * W}px">${html}</div></div>`;
}

function wmHandleInput(e, pIdx, col, maxC, minC, numPartials) {
  const v = e.target.value.replace(/[^0-9]/g, '');
  e.target.value = v.slice(-1);
  if (!v) return;
  if (col < maxC) {
    document.getElementById(`wmp-${pIdx}-${col + 1}`)?.focus();
  } else if (pIdx + 1 < numPartials) {
    const nextShift = state.currentQuestion.partials[pIdx + 1].shift;
    document.getElementById(`wmp-${pIdx + 1}-${nextShift}`)?.focus();
  } else {
    document.getElementById('wmr-0')?.focus();
  }
}

function wmHandleKey(e, pIdx, col, maxC, minC, numPartials) {
  if (e.key === 'Backspace' && !e.target.value && col > minC)
    document.getElementById(`wmp-${pIdx}-${col - 1}`)?.focus();
  if (e.key === 'ArrowLeft'  && col < maxC) { e.preventDefault(); document.getElementById(`wmp-${pIdx}-${col + 1}`)?.focus(); }
  if (e.key === 'ArrowRight' && col > minC) { e.preventDefault(); document.getElementById(`wmp-${pIdx}-${col - 1}`)?.focus(); }
  if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
}

function wmResultHandleInput(e, col, maxCol) {
  const v = e.target.value.replace(/[^0-9]/g, '');
  e.target.value = v.slice(-1);
  if (v && col < maxCol) document.getElementById(`wmr-${col + 1}`)?.focus();
}

function wmResultHandleKey(e, col, maxCol) {
  if (e.key === 'Backspace' && !e.target.value && col > 0)
    document.getElementById(`wmr-${col - 1}`)?.focus();
  if (e.key === 'ArrowLeft'  && col < maxCol) { e.preventDefault(); document.getElementById(`wmr-${col + 1}`)?.focus(); }
  if (e.key === 'ArrowRight' && col > 0)      { e.preventDefault(); document.getElementById(`wmr-${col - 1}`)?.focus(); }
  if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
}

function buildWAHtml(q) {
  const { numbers, answer } = q;
  const isSub = q.type === 'written-subtraction';
  const hints = isSub ? q.borrows : q.carries;
  const opSymbol = isSub ? '−' : '+';
  const cols = Math.max(String(answer).length, ...numbers.map(n => String(n).length));
  const ansStr = String(answer).padStart(cols, '0');
  const W = 44;

  const digitAt = (n, col) => {
    const s = String(n), idx = s.length - 1 - col;
    return idx >= 0 ? s[idx] : '';
  };

  // Hint row (przeniesienia lub pożyczki — ukryte do pierwszego błędu)
  let html = `<div class="wa-row">`;
  html += `<div class="wa-cell wa-op-cell"></div>`;
  for (let c = cols - 1; c >= 0; c--) {
    const hv = (hints && hints[c]) || 0;
    html += `<div class="wa-cell wa-carry-cell">${c > 0 && hv > 0 ? (isSub ? '↑' : hv) : ''}</div>`;
  }
  html += `</div>`;

  // Number rows
  numbers.forEach((num, idx) => {
    html += `<div class="wa-row">`;
    html += `<div class="wa-cell wa-op-cell">${idx === numbers.length - 1 ? opSymbol : ''}</div>`;
    for (let c = cols - 1; c >= 0; c--) html += `<div class="wa-cell">${digitAt(num, c)}</div>`;
    html += `</div>`;
  });

  // Line
  html += `<div class="wa-line" style="width:${(cols + 1) * W}px"></div>`;

  // Input row
  html += `<div class="wa-row wa-input-row">`;
  html += `<div class="wa-cell wa-op-cell"></div>`;
  for (let c = cols - 1; c >= 0; c--) {
    html += `<input class="wa-digit-input" id="wain-${c}" maxlength="1" type="text" inputmode="numeric"
      onkeydown="waHandleKey(event,${c},${cols - 1})" oninput="waHandleInput(event,${c},${cols - 1})">`;
  }
  html += `</div>`;

  return `<div class="wa-wrap"><div class="wa-block" style="width:${(cols + 1) * W}px">${html}</div></div>`;
}

function buildWDHtml(q) {
  const [dividend, divisor] = q.numbers;
  const { steps } = q;
  const k = steps.length;
  const n = String(dividend).length;
  const W = 44;
  const MINUS_W = 40;
  const totalW = n * W + MINUS_W;

  const digitSpans = (str) =>
    str.split('').map(ch => `<span class="wd-hint-digit">${ch}</span>`).join('');

  // Wiersz ilorazu: pola na cyfry NAD odpowiednimi cyframi dzielnej
  // Cyfra ilorazu steps[i].qDigit trafia nad kolumnę steps[i].pos w dzielnej
  const quotCells = Array(n).fill(null);
  steps.forEach((step, i) => { quotCells[step.pos] = i; });

  let quotRowHtml = `<div class="wd-quot-row">`;
  quotRowHtml += `<span class="wd-mc-ph"></span>`; // 40px – wyrównanie z kolumną minusów
  for (let col = 0; col < n; col++) {
    const idx = quotCells[col];
    if (idx !== null) {
      quotRowHtml += `<input class="wa-digit-input" id="wdq-${idx}" maxlength="1" type="text" inputmode="numeric"
        onkeydown="wdHandleKey(event,${idx},${k - 1})" oninput="wdHandleInput(event,${idx},${k - 1})">`;
    } else {
      quotRowHtml += `<span class="wd-d-ph"></span>`;
    }
  }
  quotRowHtml += `</div>`;

  let html = `<div class="wd-wrap">`;
  html += `<p class="wd-paper-tip">✏️ Tutaj <strong>NA PEWNO</strong> przyda ci się kartka i długopis!</p>`;
  html += `<div class="wd-slupek">`;

  // GÓRNA CZĘŚĆ: iloraz + kreska (szerokość lewej kolumny)
  html += `<div class="wd-quot-section" style="width:${totalW}px">`;
  html += quotRowHtml;
  html += `<div class="wd-quot-bar"></div>`;
  html += `</div>`;

  // DOLNA CZĘŚĆ: dzielna + separator + dzielnik, poniżej kroki
  html += `<div class="wd-work-section">`;

  // Lewa kolumna: dzielna + kroki (podpowiedź)
  html += `<div class="wd-col-left" style="width:${totalW}px">`;
  html += `<div class="wd-hint-row wd-dividend-row" style="padding-right:0">${digitSpans(String(dividend))}</div>`;
  html += `<div id="wd-steps"></div>`;
  html += `</div>`;

  // Separator pionowy
  html += `<div class="wd-vsep"></div>`;

  // Prawa kolumna: dzielnik (wyrównany z wierszem dzielnej)
  html += `<div class="wd-col-right">`;
  html += `<div class="wd-divisor-txt">${divisor}</div>`;
  html += `</div>`;

  html += `</div>`; // end wd-work-section
  html += `</div>`; // end wd-slupek
  html += `</div>`; // end wd-wrap
  return html;
}

function buildWDHintHtml(q) {
  const { steps } = q;
  const n = String(q.numbers[0]).length;
  const W = 44;

  const digitSpans = (str, extraClass = '') =>
    str.split('').map(ch => `<span class="wd-hint-digit${extraClass ? ' ' + extraClass : ''}">${ch}</span>`).join('');

  // Buduje same kroki słupka (bez dzielnej – ona jest już widoczna w głównym układzie)
  // Zaczyna od −iloczyn dla kroku 0, potem kreska, potem kolejny fragment, itd.
  let html = '';

  for (let si = 0; si < steps.length; si++) {
    const step = steps[si];
    const rPad = (n - 1 - step.pos) * W;

    // Wiersz iloczynu: "−[iloczyn]" wyrównany do step.pos
    const prodStr = step.product === 0
      ? '0'.padStart(step.chunkDisplay.length, '0')
      : String(step.product);
    html += `<div class="wd-hint-row wd-hint-prod" style="padding-right:${rPad}px">`;
    html += `<span class="wd-minus">−</span>`;
    html += digitSpans(prodStr);
    html += `</div>`;

    // Kreska pozioma
    html += `<div class="wd-hint-rule"></div>`;

    // Jeśli nie ostatni krok: kolejny fragment (reszta + cyfra z przeniesienia)
    if (si < steps.length - 1) {
      const next = steps[si + 1];
      const nextRPad = (n - 1 - next.pos) * W;
      html += `<div class="wd-hint-row" style="padding-right:${nextRPad}px">`;
      html += digitSpans(next.chunkDisplay);
      html += `</div>`;
    }
  }

  // Ostatnia reszta (wyrównana do prawej)
  const lastRem = steps[steps.length - 1].remainder;
  html += `<div class="wd-hint-row wd-hint-final" style="padding-right:0">`;
  html += digitSpans(String(lastRem));
  html += `</div>`;

  return html;
}

// ── ZAOKRĄGLANIE – UI ─────────────────────────────────────────

function buildRoundingHtml(q) {
  const numStr = q.numberStr;
  const dotIdx = numStr.indexOf('.');
  const intLen = dotIdx === -1 ? numStr.length : dotIdx; // liczba cyfr przed przecinkiem

  let numHtml = '<div class="rnd-number">';
  for (let i = 0; i < numStr.length; i++) {
    const ch = numStr[i];
    if (ch === '.') {
      numHtml += `<span class="rnd-dot">,</span>`;
    } else {
      // Separator co 3 cyfry od prawej, tylko w części całkowitej (nie na początku)
      if (i > 0 && i < intLen && (intLen - i) % 3 === 0) {
        numHtml += `<span class="rnd-sep"></span>`;
      }
      numHtml += `<span class="rnd-digit" id="rnd-d-${i}">${ch}</span>`;
    }
  }
  numHtml += '</div>';

  return `<div class="rnd-wrap">
    <p class="rnd-question">Zaokrąglij do <strong>${q.orderName}</strong>:</p>
    ${numHtml}
    <div class="rnd-input-row">
      <input class="rnd-input" id="rnd-answer" type="text" inputmode="decimal"
        placeholder="wynik…" autocomplete="off"
        onkeydown="if(event.key==='Enter')checkAnswer()">
    </div>
  </div>`;
}

function highlightDecidingDigit(idx) {
  document.getElementById(`rnd-d-${idx}`)?.classList.add('rnd-deciding');
}

async function checkRounding() {
  const q = state.currentQuestion;
  const input = document.getElementById('rnd-answer');
  if (!input) return;

  const raw = input.value.trim().replace(/\s/g, '').replace(',', '.');
  if (!raw) { showToast('Wpisz wynik!', 'wrong'); input.focus(); return; }
  const userNum = parseFloat(raw);
  if (isNaN(userNum)) { showToast('Wpisz poprawną liczbę!', 'wrong'); input.focus(); return; }

  const dec = q.isDecimal ? q.decToRound : 0;
  const isCorrect = userNum.toFixed(dec) === q.answer.toFixed(dec);

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    input.classList.add('correct');
    highlightDecidingDigit(q.decidingIdx); // zawsze pokaż decydującą cyfrę
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 1000);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 1000);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      const correct = q.isDecimal ? q.answer.toFixed(q.decToRound) : String(q.answer);
      input.value = correct;
      input.classList.add('correct');
      highlightDecidingDigit(q.decidingIdx);
      showToast(`Poprawna: ${correct}`, 'wrong');
    } else if (!state.solutionShown) {
      if (state.mistakes === 1) highlightDecidingDigit(q.decidingIdx);
      input.classList.add('wrong');
      const left = 3 - state.mistakes;
      showToast(`✗ Sprawdź! (${left} ${left === 1 ? 'szansa' : 'szanse'})`, 'wrong');
      setTimeout(() => input.classList.remove('wrong'), 1000);
    }
  }
}

// ── O ILE? ILE RAZY? – UI ────────────────────────────────────

function buildComparisonHtml(q) {
  // Buduj zdanie: naprzemiennie tekst i wartość/input
  let sentenceHtml = '<p class="cmp-sentence">';
  for (let i = 0; i < 3; i++) {
    sentenceHtml += `<span class="cmp-text">${q.parts[i]}</span>`;
    if (i === q.blankIdx) {
      sentenceHtml += `<input class="cmp-input" id="cmp-answer" type="text"
        inputmode="decimal" autocomplete="off"
        onkeydown="if(event.key==='Enter')checkAnswer()">`;
    } else {
      sentenceHtml += `<span class="cmp-given">${q.given[i]}</span>`;
    }
  }
  sentenceHtml += `<span class="cmp-text">${q.parts[3]}</span></p>`;

  return `<div class="cmp-wrap">
    <div class="cmp-hint-box">💡 Zastanów się, jakie działanie należy wykonać!</div>
    ${sentenceHtml}
  </div>`;
}

async function checkComparison() {
  const q = state.currentQuestion;
  const input = document.getElementById('cmp-answer');
  if (!input) return;

  const raw = input.value.trim().replace(/\s/g, '').replace(',', '.');
  if (!raw) { showToast('Wpisz wynik!', 'wrong'); input.focus(); return; }
  const userNum = parseFloat(raw);
  if (isNaN(userNum)) { showToast('Wpisz poprawną liczbę!', 'wrong'); input.focus(); return; }

  const isCorrect = userNum === q.answer;

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    input.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      input.value = String(q.answer);
      input.classList.add('correct');
      showToast(`Poprawna: ${q.answer}`, 'wrong');
    } else if (!state.solutionShown) {
      input.classList.add('wrong');
      const left = 3 - state.mistakes;
      showToast(`✗ Sprawdź! (${left} ${left === 1 ? 'szansa' : 'szanse'})`, 'wrong');
      setTimeout(() => input.classList.remove('wrong'), 1000);
    }
  }
}

// ── POTĘGOWANIE – UI ─────────────────────────────────────────

const POW_SUP = { 0:'⁰', 1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸', 9:'⁹', 10:'¹⁰', 11:'¹¹', 12:'¹²' };

function buildPowerHtml(q) {
  const sup = POW_SUP[q.exp] ?? `^${q.exp}`;
  const inp = (cls) => `<input class="pow-input ${cls}" id="pow-answer" type="text"
    inputmode="numeric" placeholder="?" autocomplete="off"
    onkeydown="if(event.key==='Enter')checkAnswer()">`;

  let inner;
  if (q.sub === 'rev_base') {
    // □^exp = wynik
    inner = `${inp('pow-input-base')}<span class="pow-exp">${sup}</span>
      <span class="pow-eq">=</span>
      <span class="pow-result">${q.result}</span>`;
  } else if (q.sub === 'rev_exp') {
    // base^□ = wynik
    inner = `<span class="pow-base">${q.base}</span><span class="pow-exp-wrap">${inp('pow-input-exp')}</span>
      <span class="pow-eq">=</span>
      <span class="pow-result">${q.result}</span>`;
  } else {
    // base^exp = □
    inner = `<span class="pow-base">${q.base}</span><span class="pow-exp">${sup}</span>
      <span class="pow-eq">=</span>
      ${inp('')}`;
  }
  return `<div class="pow-wrap"><div class="pow-expression">${inner}</div></div>`;
}

async function checkPower() {
  const q = state.currentQuestion;
  const input = document.getElementById('pow-answer');
  if (!input) return;
  const raw = input.value.trim().replace(/\s/g, '');
  if (!raw) { showToast('Wpisz wynik!', 'wrong'); input.focus(); return; }
  const userNum = parseInt(raw, 10);
  if (isNaN(userNum)) { showToast('Wpisz liczbę całkowitą!', 'wrong'); input.focus(); return; }

  const isCorrect = userNum === q.answer;

  // helper: show hint inside .pow-wrap (only once, on 2nd mistake)
  const showPowHint = () => {
    if (!q.hint) return;
    const wrap = document.querySelector('.pow-wrap');
    if (wrap && !wrap.querySelector('.pow-hint')) {
      const hintEl = document.createElement('div');
      hintEl.className = 'pow-hint';
      hintEl.textContent = q.hint;
      wrap.appendChild(hintEl);
    }
  };

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    input.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 600);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      input.value = String(q.answer);
      input.classList.add('correct');
      showToast(`Wynik: ${q.answer}`, 'wrong');
    } else if (!state.solutionShown) {
      input.classList.add('wrong');
      const left = 3 - state.mistakes;
      showToast(`✗ Błąd! (${left} ${left === 1 ? 'szansa' : 'szanse'})`, 'wrong');
      setTimeout(() => { input.classList.remove('wrong'); input.select(); }, 900);
      if (state.mistakes === 2) showPowHint();
    }
  }
}

// ── KOLEJNOŚĆ DZIAŁAŃ – UI ────────────────────────────────────

function buildOrderOpsHtml(q) {
  return `<div class="oop-wrap">
    <div class="oop-top-row">
      <button class="oop-rules-btn" id="oopRulesBtn" onclick="toggleOopRules()">Kolejność działań ▾</button>
    </div>
    <div class="oop-row">
      <span class="oop-expr">${q.q}</span>
      <span class="oop-eq">=</span>
      <input class="oop-input" id="oop-answer" type="text" inputmode="numeric"
        placeholder="?" autocomplete="off"
        onkeydown="if(event.key==='Enter')checkAnswer()">
    </div>
    <div class="oop-rules-panel" id="oopRulesPanel">
      <div class="oop-rule"><span class="oop-step">1.</span> Działania w nawiasach</div>
      <div class="oop-rule"><span class="oop-step">2.</span> Potęgowanie</div>
      <div class="oop-rule"><span class="oop-step">3.</span> Dzielenie i mnożenie <span class="oop-eg">(w kolejności występowania)</span></div>
      <div class="oop-rule"><span class="oop-step">4.</span> Odejmowanie i dodawanie <span class="oop-eg">(w kolejności występowania)</span></div>
    </div>
  </div>`;
}

function toggleOopRules() {
  const panel = document.getElementById('oopRulesPanel');
  const btn   = document.getElementById('oopRulesBtn');
  if (!panel || !btn) return;
  const open = panel.classList.toggle('open');
  btn.textContent = open ? 'Kolejność działań ▴' : 'Kolejność działań ▾';
}

async function checkOrderOps() {
  const q = state.currentQuestion;
  const input = document.getElementById('oop-answer');
  if (!input) return;
  const raw = input.value.trim().replace(/\s/g, '').replace(',', '.');
  if (!raw) { showToast('Wpisz wynik!', 'wrong'); input.focus(); return; }
  const userNum = parseFloat(raw);
  if (isNaN(userNum)) { showToast('Wpisz liczbę!', 'wrong'); input.focus(); return; }

  const isCorrect = Math.abs(userNum - q.answer) < 0.01;

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    input.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 600);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      input.value = String(q.answer);
      input.classList.add('correct');
      showToast(`Wynik: ${q.answer}`, 'wrong');
    } else if (!state.solutionShown) {
      input.classList.add('wrong');
      const left = 3 - state.mistakes;
      showToast(`✗ Błąd! (${left} ${left === 1 ? 'szansa' : 'szanse'})`, 'wrong');
      setTimeout(() => { input.classList.remove('wrong'); input.select(); }, 900);
    }
  }
}

// ── PODZIELNOŚĆ LICZB – UI ────────────────────────────────────

function buildDivisibilityHtml(q) {
  const numFmt = q.n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const optHtml = q.options.map(opt =>
    `<button class="div-opt" data-val="${opt}" onclick="toggleDivOpt(this)">${opt}</button>`
  ).join('');
  return `<div class="div-wrap">
    <div class="div-top-row">
      <div class="div-number">${numFmt}</div>
      <button class="div-rules-btn" id="divRulesBtn" onclick="toggleDivRules()">Cechy podzielności ▾</button>
    </div>
    <p class="div-question">Zaznacz wszystkie dzielniki tej liczby:</p>
    <div class="div-options">${optHtml}</div>
    <button class="div-check-btn" onclick="checkAnswer()">Sprawdź</button>
    <div class="div-rules-panel" id="divRulesPanel">
      <div class="div-rule"><strong>÷2</strong> ostatnia cyfra parzysta (0, 2, 4, 6, 8)</div>
      <div class="div-rule"><strong>÷3</strong> suma cyfr podzielna przez 3</div>
      <div class="div-rule"><strong>÷4</strong> liczba z dwóch ostatnich cyfr dzieli się przez 4</div>
      <div class="div-rule"><strong>÷5</strong> ostatnia cyfra to 0 lub 5</div>
      <div class="div-rule"><strong>÷9</strong> suma cyfr podzielna przez 9</div>
      <div class="div-rule"><strong>÷10</strong> ostatnia cyfra to 0</div>
      <div class="div-rule"><strong>÷100</strong> kończy się dwoma zerami (00)</div>
    </div>
  </div>`;
}

function toggleDivOpt(btn) {
  if (state.answerLocked || state.solutionShown) return;
  btn.classList.toggle('selected');
}

function toggleDivRules() {
  const panel = document.getElementById('divRulesPanel');
  const btn   = document.getElementById('divRulesBtn');
  if (!panel || !btn) return;
  const open = panel.classList.toggle('open');
  btn.textContent = open ? 'Cechy podzielności ▴' : 'Cechy podzielności ▾';
}

async function checkDivisibility() {
  const q = state.currentQuestion;
  const selected = [...document.querySelectorAll('.div-opt.selected')].map(b => Number(b.dataset.val));
  const correctSet  = new Set(q.answers);
  const selectedSet = new Set(selected);
  const isCorrect = correctSet.size === selectedSet.size &&
    [...correctSet].every(v => selectedSet.has(v));

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    document.querySelectorAll('.div-opt.selected').forEach(b => b.classList.add('correct'));
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 800);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 800);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      document.querySelectorAll('.div-opt').forEach(b => {
        const v = Number(b.dataset.val);
        b.classList.remove('selected', 'wrong');
        if (correctSet.has(v)) b.classList.add('correct');
      });
      const ans = q.answers.slice().sort((a, b) => a - b).join(', ');
      showToast(`Dzielniki: ${ans}`, 'wrong');
    } else if (!state.solutionShown) {
      // Zaznacz błędne wybory (zaznaczone, ale niepoprawne)
      document.querySelectorAll('.div-opt.selected').forEach(b => {
        if (!correctSet.has(Number(b.dataset.val))) {
          b.classList.add('wrong');
          setTimeout(() => b.classList.remove('wrong'), 1000);
        }
      });
      const left = 3 - state.mistakes;
      showToast(`✗ Nie zgadza się! (${left} ${left === 1 ? 'szansa' : 'szanse'})`, 'wrong');
    }
  }
}

// ── POJĘCIE FUNKCJI – UI ────────────────────────────────────

function getFunctionJustification(q) {
  if (q.hint) return q.hint;
  // pairs / table — dynamicznie
  if (q.isFunction) return 'Każdy argument pojawia się dokładnie raz — każdemu x odpowiada jedna wartość.';
  const seen = {};
  for (const [x, y] of q.pairs) {
    if (seen[x] !== undefined) return `Argument x = ${x} pojawia się dwa razy: raz z y = ${seen[x]}, raz z y = ${y}.`;
    seen[x] = y;
  }
  return 'Jeden argument ma przypisane dwie różne wartości.';
}

function buildFunctionQHtml(q) {
  let contentHtml;
  if (q.subType === 'pairs') {
    const rows = q.pairs.map(([x, y]) => `<span class="funcq-arrow">${x} → ${y}</span>`).join('');
    contentHtml = `<div class="funcq-pairs">${rows}</div>`;
  } else if (q.subType === 'words') {
    contentHtml = `<div class="funcq-words">${q.text}</div>`;
  } else if (q.subType === 'table') {
    const xCells = q.pairs.map(([x]) => `<td>${x}</td>`).join('');
    const yCells = q.pairs.map(([, y]) => `<td>${y}</td>`).join('');
    contentHtml = `<table class="funcq-table">
      <tr><td class="funcq-var">x</td>${xCells}</tr>
      <tr><td class="funcq-var">y</td>${yCells}</tr>
    </table>`;
  } else {
    contentHtml = `<div class="funcq-formula">${q.formula}</div>`;
  }
  return `<div class="funcq-wrap">
    <div class="funcq-def">
      <span class="funcq-def-kw">Funkcja</span> – przyporządkowanie, w którym każdemu argumentowi odpowiada <strong>dokładnie jedna</strong> wartość.
    </div>
    <p class="funcq-prompt">Czy to przyporządkowanie jest funkcją?</p>
    ${contentHtml}
    <div class="funcq-justify" id="funcq-justify"></div>
    <div class="funcq-btns">
      <button class="funcq-btn funcq-yes" id="funcq-yes" onclick="selectFunctionAnswer(this, true)">TAK</button>
      <button class="funcq-btn funcq-no"  id="funcq-no"  onclick="selectFunctionAnswer(this, false)">NIE</button>
    </div>
  </div>`;
}

function selectFunctionAnswer(btn, isYes) {
  if (state.answerLocked || state.solutionShown) return;
  document.querySelectorAll('.funcq-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  checkFunctionQ(isYes);
}

async function checkFunctionQ(userAnswer) {
  const q = state.currentQuestion;
  const isCorrect = userAnswer === q.isFunction;
  const selBtn = document.querySelector('.funcq-btn.selected');

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    selBtn?.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');
    selBtn?.classList.add('wrong');
    setTimeout(() => selBtn?.classList.remove('wrong', 'selected'), 800);
    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      document.getElementById(q.isFunction ? 'funcq-yes' : 'funcq-no')?.classList.add('correct');
      showToast(`Poprawna odpowiedź: ${q.isFunction ? 'TAK' : 'NIE'}`, 'wrong');
    } else if (!state.solutionShown) {
      if (state.mistakes === 2) {
        const just = getFunctionJustification(q);
        const el = document.getElementById('funcq-justify');
        if (el && just) { el.innerHTML = just; el.classList.add('show'); }
      }
      showToast('✗ Spróbuj jeszcze raz!', 'wrong');
    }
  }
}

// ── ŚWIAT LICZB – UI ───────────────────────────────────────

function buildNumWriteHtml(q) {
  const numFmt = fmtNum(q.n);
  const optsHtml = q.options.map((opt, i) =>
    `<button class="sliczb-opt" data-idx="${i}" onclick="selectNumWriteOpt(this)">${opt}</button>`
  ).join('');
  return `<div class="sliczb-wrap">
    <p class="sliczb-prompt">Zapisz słownie liczbę:</p>
    <div class="sliczb-number">${numFmt}</div>
    <div class="sliczb-opts">${optsHtml}</div>
    <button class="div-check-btn" id="sliczb-check-btn" onclick="checkAnswer()">Sprawdź</button>
  </div>`;
}

function selectNumWriteOpt(btn) {
  if (state.answerLocked || state.solutionShown) return;
  document.querySelectorAll('.sliczb-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('sliczb-check-btn')?.focus();
}

async function checkNumWrite() {
  const q = state.currentQuestion;
  const sel = document.querySelector('.sliczb-opt.selected');
  if (!sel) { showToast('Wybierz odpowiedź!', 'wrong'); return; }
  const idx = parseInt(sel.dataset.idx);
  const isCorrect = idx === q.correctIdx;

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    sel.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 800);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 800);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');
    sel.classList.add('wrong');
    setTimeout(() => sel.classList.remove('wrong'), 1000);
    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      document.querySelector(`.sliczb-opt[data-idx="${q.correctIdx}"]`)?.classList.add('correct');
      showToast('Poprawna odpowiedź zaznaczona', 'wrong');
    } else if (!state.solutionShown) {
      const left = 3 - state.mistakes;
      showToast(`✗ Spróbuj jeszcze raz! (${left} ${left === 1 ? 'szansa' : 'szanse'})`, 'wrong');
    }
  }
}

function waHandleInput(e, col, maxCol) {
  const v = e.target.value.replace(/[^0-9]/g, '');
  e.target.value = v.slice(-1);
  // po wpisaniu cyfry: idź w lewo (wyższy indeks kolumny)
  if (v && col < maxCol) document.getElementById(`wain-${col + 1}`)?.focus();
}

function waHandleKey(e, col, maxCol) {
  // Backspace na pustym polu: idź w prawo (niższy indeks)
  if (e.key === 'Backspace' && !e.target.value && col > 0)
    document.getElementById(`wain-${col - 1}`)?.focus();
  if (e.key === 'ArrowLeft'  && col < maxCol) { e.preventDefault(); document.getElementById(`wain-${col + 1}`)?.focus(); }
  if (e.key === 'ArrowRight' && col > 0)      { e.preventDefault(); document.getElementById(`wain-${col - 1}`)?.focus(); }
  if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
}

// ── SZACOWANIE PIERWIASTKÓW ──────────────────────────────────

function buildSqrtBoundsHtml(q) {
  const solved = state.solutionShown;

  const loSlot = solved
    ? `<span class="sqrt-bound-fixed correct">${q.lo}</span>`
    : `<input id="sqrtLo" class="sqrt-input" type="number" inputmode="numeric" placeholder="?"
        onkeydown="handleSqrtKey(event,'lo')" autocomplete="off">`;

  const hiSlot = solved
    ? `<span class="sqrt-bound-fixed correct">${q.hi}</span>`
    : `<input id="sqrtHi" class="sqrt-input" type="number" inputmode="numeric" placeholder="?"
        onkeydown="handleSqrtKey(event,'hi')" autocomplete="off">`;

  const exprHtml = (typeof katex !== 'undefined' && q.latex)
    ? katex.renderToString(q.latex, { throwOnError: false, displayMode: false })
    : q.display;

  return `
    <div class="sqrt-bounds-wrap">
      <div class="sqrt-instruction">Podaj dwie kolejne liczby całkowite:</div>
      <div class="sqrt-row">
        ${loSlot}
        <span class="sqrt-lt">&lt;</span>
        <span class="sqrt-expr">${exprHtml}</span>
        <span class="sqrt-lt">&lt;</span>
        ${hiSlot}
      </div>
    </div>`;
}

function handleSqrtKey(e, side) {
  if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); return; }
  if (e.key === 'Tab' && side === 'lo') {
    e.preventDefault();
    document.getElementById('sqrtHi')?.focus();
  }
}

function buildPrimeLadder(n, factors) {
  let rows = '';
  let cur = n;
  for (const f of factors) {
    rows += `<tr><td class="pl-num">${cur}</td><td class="pl-div">${f}</td></tr>`;
    cur = Math.round(cur / f);
  }
  rows += `<tr><td class="pl-num pl-one">1</td><td class="pl-div"></td></tr>`;
  return `<table class="prime-ladder">${rows}</table>`;
}

// ── DZIELENIE Z RESZTĄ – UI ───────────────────────────────────
function buildDivRemHtml(q) {
  const tabNext = `onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('drRem')?.focus();}"`;
  const tabCheck = `onkeydown="if(event.key==='Enter'){event.preventDefault();checkDivRem();}"`;
  return `<div class="dr-wrap">
    <div class="dr-expr">
      <span class="dr-num">${q.a}</span>
      <span class="dr-op">÷</span>
      <span class="dr-num">${q.b}</span>
      <span class="dr-eq">=</span>
      <input class="dr-input" id="drQuot" type="text" inputmode="numeric"
        placeholder="?" autocomplete="off" ${tabNext}>
      <span class="dr-rest">reszty</span>
      <input class="dr-input" id="drRem" type="text" inputmode="numeric"
        placeholder="?" autocomplete="off" ${tabCheck}>
    </div>
  </div>`;
}

async function checkDivRem() {
  const q = state.currentQuestion;
  const quotEl = document.getElementById('drQuot');
  const remEl  = document.getElementById('drRem');
  if (!quotEl || !remEl) return;

  const quotVal = parseInt(quotEl.value.trim(), 10);
  const remVal  = parseInt(remEl.value.trim(), 10);

  if (isNaN(quotVal) || isNaN(remVal)) {
    showToast('Wypełnij oba pola!', 'wrong'); quotEl.focus(); return;
  }

  const quotOk = quotVal === q.quot;
  const remOk  = remVal  === q.rem;
  const isCorrect = quotOk && remOk;

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    quotEl.classList.add('correct');
    remEl.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      state.answerLocked = true;
      quotEl.value = String(q.quot);
      remEl.value  = String(q.rem);
      quotEl.classList.add('correct');
      remEl.classList.add('correct');
      showToast(`✗ Wynik: ${q.quot} reszty ${q.rem}`, 'wrong');
      // brak auto-next — uczeń sam klika "Inny przykład"
    } else if (!state.solutionShown) {
      // Podświetl tylko błędne pole(a)
      if (!quotOk) { quotEl.classList.add('wrong'); setTimeout(() => { quotEl.classList.remove('wrong'); quotEl.select(); }, 900); }
      if (!remOk)  { remEl.classList.add('wrong');  setTimeout(() => { remEl.classList.remove('wrong');  remEl.select(); }, 900); }
      const left = 3 - state.mistakes;
      const msg = !quotOk && !remOk ? `✗ Oba pola błędne! (${left} ${left===1?'szansa':'szanse'})`
                : !quotOk           ? `✗ Błąd w wyniku! (${left} ${left===1?'szansa':'szanse'})`
                :                     `✗ Błąd w reszcie! (${left} ${left===1?'szansa':'szanse'})`;
      showToast(msg, 'wrong');
      // Pokaż podpowiedź po 2. błędzie
      if (state.mistakes === 2 && q.hint) {
        const wrap = document.querySelector('.dr-wrap');
        if (wrap && !wrap.querySelector('.dr-hint')) {
          const hintEl = document.createElement('div');
          hintEl.className = 'dr-hint';
          hintEl.textContent = q.hint;
          wrap.appendChild(hintEl);
        }
      }
    }
  }
}

// ============================================================
// FRACTION READ (SVG visual → uczeń wpisuje ułamek)
// ============================================================

function fractionCircleSvg(k, n, size = 130) {
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const x1 = (cx + r * Math.cos(a1)).toFixed(3);
    const y1 = (cy + r * Math.sin(a1)).toFixed(3);
    const x2 = (cx + r * Math.cos(a2)).toFixed(3);
    const y2 = (cy + r * Math.sin(a2)).toFixed(3);
    const large = (1 / n) > 0.5 ? 1 : 0;
    const fill = i < k ? 'var(--accent)' : 'var(--bg)';
    parts.push(`<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z" fill="${fill}" stroke="var(--border)" stroke-width="2"/>`);
  }
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="2"/>`);
  return `<svg width="${size}" height="${size}" style="display:block">${parts.join('')}</svg>`;
}

function fractionRectSvg(k, n, w = 210, h = 70) {
  const pw = w / n;
  const parts = [];
  for (let i = 0; i < n; i++) {
    const x = (i * pw).toFixed(3);
    const fill = i < k ? 'var(--accent)' : 'var(--bg)';
    parts.push(`<rect x="${x}" y="0" width="${pw.toFixed(3)}" height="${h}" fill="${fill}" stroke="var(--border)" stroke-width="2"/>`);
  }
  return `<svg width="${w}" height="${h}" style="display:block">${parts.join('')}</svg>`;
}

function buildFractionReadHtml(q) {
  const svg = q.shape ? (q.shape === 'circle' ? fractionCircleSvg(q.k, q.n) : fractionRectSvg(q.k, q.n)) : '';
  const questionText = q.text || 'Jaki ułamek przedstawia rysunek?';
  if (state.solutionShown) {
    return `<div class="fr-wrap">
      <div class="fr-question">${questionText}</div>
      ${svg ? `<div>${svg}</div>` : ''}
      <div class="fr-solution">
        <div>${q.k}</div>
        <div class="fr-sol-line"></div>
        <div>${q.n}</div>
      </div>
    </div>`;
  }
  let hint = '';
  if (state.mistakes >= 1) {
    if (q.shape) {
      hint = `<div class="fr-hint">💡 Mianownik = wszystkie części (${q.n}), licznik = pokolorowane części</div>`;
    } else if (q.hint) {
      hint = `<div class="fr-hint">💡 ${q.hint}</div>`;
    }
  }
  return `<div class="fr-wrap">
    <div class="fr-question">${questionText}</div>
    ${svg ? `<div>${svg}</div>` : ''}
    <div class="fr-input-area">
      <input id="frNum" class="fr-input" type="number" min="0" max="99" placeholder="?"
        onkeydown="if(event.key==='Enter'){document.getElementById('frDen')?.focus()}"
        oninput="this.classList.remove('wrong','correct')">
      <div class="fr-bar"></div>
      <input id="frDen" class="fr-input" type="number" min="1" max="99" placeholder="?"
        onkeydown="if(event.key==='Enter')checkAnswer()"
        oninput="this.classList.remove('wrong','correct')">
    </div>
    ${hint}
  </div>`;
}

async function checkFractionRead() {
  if (state.answerLocked) return;
  const q   = state.currentQuestion;
  const numEl = document.getElementById('frNum');
  const denEl = document.getElementById('frDen');
  if (!numEl || !denEl) return;

  const k = parseInt(numEl.value, 10);
  const n = parseInt(denEl.value, 10);
  if (isNaN(k) || isNaN(n)) { showToast('Wpisz licznik i mianownik', 'info'); numEl.focus(); return; }

  const correct = k > 0 && n > 0 && k * q.n === n * q.k;

  if (correct) {
    state.answerLocked = true;
    playSound('correct');
    numEl.classList.add('correct');
    denEl.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 700);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 800);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`)?.classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      state.answerLocked  = true;
      document.getElementById('writtenAddArea').innerHTML = buildFractionReadHtml(q);
      showToast(`Odpowiedź: ${q.k}/${q.n}`, 'info');
      setTimeout(() => loadQuestion(), 3500);
    } else {
      numEl.classList.add('wrong');
      denEl.classList.add('wrong');
      const left = 3 - state.mistakes;
      showToast(`✗ Spróbuj jeszcze raz (${left} ${left === 1 ? 'szansa' : 'szanse'})`, 'wrong');
      setTimeout(() => {
        numEl.classList.remove('wrong'); denEl.classList.remove('wrong');
        // Przebuduj HTML (pokaż podpowiedź po 1. błędzie)
        document.getElementById('writtenAddArea').innerHTML = buildFractionReadHtml(q);
        document.getElementById('frNum').focus();
      }, 800);
    }
  }
}

function buildPrimeFactorsHtml(q) {
  const solved = state.solutionShown;
  const inputPart = solved
    ? `<div class="pf-ladder-wrap">${buildPrimeLadder(q.n, q.factors)}</div>
       <div class="pf-solution">${q.n} = ${q.factors.join(' \u00d7 ')}</div>`
    : `<div class="pf-input-row">
         <input id="pfInput" class="pf-input" type="text" placeholder="np. 2 2 3 5"
           autocomplete="off" onkeydown="if(event.key==='Enter')checkAnswer()">
       </div>
       <div class="pf-fmt-note">Wpisz czynniki oddzielone spacją lub przecinkiem</div>`;

  return `<div class="pf-wrap">
    <div class="pf-note">✏️ Weź kartkę i długopis — tu przyda się <strong>drabinka dzielenia!</strong></div>
    <details class="pf-howto">
      <summary>Jak wyznaczyć rozkład?</summary>
      <ol class="pf-steps">
        <li>Podziel liczbę przez najmniejszą liczbę pierwszą, przez którą jest podzielna.</li>
        <li>Wynik zapisz obok, kontynuuj z wynikiem po lewej.</li>
        <li>Powtarzaj, aż dojdziesz do 1. Czynniki to liczby po prawej stronie.</li>
      </ol>
    </details>
    <div class="pf-question">Rozłóż na czynniki pierwsze: <span class="pf-number">${q.n}</span></div>
    ${inputPart}
  </div>`;
}

function renderFactorsHighlighted(n, factors, common) {
  const remaining = [...common];
  const spans = factors.map(f => {
    const idx = remaining.indexOf(f);
    if (idx >= 0) { remaining.splice(idx, 1); return `<span class="nwd-factor-common">${f}</span>`; }
    return `<span class="nwd-factor-plain">${f}</span>`;
  });
  return `<div class="nwd-factor-row"><span class="nwd-n">${n}</span> = ${spans.join('<span class="nwd-times"> \u00d7 </span>')}</div>`;
}

function buildNwdFactorStep(stepNum, n, factors, showSolution, totalSteps = 3) {
  const label = `Krok ${stepNum}/${totalSteps}: Rozłóż na czynniki pierwsze liczbę <strong>${n}</strong>`;
  if (showSolution) {
    return `<div class="nwd-step">
      <div class="nwd-step-label">${label}</div>
      <div class="nwd-ladder-wrap">${buildPrimeLadder(n, factors)}</div>
      <div class="nwd-factors-result">${n} = ${factors.join(' \u00d7 ')}</div>
    </div>`;
  }
  return `<div class="nwd-step">
    <div class="nwd-step-label">${label}</div>
    <div class="pf-input-row">
      <input id="nwdInput" class="pf-input" type="text" placeholder="np. 2 2 3"
        autocomplete="off" onkeydown="if(event.key==='Enter')checkAnswer()">
    </div>
    <div class="pf-fmt-note">Wpisz czynniki oddzielone spacją lub przecinkiem</div>
  </div>`;
}

function buildNwdHtml(q) {
  const phase = state.nwdPhase || 'factor1';
  const has3 = !!q.c;
  const totalSteps = has3 ? 4 : 3;
  const common = has3
    ? commonFactors(commonFactors(q.factorsA, q.factorsB), q.factorsC)
    : commonFactors(q.factorsA, q.factorsB);
  const showHl = state.nwdShowGcdHint;
  const nwdLabel = has3 ? `NWD(${q.a}, ${q.b}, ${q.c})` : `NWD(${q.a}, ${q.b})`;
  let body = '';

  const confirmed = (n, factors) =>
    `<div class="nwd-confirmed">\u2713 ${n} = ${factors.join(' \u00d7 ')}</div>`;

  if (phase === 'factor1') {
    body = buildNwdFactorStep(1, q.a, q.factorsA, state.nwdShowSolution1, totalSteps);
  } else if (phase === 'factor2') {
    body = confirmed(q.a, q.factorsA);
    body += buildNwdFactorStep(2, q.b, q.factorsB, state.nwdShowSolution2, totalSteps);
  } else if (phase === 'factor3') {
    body = confirmed(q.a, q.factorsA) + confirmed(q.b, q.factorsB);
    body += buildNwdFactorStep(3, q.c, q.factorsC, state.nwdShowSolution3, totalSteps);
  } else {
    // gcd phase
    const allPairs = [[q.a, q.factorsA], [q.b, q.factorsB], ...(has3 ? [[q.c, q.factorsC]] : [])];
    const gcdStep = totalSteps;
    body = showHl
      ? allPairs.map(([n, f]) => renderFactorsHighlighted(n, f, common)).join('')
      : allPairs.map(([n, f]) => confirmed(n, f)).join('');
    if (showHl) body += `<div class="nwd-hl-note">Zakreślone czynniki wchodzą do NWD</div>`;
    body += `<div class="nwd-step nwd-gcd-step">
      <div class="nwd-step-label">Krok ${gcdStep}/${totalSteps}: Podaj ${nwdLabel}</div>
      <div class="nwd-gcd-row">${nwdLabel} =
        <input id="nwdInput" class="nwd-gcd-input" type="number" min="1"
          autocomplete="off" onkeydown="if(event.key==='Enter')checkAnswer()">
      </div>
    </div>`;
  }

  const title = has3 ? `Oblicz NWD(${q.a}, ${q.b}, ${q.c})` : `Oblicz NWD(${q.a}, ${q.b})`;
  return `<div class="nwd-wrap">
    <div class="nwd-title">\u2702\ufe0f ${title}</div>
    <div class="pf-note">✏️ Weź kartkę i długopis — przyda się drabinka!</div>
    ${body}
  </div>`;
}

function renderFactorsCrossed(n, factors, crossOut) {
  const remaining = [...crossOut];
  const spans = factors.map(f => {
    const idx = remaining.indexOf(f);
    if (idx >= 0) { remaining.splice(idx, 1); return `<span class="nww-factor-crossed"><s>${f}</s></span>`; }
    return `<span class="nwd-factor-plain">${f}</span>`;
  });
  return `<div class="nwd-factor-row"><span class="nwd-n">${n}</span> = ${spans.join('<span class="nwd-times"> \u00d7 </span>')}</div>`;
}

function buildNwwHtml(q) {
  const phase = state.nwwPhase || 'factor1';
  const common = commonFactors(q.factorsA, q.factorsB);
  const showHint = state.nwwShowLcmHint;
  const confirmed = (n, factors) =>
    `<div class="nwd-confirmed">\u2713 ${n} = ${factors.join(' \u00d7 ')}</div>`;
  let body = '';

  if (phase === 'factor1') {
    body = buildNwdFactorStep(1, q.a, q.factorsA, state.nwwShowSolution1);
  } else if (phase === 'factor2') {
    body = confirmed(q.a, q.factorsA);
    body += buildNwdFactorStep(2, q.b, q.factorsB, state.nwwShowSolution2);
  } else {
    // lcm phase
    if (showHint) {
      body = confirmed(q.a, q.factorsA);
      body += renderFactorsCrossed(q.b, q.factorsB, common);
      body += `<div class="nww-hint-note">Wykreślono wspólne czynniki z ${q.b} — są już w ${q.a}.<br>Pomnóż jedną liczbę przez nieprzekreślone czynniki drugiej liczby.</div>`;
    } else {
      body = confirmed(q.a, q.factorsA) + confirmed(q.b, q.factorsB);
    }
    body += `<div class="nwd-step nwd-gcd-step">
      <div class="nwd-step-label">Krok 3/3: Podaj NWW(${q.a}, ${q.b})</div>
      <div class="nwd-gcd-row">NWW(${q.a}, ${q.b}) =
        <input id="nwwInput" class="nwd-gcd-input" type="number" min="1"
          autocomplete="off" onkeydown="if(event.key==='Enter')checkAnswer()">
      </div>
    </div>`;
  }

  return `<div class="nwd-wrap">
    <div class="nwd-title">\u2708\ufe0f Oblicz NWW(${q.a}, ${q.b})</div>
    <div class="pf-note">✏️ Weź kartkę i długopis — przyda się drabinka!</div>
    ${body}
  </div>`;
}

async function checkSqrtBounds() {
  if (state.answerLocked) return;
  const q = state.currentQuestion;

  const loEl = document.getElementById('sqrtLo');
  const hiEl = document.getElementById('sqrtHi');
  const loVal = parseInt(loEl?.value ?? '');
  const hiVal = parseInt(hiEl?.value ?? '');

  if (loEl?.value === '' || isNaN(loVal) || hiEl?.value === '' || isNaN(hiVal)) {
    showToast('Wpisz obie wartości!', 'wrong');
    if (loEl?.value === '') loEl?.focus(); else hiEl?.focus();
    return;
  }

  const isCorrect = loVal === q.lo && hiVal === q.hi;

  if (isCorrect) {
    state.answerLocked = true;
    playSound('correct');
    loEl?.classList.add('correct');
    hiEl?.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 500);
    } else {
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      let pts = 0;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
      }
      reportComeback();
      const msg = pts > 0 ? `✓ Brawo! +${pts} pkt${streakSuffix(state.answerStreak)}`
                : state.solutionShown ? '✓ Dobrze! Idziemy dalej.'
                : state.currentUser ? `✓ Brawo!${streakSuffix(state.answerStreak)}` : '✓ Brawo!';
      showToast(msg, 'correct');
      setTimeout(() => loadQuestion(), 500);
    }
    return;
  }

  // Błąd
  if (state.solutionShown) {
    if (loVal !== q.lo) { loEl?.classList.add('wrong'); setTimeout(() => loEl?.classList.remove('wrong'), 500); }
    if (hiVal !== q.hi) { hiEl?.classList.add('wrong'); setTimeout(() => hiEl?.classList.remove('wrong'), 500); }
    showToast(`Odpowiedź: ${q.lo} < … < ${q.hi}`, 'wrong');
    return;
  }

  state.answerStreak = 0;
  state.mistakes++;
  state.isFirstAttempt = false;
  reportMistake();
  playSound('wrong');
  if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

  if (loVal !== q.lo) { loEl?.classList.add('wrong'); setTimeout(() => loEl?.classList.remove('wrong'), 600); }
  if (hiVal !== q.hi) { hiEl?.classList.add('wrong'); setTimeout(() => hiEl?.classList.remove('wrong'), 600); }

  if (state.mistakes === 2) {
    // Dopisz podpowiedź bez przeładowania inputów
    const wrap = document.querySelector('.sqrt-bounds-wrap');
    if (wrap && !wrap.querySelector('.sqrt-hint')) {
      const hint = document.createElement('div');
      hint.className = 'sqrt-hint';
      // Podpowiedź zależna od rodzaju wyrażenia
      const showLo = Math.random() < 0.5;
      if (q.kind === 'cube') {
        const n = showLo ? q.lo : q.hi;
        hint.innerHTML = `💡 Zauważ, że ${n}&nbsp;=&nbsp;\u221b${n * n * n}`;
      } else if (q.kind === 'neg_sqrt' || q.kind === 'sqrt_offset') {
        const sqLo = Math.floor(Math.sqrt(q.rawX));
        hint.innerHTML = `💡 \u221a${q.rawX} leży między ${sqLo} a ${sqLo + 1}`;
      } else {
        const n = showLo ? q.lo : q.hi;
        hint.innerHTML = `💡 Zauważ, że ${n}&nbsp;=&nbsp;\u221a${n * n}`;
      }
      wrap.appendChild(hint);
    }
    showToast('💡 Sprawdź podpowiedź poniżej!', 'wrong');
  } else if (state.mistakes >= 3) {
    state.solutionShown = true;
    document.getElementById('writtenAddArea').innerHTML = buildSqrtBoundsHtml(q);
    showToast(`✗ Odpowiedź: ${q.lo} < … < ${q.hi}`, 'wrong');
    setTimeout(() => loadQuestion(), 2500);
  } else {
    showToast(`✗ Spróbuj jeszcze raz! (${3 - state.mistakes} szanse)`, 'wrong');
  }
}

async function checkPrimeFactors() {
  if (state.answerLocked) return;
  const q = state.currentQuestion;
  const input = document.getElementById('pfInput');
  if (!input) return;

  const raw = input.value.trim();
  if (!raw) { input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600); return; }

  const tokens = raw.split(/[\s,]+/).filter(Boolean);
  const nums = tokens.map(t => parseInt(t, 10));
  if (nums.some(isNaN)) {
    input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600); return;
  }

  const sorted = [...nums].sort((a, b) => a - b);
  const expected = [...q.factors];
  const correct = sorted.length === expected.length && sorted.every((v, i) => v === expected[i]);

  if (correct) {
    state.answerLocked = true;
    playSound('correct');
    input.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 600);
    } else {
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      let pts = 0;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
      }
      reportComeback();
      const msg = pts > 0 ? `✓ Brawo! +${pts} pkt${streakSuffix(state.answerStreak)}`
                : state.solutionShown ? '✓ Dobrze! Idziemy dalej.'
                : state.currentUser ? `✓ Brawo!${streakSuffix(state.answerStreak)}` : '✓ Brawo!';
      showToast(msg, 'correct');
      setTimeout(() => loadQuestion(), 600);
    }
    return;
  }

  if (state.solutionShown) {
    input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600);
    showToast(`✗ Odpowiedź: ${q.factors.join(' × ')}`, 'wrong');
    return;
  }

  state.answerStreak = 0;
  state.mistakes++;
  state.isFirstAttempt = false;
  reportMistake();
  playSound('wrong');
  if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`)?.classList.add('used');
  input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600);

  if (state.mistakes === 1) {
    const p = q.factors[0];
    const wrap = document.querySelector('.pf-wrap');
    if (wrap && !wrap.querySelector('.pf-hint')) {
      const hint = document.createElement('div');
      hint.className = 'pf-hint';
      hint.textContent = `💡 Wskazówka: ${q.n} jest podzielna przez ${p}`;
      wrap.appendChild(hint);
    }
    showToast(`💡 ${q.n} jest podzielna przez ${p}`, 'wrong');
  } else if (state.mistakes === 2) {
    const wrap = document.querySelector('.pf-wrap');
    const existingHint = wrap?.querySelector('.pf-hint');
    const distinct = [...new Set(q.factors)];
    const hintText = distinct.length >= 2
      ? `💡 Wskazówka: ${q.n} jest podzielna przez ${distinct[0]} i przez ${distinct[1]}`
      : `💡 Wskazówka: czynnik pierwszy to ${distinct[0]} (pojawia się ${q.factors.length} razy)`;
    if (existingHint) { existingHint.textContent = hintText; }
    else if (wrap) { const h = document.createElement('div'); h.className = 'pf-hint'; h.textContent = hintText; wrap.appendChild(h); }
    showToast('💡 Sprawdź podpowiedź poniżej!', 'wrong');
  } else if (state.mistakes >= 3) {
    state.solutionShown = true;
    state.answerLocked = true;
    document.getElementById('writtenAddArea').innerHTML = buildPrimeFactorsHtml(q);
    showToast(`✗ Rozwiązanie: ${q.factors.join(' × ')}`, 'wrong');
    // brak auto-next — uczeń sam klika "Inny przykład"
  } else {
    showToast(`✗ Spróbuj jeszcze raz! (${3 - state.mistakes} szanse)`, 'wrong');
  }
}

function advanceNwdPhase(q, nextPhase) {
  state.nwdPhase = nextPhase;
  state.mistakes = 0;
  state.answerLocked = false;
  [0,1,2].forEach(i => document.getElementById(`dot${i}`)?.classList.remove('used'));
  document.getElementById('writtenAddArea').innerHTML = buildNwdHtml(q);
  document.getElementById('nwdInput')?.focus();
}

function setNwdHint(text) {
  const wrap = document.querySelector('.nwd-wrap');
  if (!wrap) return;
  let hint = wrap.querySelector('.nwd-hint');
  if (!hint) { hint = document.createElement('div'); hint.className = 'nwd-hint'; wrap.appendChild(hint); }
  hint.textContent = text;
}

async function checkNwd() {
  if (state.answerLocked) return;
  const q = state.currentQuestion;
  const phase = state.nwdPhase;
  const input = document.getElementById('nwdInput');
  if (!input) return;

  // ── Phases: factoring ──────────────────────────────────────
  if (phase === 'factor1' || phase === 'factor2' || phase === 'factor3') {
    const expectedFactors = phase === 'factor1' ? q.factorsA : phase === 'factor2' ? q.factorsB : q.factorsC;
    const n = phase === 'factor1' ? q.a : phase === 'factor2' ? q.b : q.c;
    const showSolKey = phase === 'factor1' ? 'nwdShowSolution1' : phase === 'factor2' ? 'nwdShowSolution2' : 'nwdShowSolution3';
    const nextPhase = phase === 'factor1' ? 'factor2' : phase === 'factor2' ? (q.c ? 'factor3' : 'gcd') : 'gcd';

    const raw = input.value.trim();
    if (!raw) { input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600); return; }
    const tokens = raw.split(/[\s,]+/).filter(Boolean);
    const nums = tokens.map(t => parseInt(t, 10));
    if (nums.some(isNaN)) { input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600); return; }

    const sorted = [...nums].sort((a, b) => a - b);
    const correct = sorted.length === expectedFactors.length && sorted.every((v, i) => v === expectedFactors[i]);

    if (correct) {
      state.answerLocked = true;
      playSound('correct');
      input.classList.add('correct');
      showToast('✓ Dobrze!', 'correct');
      setTimeout(() => advanceNwdPhase(q, nextPhase), 600);
      return;
    }

    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake(); playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`)?.classList.add('used');
    input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600);

    if (state.mistakes === 1) {
      const p = expectedFactors[0];
      setNwdHint(`💡 ${n} jest podzielna przez ${p}`);
      showToast(`💡 ${n} jest podzielna przez ${p}`, 'wrong');
    } else if (state.mistakes === 2) {
      const distinct = [...new Set(expectedFactors)];
      const hint = distinct.length >= 2
        ? `💡 ${n} jest podzielna przez ${distinct[0]} i przez ${distinct[1]}`
        : `💡 Czynnik to ${distinct[0]} (pojawia się ${expectedFactors.length} razy)`;
      setNwdHint(hint);
      showToast('💡 Sprawdź podpowiedź poniżej!', 'wrong');
    } else if (state.mistakes >= 3) {
      state[showSolKey] = true;
      state.answerLocked = true;
      document.getElementById('writtenAddArea').innerHTML = buildNwdHtml(q);
      showToast(`✗ Rozwiązanie: ${expectedFactors.join(' × ')}`, 'wrong');
      setTimeout(() => advanceNwdPhase(q, nextPhase), 3500);
    } else {
      showToast(`✗ Spróbuj jeszcze raz! (${3 - state.mistakes} szanse)`, 'wrong');
    }
    return;
  }

  // ── Phase: GCD ────────────────────────────────────────────
  const val = parseInt(input.value, 10);
  if (!input.value || isNaN(val)) { input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600); return; }

  if (val === q.gcd) {
    state.answerLocked = true;
    playSound('correct');
    input.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 600);
    } else {
      const wasFirst = state.isFirstAttempt && !state.nwdShowGcdHint;
      let pts = 0;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
      }
      reportComeback();
      const msg = pts > 0 ? `✓ Brawo! +${pts} pkt${streakSuffix(state.answerStreak)}`
                : state.currentUser ? `✓ Brawo!${streakSuffix(state.answerStreak)}` : '✓ Brawo!';
      showToast(msg, 'correct');
      setTimeout(() => loadQuestion(), 600);
    }
    return;
  }

  state.mistakes++;
  state.isFirstAttempt = false;
  reportMistake(); playSound('wrong');
  if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`)?.classList.add('used');
  input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600);

  if (state.mistakes === 1) {
    showToast('✗ Spróbuj jeszcze raz!', 'wrong');
  } else if (state.mistakes === 2) {
    state.nwdShowGcdHint = true;
    document.getElementById('writtenAddArea').innerHTML = buildNwdHtml(q);
    document.getElementById('nwdInput')?.focus();
    showToast('💡 Zakreśliliśmy wspólne czynniki!', 'wrong');
  } else if (state.mistakes >= 3) {
    state.answerLocked = true;
    showToast(`✗ NWD(${q.a}, ${q.b}) = ${q.gcd}`, 'wrong');
    setTimeout(() => loadQuestion(), 2500);
  }
}

async function checkNww() {
  if (state.answerLocked) return;
  const q = state.currentQuestion;
  const phase = state.nwwPhase;

  // ── Phases: factoring ──────────────────────────────────────
  if (phase === 'factor1' || phase === 'factor2') {
    const expectedFactors = phase === 'factor1' ? q.factorsA : q.factorsB;
    const n = phase === 'factor1' ? q.a : q.b;
    const showSolKey = phase === 'factor1' ? 'nwwShowSolution1' : 'nwwShowSolution2';
    const nextPhase = phase === 'factor1' ? 'factor2' : 'lcm';
    const input = document.getElementById('nwdInput');
    if (!input) return;

    const raw = input.value.trim();
    if (!raw) { input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600); return; }
    const tokens = raw.split(/[\s,]+/).filter(Boolean);
    const nums = tokens.map(t => parseInt(t, 10));
    if (nums.some(isNaN)) { input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600); return; }

    const sorted = [...nums].sort((a, b) => a - b);
    const correct = sorted.length === expectedFactors.length && sorted.every((v, i) => v === expectedFactors[i]);

    if (correct) {
      state.answerLocked = true;
      playSound('correct');
      input.classList.add('correct');
      showToast('✓ Dobrze!', 'correct');
      setTimeout(() => {
        state.nwwPhase = nextPhase;
        state.mistakes = 0;
        state.answerLocked = false;
        [0,1,2].forEach(i => document.getElementById(`dot${i}`)?.classList.remove('used'));
        document.getElementById('writtenAddArea').innerHTML = buildNwwHtml(q);
        document.getElementById(nextPhase === 'lcm' ? 'nwwInput' : 'nwdInput')?.focus();
      }, 600);
      return;
    }

    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake(); playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`)?.classList.add('used');
    input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600);

    if (state.mistakes === 1) {
      const p = expectedFactors[0];
      setNwdHint(`💡 ${n} jest podzielna przez ${p}`);
      showToast(`💡 ${n} jest podzielna przez ${p}`, 'wrong');
    } else if (state.mistakes === 2) {
      const distinct = [...new Set(expectedFactors)];
      const hint = distinct.length >= 2
        ? `💡 ${n} jest podzielna przez ${distinct[0]} i przez ${distinct[1]}`
        : `💡 Czynnik to ${distinct[0]} (pojawia się ${expectedFactors.length} razy)`;
      setNwdHint(hint);
      showToast('💡 Sprawdź podpowiedź poniżej!', 'wrong');
    } else if (state.mistakes >= 3) {
      state[showSolKey] = true;
      state.answerLocked = true;
      document.getElementById('writtenAddArea').innerHTML = buildNwwHtml(q);
      showToast(`✗ Rozwiązanie: ${expectedFactors.join(' × ')}`, 'wrong');
      setTimeout(() => {
        state.nwwPhase = nextPhase;
        state.mistakes = 0;
        state.answerLocked = false;
        state[showSolKey] = false;
        [0,1,2].forEach(i => document.getElementById(`dot${i}`)?.classList.remove('used'));
        document.getElementById('writtenAddArea').innerHTML = buildNwwHtml(q);
        document.getElementById(nextPhase === 'lcm' ? 'nwwInput' : 'nwdInput')?.focus();
      }, 3500);
    } else {
      showToast(`✗ Spróbuj jeszcze raz! (${3 - state.mistakes} szanse)`, 'wrong');
    }
    return;
  }

  // ── Phase: LCM ────────────────────────────────────────────
  const input = document.getElementById('nwwInput');
  if (!input) return;
  const val = parseInt(input.value, 10);
  if (!input.value || isNaN(val)) { input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600); return; }

  if (val === q.lcm) {
    state.answerLocked = true;
    playSound('correct');
    input.classList.add('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 600);
    } else {
      const wasFirst = state.isFirstAttempt && !state.nwwShowLcmHint;
      let pts = 0;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
      }
      reportComeback();
      const msg = pts > 0 ? `✓ Brawo! +${pts} pkt${streakSuffix(state.answerStreak)}`
                : state.currentUser ? `✓ Brawo!${streakSuffix(state.answerStreak)}` : '✓ Brawo!';
      showToast(msg, 'correct');
      setTimeout(() => loadQuestion(), 600);
    }
    return;
  }

  state.mistakes++;
  state.isFirstAttempt = false;
  reportMistake(); playSound('wrong');
  if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`)?.classList.add('used');
  input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600);

  if (state.mistakes === 1) {
    showToast('✗ Spróbuj jeszcze raz!', 'wrong');
  } else if (state.mistakes === 2) {
    state.nwwShowLcmHint = true;
    document.getElementById('writtenAddArea').innerHTML = buildNwwHtml(q);
    document.getElementById('nwwInput')?.focus();
    showToast('💡 Wykreśliliśmy wspólne czynniki!', 'wrong');
  } else if (state.mistakes >= 3) {
    state.answerLocked = true;
    showToast(`✗ NWW(${q.a}, ${q.b}) = ${q.lcm}`, 'wrong');
    setTimeout(() => loadQuestion(), 2500);
  }
}

function buildAbsValueHtml(q) {
  const solved = state.solutionShown;
  const renderK = (latex, display) =>
    (typeof katex !== 'undefined') ? katex.renderToString(latex, { throwOnError: false }) : display;

  const exprHtml = renderK(`\\left|${q.exprLatex}\\right|`, `|${q.exprDisplay}|`);

  if (solved) {
    const ansHtml = renderK(q.answerLatex, q.answerDisplay);
    return `<div class="abs-wrap">
      <div class="abs-expr">${exprHtml}</div>
      <div class="abs-solution">${renderK(`\\left|${q.exprLatex}\\right|`, `|${q.exprDisplay}|`)} = <span class="abs-answer-val">${ansHtml}</span></div>
    </div>`;
  }

  return `<div class="abs-wrap">
    <div class="abs-expr">${exprHtml}</div>
    <div class="abs-input-row">
      <input id="absInput" class="abs-input" type="text" placeholder="np. sqrt5, π, 3-√2"
        autocomplete="off" spellcheck="false" onkeydown="if(event.key==='Enter')checkAnswer()">
    </div>
    <div class="abs-symbols">
      <button class="abs-sym-btn" onclick="absInsert('√')">√</button>
      <button class="abs-sym-btn" onclick="absInsert('π')">π</button>
      <button class="abs-sym-btn" onclick="absInsert(' - ')">−</button>
      <button class="abs-sym-btn" onclick="absInsert(' + ')">+</button>
    </div>
    <div class="abs-fmt-note">Możesz pisać: sqrt5, pi, lub klikać przyciski</div>
  </div>`;
}

async function checkAbsValue() {
  if (state.answerLocked) return;
  const q = state.currentQuestion;
  if (state.solutionShown) {
    const input = document.getElementById('absInput');
    const val = evalSymbolicExpr(input?.value ?? '');
    if (!isNaN(val) && Math.abs(val - q.answerNumeric) < 0.01) {
      input.classList.add('correct');
      state.answerLocked = true;
      setTimeout(() => loadQuestion(), 500);
    } else {
      input?.classList.add('wrong'); setTimeout(() => input?.classList.remove('wrong'), 600);
      const renderK = (l, d) => (typeof katex !== 'undefined') ? katex.renderToString(l, { throwOnError: false }) : d;
      showToast(`✗ Odpowiedź: ${renderK(q.answerLatex, q.answerDisplay)}`, 'wrong');
    }
    return;
  }

  const input = document.getElementById('absInput');
  const raw = input?.value.trim() ?? '';
  if (!raw) { input?.classList.add('wrong'); setTimeout(() => input?.classList.remove('wrong'), 600); return; }

  const val = evalSymbolicExpr(raw);
  if (isNaN(val)) {
    input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600);
    showToast('✗ Nie rozpoznaję wyrażenia — sprawdź zapis', 'wrong'); return;
  }

  const isExact = Math.abs(val - q.answerNumeric) < 1e-9;
  const isApprox = !isExact && Math.abs(val - q.answerNumeric) < 0.01;

  if (isExact || isApprox) {
    state.answerLocked = true;
    playSound('correct');
    input.classList.add('correct');
    const renderK = (l, d) => (typeof katex !== 'undefined') ? katex.renderToString(l, { throwOnError: false }) : d;
    if (state.challengeActive) {
      state.challengeCorrect++; state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      const approxNote = isApprox ? ` (dokładnie: ${renderK(q.answerLatex, q.answerDisplay)})` : '';
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}${approxNote}`, 'correct');
      setTimeout(() => loadQuestion(), isApprox ? 1800 : 500);
    } else {
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      let pts = 0;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
      }
      reportComeback();
      const approxNote = isApprox ? ` Dokładnie: ${renderK(q.answerLatex, q.answerDisplay)}` : '';
      const base = pts > 0 ? `✓ Brawo! +${pts} pkt${streakSuffix(state.answerStreak)}`
                 : state.currentUser ? `✓ Brawo!${streakSuffix(state.answerStreak)}` : '✓ Brawo!';
      showToast(base + approxNote, 'correct');
      setTimeout(() => loadQuestion(), isApprox ? 1800 : 500);
    }
    return;
  }

  const isWrongSign = Math.abs(val + q.answerNumeric) < 0.01;

  state.mistakes++; state.isFirstAttempt = false;
  reportMistake(); playSound('wrong');
  if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`)?.classList.add('used');
  input.classList.add('wrong'); setTimeout(() => input.classList.remove('wrong'), 600);

  if (state.mistakes === 1) {
    showToast(isWrongSign ? '💡 Wartość bezwzględna jest zawsze ≥ 0!' : '✗ Spróbuj jeszcze raz!', 'wrong');
  } else if (state.mistakes === 2) {
    const hint = q.signHint ?? 'Wartość bezwzględna to odległość od zera — zawsze ≥ 0';
    const wrap = document.querySelector('.abs-wrap');
    if (wrap && !wrap.querySelector('.abs-hint')) {
      const h = document.createElement('div'); h.className = 'abs-hint'; h.textContent = `💡 ${hint}`; wrap.appendChild(h);
    }
    showToast('💡 Sprawdź podpowiedź poniżej!', 'wrong');
  } else if (state.mistakes >= 3) {
    state.solutionShown = true; state.answerLocked = true;
    document.getElementById('writtenAddArea').innerHTML = buildAbsValueHtml(q);
    const renderK = (l, d) => (typeof katex !== 'undefined') ? katex.renderToString(l, { throwOnError: false }) : d;
    showToast(`✗ Odpowiedź: ${renderK(q.answerLatex, q.answerDisplay)}`, 'wrong');
    setTimeout(() => loadQuestion(), 2500);
  } else {
    showToast(`✗ Spróbuj jeszcze raz! (${3 - state.mistakes} szanse)`, 'wrong');
  }
}

function buildIntCompareHtml(q) {
  const fmt = n => n < 0 ? `−${Math.abs(n)}` : String(n);
  return `
    <div class="ic-wrap">
      <div class="ic-row">
        <span class="ic-num">${fmt(q.a)}</span>
        <div class="ic-btns-v">
          <button class="ic-btn" data-sym="<" onclick="submitIntCompare('<')">&lt;</button>
          <button class="ic-btn" data-sym=">" onclick="submitIntCompare('>')">&gt;</button>
          <button class="ic-btn" data-sym="=" onclick="submitIntCompare('=')">=</button>
        </div>
        <span class="ic-num">${fmt(q.b)}</span>
      </div>
      <div id="icHint" class="ic-hint" style="display:none"></div>
    </div>`;
}

function buildIntOrderHtml(q) {
  const fmt = n => n < 0 ? `−${Math.abs(n)}` : String(n);
  const tiles = q.nums.map(n => `<div class="io-tile" draggable="true" data-val="${n}">${fmt(n)}</div>`).join('');
  const dir = q.direction === 'asc' ? 'rosnącej ↑' : 'malejącej ↓';
  return `
    <div class="io-wrap">
      <div class="io-prompt">Uszereguj w kolejności <strong>${dir}</strong>:</div>
      <div id="ioSortArea" class="io-sort-area">${tiles}</div>
      <div class="io-drag-note">Przeciągnij kafelki w odpowiedniej kolejności</div>
      <div id="ioHint" class="ic-hint" style="display:none"></div>
    </div>`;
}

function initIntOrderDrag() {
  const area = document.getElementById('ioSortArea');
  if (!area) return;
  let dragging = null;

  area.addEventListener('dragstart', e => {
    dragging = e.target.closest('.io-tile');
    if (dragging) setTimeout(() => dragging.classList.add('io-dragging'), 0);
  });
  area.addEventListener('dragend', () => {
    if (dragging) dragging.classList.remove('io-dragging');
    dragging = null;
    area.querySelectorAll('.io-tile').forEach(t => t.classList.remove('io-drag-over'));
  });
  area.addEventListener('dragover', e => {
    e.preventDefault();
    const target = e.target.closest('.io-tile');
    if (target && target !== dragging) {
      area.querySelectorAll('.io-tile').forEach(t => t.classList.remove('io-drag-over'));
      target.classList.add('io-drag-over');
    }
  });
  area.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.io-tile');
    if (target && target !== dragging && dragging) {
      const rect = target.getBoundingClientRect();
      area.insertBefore(dragging, e.clientX < rect.left + rect.width / 2 ? target : target.nextSibling);
    }
    area.querySelectorAll('.io-tile').forEach(t => t.classList.remove('io-drag-over'));
  });

  // Touch support
  let touchEl = null, touchClone = null, touchOffX = 0, touchOffY = 0;
  area.addEventListener('touchstart', e => {
    const tile = e.target.closest('.io-tile');
    if (!tile || state.answerLocked) return;
    touchEl = tile;
    touchEl.classList.add('io-dragging');
    const touch = e.touches[0];
    const r = tile.getBoundingClientRect();
    touchOffX = touch.clientX - r.left;
    touchOffY = touch.clientY - r.top;
    touchClone = tile.cloneNode(true);
    touchClone.style.cssText = `position:fixed;pointer-events:none;z-index:9999;opacity:.85;width:${r.width}px;`;
    touchClone.style.left = (touch.clientX - touchOffX) + 'px';
    touchClone.style.top  = (touch.clientY - touchOffY) + 'px';
    document.body.appendChild(touchClone);
    e.preventDefault();
  }, { passive: false });
  area.addEventListener('touchmove', e => {
    if (!touchEl || !touchClone) return;
    const touch = e.touches[0];
    touchClone.style.left = (touch.clientX - touchOffX) + 'px';
    touchClone.style.top  = (touch.clientY - touchOffY) + 'px';
    const target = document.elementsFromPoint(touch.clientX, touch.clientY)
      .find(el => el.classList.contains('io-tile') && el !== touchEl);
    area.querySelectorAll('.io-tile').forEach(t => t.classList.remove('io-drag-over'));
    if (target) target.classList.add('io-drag-over');
    e.preventDefault();
  }, { passive: false });
  area.addEventListener('touchend', e => {
    if (!touchEl) return;
    const touch = e.changedTouches[0];
    const target = document.elementsFromPoint(touch.clientX, touch.clientY)
      .find(el => el.classList.contains('io-tile') && el !== touchEl);
    if (target) {
      const rect = target.getBoundingClientRect();
      area.insertBefore(touchEl, touch.clientX < rect.left + rect.width / 2 ? target : target.nextSibling);
    }
    touchEl.classList.remove('io-dragging');
    area.querySelectorAll('.io-tile').forEach(t => t.classList.remove('io-drag-over'));
    if (touchClone) { document.body.removeChild(touchClone); touchClone = null; }
    touchEl = null;
    e.preventDefault();
  }, { passive: false });
}

async function submitIntCompare(sym) {
  const q = state.currentQuestion;
  if (!q || q.type !== 'int_compare' || state.answerLocked) return;
  const fmt = n => n < 0 ? `−${Math.abs(n)}` : String(n);
  if (sym === q.answer) {
    state.answerLocked = true;
    playSound('correct');
    document.querySelectorAll('.ic-btn').forEach(b => { if (b.dataset.sym === sym) b.classList.add('ic-btn-correct'); });
    let pts = 0;
    const wasFirst = state.isFirstAttempt && !state.solutionShown;
    if (wasFirst) {
      state.answerStreak++;
      if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
    }
    reportComeback();
    const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
    showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
    setTimeout(() => loadQuestion(), 400);
  } else {
    state.mistakes++;
    state.isFirstAttempt = false;
    state.answerStreak = 0;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');
    document.querySelectorAll('.ic-btn').forEach(b => {
      if (b.dataset.sym === sym) { b.classList.add('ic-btn-wrong'); setTimeout(() => b.classList.remove('ic-btn-wrong'), 500); }
    });
    const hintEl = document.getElementById('icHint');
    if (state.mistakes >= 3) {
      state.solutionShown = true;
      if (hintEl) { hintEl.textContent = `Odpowiedź: ${fmt(q.a)} ${q.answer} ${fmt(q.b)}`; hintEl.style.display = ''; }
      setTimeout(() => loadQuestion(), 2000);
    } else if (state.mistakes === 2 && q.hint && hintEl) {
      hintEl.textContent = `💡 ${q.hint}`;
      hintEl.style.display = '';
    } else {
      showToast('✗ Spróbuj jeszcze raz!', 'wrong');
    }
  }
}

function buildFractionCompareHtml(q) {
  const frac = (num, den) => `<div class="fc-frac"><span class="fc-top">${num}</span><span class="fc-bar"></span><span class="fc-bot">${den}</span></div>`;
  const side = (whole, a, b) => whole != null
    ? `<div class="fc-mixed"><span class="fc-whole">${whole}</span>${frac(a, b)}</div>`
    : frac(a, b);
  return `
    <div class="ic-wrap">
      <div class="ic-row">
        <div class="fc-num">${side(q.whole1, q.a1, q.b1)}</div>
        <div class="ic-btns-v">
          <button class="ic-btn" data-sym="<" onclick="submitFractionCompare('<')">&lt;</button>
          <button class="ic-btn" data-sym=">" onclick="submitFractionCompare('>')">&gt;</button>
        </div>
        <div class="fc-num">${side(q.whole2, q.a2, q.b2)}</div>
      </div>
      <div id="icHint" class="ic-hint" style="display:none"></div>
    </div>`;
}

async function submitFractionCompare(sym) {
  const q = state.currentQuestion;
  if (!q || q.type !== 'fraction_compare' || state.answerLocked) return;
  const fracStr = (w, a, b) => w != null ? `${w} ${a}/${b}` : `${a}/${b}`;
  if (sym === q.ans) {
    state.answerLocked = true;
    playSound('correct');
    document.querySelectorAll('.ic-btn').forEach(b => { if (b.dataset.sym === sym) b.classList.add('ic-btn-correct'); });
    let pts = 0;
    const wasFirst = state.isFirstAttempt && !state.solutionShown;
    if (wasFirst) {
      state.answerStreak++;
      if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
    }
    reportComeback();
    const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
    showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
    setTimeout(() => loadQuestion(), 400);
  } else {
    state.mistakes++;
    state.isFirstAttempt = false;
    state.answerStreak = 0;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');
    document.querySelectorAll('.ic-btn').forEach(b => {
      if (b.dataset.sym === sym) { b.classList.add('ic-btn-wrong'); setTimeout(() => b.classList.remove('ic-btn-wrong'), 500); }
    });
    const hintEl = document.getElementById('icHint');
    if (state.mistakes >= 3) {
      state.solutionShown = true;
      const ans = `${fracStr(q.whole1, q.a1, q.b1)} ${q.ans} ${fracStr(q.whole2, q.a2, q.b2)}`;
      if (hintEl) { hintEl.textContent = `Odpowiedź: ${ans}`; hintEl.style.display = ''; }
      setTimeout(() => loadQuestion(), 2000);
    } else if (state.mistakes === 2 && q.hint && hintEl) {
      hintEl.textContent = `💡 ${q.hint}`;
      hintEl.style.display = '';
    } else {
      showToast('✗ Spróbuj jeszcze raz!', 'wrong');
    }
  }
}

function buildFractionOpHtml(q) {
  const opSym = q.op === 'extend' ? `×${q.k}` : `÷${q.k}`;
  const solved = q.solutionShown;
  const inp = (id, val) => `<input id="${id}" class="fr-input fop-inp" type="number" min="1" value="${solved ? val : ''}" ${solved ? 'disabled' : ''} onkeydown="if(event.key==='Enter')checkAnswer()">`;
  return `
    <div class="fop-wrap">
      <div class="fop-row">
        <div class="fc-frac"><span class="fc-top">${q.a}</span><span class="fc-bar"></span><span class="fc-bot">${q.b}</span></div>
        <div class="fop-op">${opSym}</div>
        <span class="fop-eq">=</span>
        <div class="fc-frac">
          ${inp('fopNum', q.ans_a)}
          <span class="fc-bar" style="min-width:52px"></span>
          ${inp('fopDen', q.ans_b)}
        </div>
      </div>
      <div id="fopHint" class="ic-hint" style="display:none"></div>
    </div>`;
}

async function checkFractionOp() {
  const q = state.currentQuestion;
  if (!q || q.type !== 'fraction_op' || state.answerLocked) return;
  const num = parseInt(document.getElementById('fopNum')?.value);
  const den = parseInt(document.getElementById('fopDen')?.value);
  const correct = num === q.ans_a && den === q.ans_b;
  const hintEl = document.getElementById('fopHint');
  if (correct) {
    state.answerLocked = true;
    playSound('correct');
    ['fopNum','fopDen'].forEach(id => document.getElementById(id)?.classList.add('correct'));
    let pts = 0;
    const wasFirst = state.isFirstAttempt && !state.solutionShown;
    if (wasFirst) {
      state.answerStreak++;
      if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
    }
    reportComeback();
    const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
    showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
    setTimeout(() => loadQuestion(), 400);
  } else {
    state.mistakes++;
    state.isFirstAttempt = false;
    state.answerStreak = 0;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');
    ['fopNum','fopDen'].forEach(id => { const el = document.getElementById(id); if (el) { el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong'), 600); }});
    if (state.mistakes >= 3) {
      state.solutionShown = true; state.answerLocked = true;
      document.getElementById('writtenAddArea').innerHTML = buildFractionOpHtml(q);
      showToast(`✗ Odpowiedź: ${q.ans_a}/${q.ans_b}`, 'wrong');
      setTimeout(() => loadQuestion(), 2500);
    } else if (state.mistakes === 2 && hintEl) {
      hintEl.textContent = `💡 ${q.hint}`; hintEl.style.display = '';
    } else {
      showToast('✗ Spróbuj jeszcze raz!', 'wrong');
    }
  }
}

function buildFractionEqCheckHtml(q) {
  const frac = (a, b) => `<div class="fc-frac"><span class="fc-top">${a}</span><span class="fc-bar"></span><span class="fc-bot">${b}</span></div>`;
  return `
    <div class="ic-wrap">
      <div class="ic-row">
        <div class="fc-num">${frac(q.a1, q.b1)}</div>
        <div class="ic-btns-v">
          <button class="ic-btn" data-sym="=" onclick="submitFractionEqCheck('=')">=</button>
          <button class="ic-btn" data-sym="≠" onclick="submitFractionEqCheck('≠')">≠</button>
        </div>
        <div class="fc-num">${frac(q.a2, q.b2)}</div>
      </div>
      <div id="icHint" class="ic-hint" style="display:none"></div>
    </div>`;
}

async function submitFractionEqCheck(sym) {
  const q = state.currentQuestion;
  if (!q || q.type !== 'fraction_eq_check' || state.answerLocked) return;
  if (sym === q.ans) {
    state.answerLocked = true;
    playSound('correct');
    document.querySelectorAll('.ic-btn').forEach(b => { if (b.dataset.sym === sym) b.classList.add('ic-btn-correct'); });
    let pts = 0;
    const wasFirst = state.isFirstAttempt && !state.solutionShown;
    if (wasFirst) {
      state.answerStreak++;
      if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
    }
    reportComeback();
    const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
    showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
    setTimeout(() => loadQuestion(), 400);
  } else {
    state.mistakes++;
    state.isFirstAttempt = false;
    state.answerStreak = 0;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');
    document.querySelectorAll('.ic-btn').forEach(b => {
      if (b.dataset.sym === sym) { b.classList.add('ic-btn-wrong'); setTimeout(() => b.classList.remove('ic-btn-wrong'), 500); }
    });
    const hintEl = document.getElementById('icHint');
    if (state.mistakes >= 3) {
      state.solutionShown = true;
      const ans = `${q.a1}/${q.b1} ${q.ans} ${q.a2}/${q.b2}`;
      if (hintEl) { hintEl.textContent = `Odpowiedź: ${ans}`; hintEl.style.display = ''; }
      setTimeout(() => loadQuestion(), 2000);
    } else if (state.mistakes === 2 && q.hint && hintEl) {
      hintEl.textContent = `💡 ${q.hint}`; hintEl.style.display = '';
    } else {
      showToast('✗ Spróbuj jeszcze raz!', 'wrong');
    }
  }
}

async function checkIntOrder() {
  const q = state.currentQuestion;
  const area = document.getElementById('ioSortArea');
  if (!area || state.answerLocked) return;
  const fmt = n => n < 0 ? `−${Math.abs(n)}` : String(n);
  const nums = [...area.querySelectorAll('.io-tile')].map(t => parseInt(t.dataset.val, 10));
  const correct = nums.every((n, i) => n === q.sorted[i]);
  if (correct) {
    state.answerLocked = true;
    area.querySelectorAll('.io-tile').forEach(t => t.classList.add('io-tile-correct'));
    playSound('correct');
    let pts = 0;
    const wasFirst = state.isFirstAttempt && !state.solutionShown;
    if (wasFirst) {
      state.answerStreak++;
      if (state.currentUser) { pts = await recordCorrect(state.currentTopic); showPointsPop(pts); updateStatsRow(); checkStreakBonus(); }
    }
    reportComeback();
    const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
    showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
    setTimeout(() => loadQuestion(), 600);
  } else {
    state.mistakes++;
    state.isFirstAttempt = false;
    state.answerStreak = 0;
    reportMistake();
    area.querySelectorAll('.io-tile').forEach(t => {
      t.classList.add('io-tile-wrong');
      setTimeout(() => t.classList.remove('io-tile-wrong'), 600);
    });
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');
    const hintEl = document.getElementById('ioHint');
    if (state.mistakes >= 3) {
      state.answerLocked = true;
      state.solutionShown = true;
      const solutionStr = q.sorted.map(fmt).join(', ');
      if (hintEl) { hintEl.textContent = `Poprawna kolejność: ${solutionStr}`; hintEl.style.display = ''; }
      setTimeout(() => loadQuestion(), 2500);
    } else if (state.mistakes === 2) {
      const sep = q.direction === 'asc' ? ' < ' : ' > ';
      if (hintEl) { hintEl.textContent = `💡 ${q.hint}\nWskazówka: ${q.sorted.map(fmt).join(sep)}`; hintEl.style.display = ''; }
    } else {
      if (hintEl) { hintEl.textContent = `💡 ${q.hint}`; hintEl.style.display = ''; }
    }
  }
}

function generateQuestion(topic, difficulty) {
  const gen = TOPIC_GENERATORS[topic];
  if (gen) return gen(difficulty);
  const d = difficulty;
  const a = rand(d === 'easy' ? 1 : 10, d === 'easy' ? 20 : 200);
  const b = rand(d === 'easy' ? 1 : 5, d === 'easy' ? 10 : 100);
  return { q: `${a} + ${b} = ?`, a: a + b };
}

function markWipTopics() {
  document.querySelectorAll('.topic-btn').forEach(btn => {
    const onclick = btn.getAttribute('onclick') || '';
    if (!onclick.startsWith('selectTopic(')) return; // aids buttons are always clickable
    const match = onclick.match(/'([^']+)'/);
    if (match && !TOPIC_GENERATORS[match[1]]) btn.classList.add('wip');
  });
}

// ============================================================
// QUESTION LOADING
// ============================================================

function loadQuestion() {
  if (!state.currentTopic) return;
  const q = generateQuestion(state.currentTopic, state.currentDifficulty);
  state.currentQuestion = q;
  state.currentAnswer = q.a ?? q.answer;
  state.mistakes = 0;
  state.isFirstAttempt = true;
  state.answerLocked = false;
  state.solutionShown = false;

  const hintLine = document.getElementById('questionHintLine');
  if (hintLine) hintLine.style.display = 'none';

  const isWA = q.type === 'written-addition' || q.type === 'written-subtraction' || q.type === 'written-multiplication' || q.type === 'written-division' || q.type === 'rounding' || q.type === 'comparison' || q.type === 'divisibility' || q.type === 'power' || q.type === 'order_ops' || q.type === 'num_write' || q.type === 'function_q' || q.type === 'sqrt_bounds' || q.type === 'prime_factors' || q.type === 'nwd' || q.type === 'nww' || q.type === 'abs_value' || q.type === 'int_compare' || q.type === 'int_order' || q.type === 'div_rem' || q.type === 'fraction_read' || q.type === 'fraction_compare' || q.type === 'fraction_op' || q.type === 'fraction_eq_check';
  const questionText = document.getElementById('questionText');
  const answerInput  = document.getElementById('answerInput');
  const waArea       = document.getElementById('writtenAddArea');

  document.getElementById('solutionReveal').classList.remove('show');
  [0,1,2].forEach(i => document.getElementById(`dot${i}`).classList.remove('used'));

  if (isWA) {
    questionText.style.display = 'none';
    answerInput.style.display  = 'none';
    waArea.style.display       = '';
    if (q.type !== 'function_q' && q.type !== 'int_compare') document.getElementById('checkBtn').style.display = '';
    if (q.type === 'written-multiplication') {
      waArea.innerHTML = buildWMHtml(q);
      const isMulti = q.partials.length > 1;
      if (isMulti) {
        document.getElementById(`wmp-0-${q.partials[0].shift}`)?.focus();
      } else {
        document.getElementById('wain-0')?.focus();
      }
    } else if (q.type === 'written-division') {
      waArea.innerHTML = buildWDHtml(q);
      document.getElementById('wdq-0')?.focus();
    } else if (q.type === 'rounding') {
      waArea.innerHTML = buildRoundingHtml(q);
      document.getElementById('rnd-answer')?.focus();
    } else if (q.type === 'comparison') {
      waArea.innerHTML = buildComparisonHtml(q);
      document.getElementById('cmp-answer')?.focus();
    } else if (q.type === 'divisibility') {
      waArea.innerHTML = buildDivisibilityHtml(q);
    } else if (q.type === 'power') {
      waArea.innerHTML = buildPowerHtml(q);
      document.getElementById('pow-answer')?.focus();
    } else if (q.type === 'order_ops') {
      waArea.innerHTML = buildOrderOpsHtml(q);
      document.getElementById('oop-answer')?.focus();
    } else if (q.type === 'num_write') {
      waArea.innerHTML = buildNumWriteHtml(q);
    } else if (q.type === 'function_q') {
      waArea.innerHTML = buildFunctionQHtml(q);
      document.getElementById('checkBtn').style.display = 'none';
    } else if (q.type === 'sqrt_bounds') {
      waArea.innerHTML = buildSqrtBoundsHtml(q);
      document.getElementById('sqrtLo')?.focus();
    } else if (q.type === 'prime_factors') {
      waArea.innerHTML = buildPrimeFactorsHtml(q);
      document.getElementById('pfInput')?.focus();
    } else if (q.type === 'nwd') {
      state.nwdPhase = 'factor1';
      state.nwdShowSolution1 = false;
      state.nwdShowSolution2 = false;
      state.nwdShowSolution3 = false;
      state.nwdShowGcdHint = false;
      waArea.innerHTML = buildNwdHtml(q);
      document.getElementById('nwdInput')?.focus();
    } else if (q.type === 'nww') {
      state.nwwPhase = 'factor1';
      state.nwwShowSolution1 = false;
      state.nwwShowSolution2 = false;
      state.nwwShowLcmHint = false;
      waArea.innerHTML = buildNwwHtml(q);
      document.getElementById('nwdInput')?.focus();
    } else if (q.type === 'abs_value') {
      waArea.innerHTML = buildAbsValueHtml(q);
      document.getElementById('absInput')?.focus();
    } else if (q.type === 'int_compare') {
      waArea.innerHTML = buildIntCompareHtml(q);
      document.getElementById('checkBtn').style.display = 'none';
    } else if (q.type === 'int_order') {
      waArea.innerHTML = buildIntOrderHtml(q);
      initIntOrderDrag();
    } else if (q.type === 'div_rem') {
      waArea.innerHTML = buildDivRemHtml(q);
      document.getElementById('drQuot')?.focus();
    } else if (q.type === 'fraction_read') {
      waArea.innerHTML = buildFractionReadHtml(q);
      document.getElementById('frNum')?.focus();
    } else if (q.type === 'fraction_compare') {
      waArea.innerHTML = buildFractionCompareHtml(q);
      document.getElementById('checkBtn').style.display = 'none';
    } else if (q.type === 'fraction_op') {
      waArea.innerHTML = buildFractionOpHtml(q);
      document.getElementById('fopNum')?.focus();
    } else if (q.type === 'fraction_eq_check') {
      waArea.innerHTML = buildFractionEqCheckHtml(q);
      document.getElementById('checkBtn').style.display = 'none';
    } else {
      waArea.innerHTML = buildWAHtml(q);
      document.getElementById('wain-0')?.focus(); // start od jedności (prawy)
    }
  } else {
    questionText.style.display = '';
    answerInput.style.display  = '';
    waArea.style.display       = 'none';
    document.getElementById('checkBtn').style.display = '';
    waArea.innerHTML           = '';
    if (q.q_html) { questionText.innerHTML = q.q_html; }
    else           { questionText.textContent = q.q; }
    answerInput.value          = '';
    answerInput.className      = 'answer-input';
    const isStringAnswer = typeof state.currentAnswer === 'string';
    answerInput.type        = isStringAnswer ? 'text' : 'number';
    answerInput.placeholder = q.placeholder || (isStringAnswer ? 'np. XIV' : '?');
    answerInput.focus();
  }

  const progress = getTopicProgress(state.currentTopic);
  const pts = calcPoints(progress.done);
  document.getElementById('pointsInfo').textContent = `+${pts} pkt za pierwszą próbę`;
  state.questionIndex++;
  document.getElementById('questionNum').textContent = `Zadanie #${state.questionIndex}`;
}

function nextQuestion() {
  loadQuestion();
}

function handleAnswerKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    checkAnswer();
  }
}

// ============================================================
// ANSWER CHECKING
// ============================================================

async function checkWrittenAddition() {
  const q = state.currentQuestion;
  const ansStr = String(q.answer);
  const cols = ansStr.length;

  const inputs = Array.from({ length: cols }, (_, i) => document.getElementById(`wain-${i}`));
  if (inputs.some(inp => !inp || inp.value === '')) {
    showToast('Uzupełnij wszystkie cyfry!', 'wrong');
    inputs.find(inp => inp && inp.value === '')?.focus();
    return;
  }

  let allCorrect = true;
  for (let c = 0; c < cols; c++) {
    const inp = inputs[c];
    const correct = ansStr[ansStr.length - 1 - c];
    inp.classList.remove('correct', 'wrong');
    inp.classList.add(inp.value === correct ? 'correct' : 'wrong');
    if (inp.value !== correct) allCorrect = false;
  }

  if (allCorrect) {
    state.answerLocked = true;
    playSound('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 500);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 600);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    // Po pierwszym błędzie: pokaż przeniesienia
    if (state.mistakes === 1) {
      document.querySelector('.wa-block')?.classList.add('carries-visible');
    }

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      for (let c = 0; c < cols; c++) {
        const inp = inputs[c];
        inp.value = ansStr[ansStr.length - 1 - c];
        inp.classList.remove('wrong'); inp.classList.add('correct');
      }
      showToast(`Poprawna: ${q.answer}`, 'wrong');
    } else if (!state.solutionShown) {
      showToast(`✗ Sprawdź cyfry! (${3 - state.mistakes} ${3 - state.mistakes === 1 ? 'szansa' : 'szanse'})`, 'wrong');
      setTimeout(() => inputs.forEach(inp => inp.classList.remove('wrong')), 1000);
    }
  }
}

async function checkWrittenMultiplication() {
  const q = state.currentQuestion;
  const { answer, partials } = q;
  const isMulti = partials.length > 1;

  if (!isMulti) {
    // Łatwe: jednocyfrowy mnożnik – te same wain- ID-ki, reużyj checkWrittenAddition
    await checkWrittenAddition();
    return;
  }

  // Średnie/wyzwanie: iloczyny cząstkowe + wynik końcowy
  const resCols = String(answer).length;
  const ansStr = String(answer);

  // Zbierz inputy iloczynów cząstkowych
  const partialMeta = [];
  for (let pIdx = 0; pIdx < partials.length; pIdx++) {
    const pStr = String(partials[pIdx].value);
    const s = partials[pIdx].shift;
    const maxC = s + pStr.length - 1;
    for (let c = s; c <= maxC; c++) {
      const inp = document.getElementById(`wmp-${pIdx}-${c}`);
      if (inp) partialMeta.push({ inp, pIdx, c, s, pStr });
    }
  }

  const resMeta = Array.from({ length: resCols }, (_, i) => ({
    inp: document.getElementById(`wmr-${i}`), c: i
  }));

  // Sprawdź czy wszystkie wypełnione
  const empP = partialMeta.find(x => x.inp.value === '');
  const empR = resMeta.find(x => x.inp && x.inp.value === '');
  if (empP || empR) {
    showToast('Uzupełnij wszystkie cyfry!', 'wrong');
    (empP || empR).inp.focus();
    return;
  }

  // Walidacja
  let allCorrect = true;

  for (const { inp, c, s, pStr } of partialMeta) {
    const pCol = c - s;
    const correct = pStr[pStr.length - 1 - pCol];
    inp.classList.remove('correct', 'wrong');
    inp.classList.add(inp.value === correct ? 'correct' : 'wrong');
    if (inp.value !== correct) allCorrect = false;
  }

  for (const { inp, c } of resMeta) {
    if (!inp) continue;
    const correct = ansStr[ansStr.length - 1 - c];
    inp.classList.remove('correct', 'wrong');
    inp.classList.add(inp.value === correct ? 'correct' : 'wrong');
    if (inp.value !== correct) allCorrect = false;
  }

  if (allCorrect) {
    state.answerLocked = true;
    playSound('correct');
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 500);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 600);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      // Uzupełnij poprawne wartości wszędzie
      for (const { inp, c, s, pStr } of partialMeta) {
        const pCol = c - s;
        inp.value = pStr[pStr.length - 1 - pCol];
        inp.classList.remove('wrong'); inp.classList.add('correct');
      }
      for (const { inp, c } of resMeta) {
        if (!inp) continue;
        inp.value = ansStr[ansStr.length - 1 - c];
        inp.classList.remove('wrong'); inp.classList.add('correct');
      }
      showToast(`Poprawna: ${q.answer}`, 'wrong');
    } else if (!state.solutionShown) {
      showToast(`✗ Sprawdź cyfry! (${3 - state.mistakes} ${3 - state.mistakes === 1 ? 'szansa' : 'szanse'})`, 'wrong');
      const allInps = [...partialMeta.map(x => x.inp), ...resMeta.map(x => x.inp)].filter(Boolean);
      setTimeout(() => allInps.forEach(inp => inp.classList.remove('wrong')), 1000);
    }
  }
}

// Dzielenie pisemne – nawigacja (L→R, bo iloraz czytamy od lewej)
function wdHandleInput(e, idx, maxIdx) {
  const v = e.target.value.replace(/[^0-9]/g, '');
  e.target.value = v.slice(-1);
  if (v && idx < maxIdx) document.getElementById(`wdq-${idx + 1}`)?.focus();
}
function wdHandleKey(e, idx, maxIdx) {
  if (e.key === 'Backspace' && !e.target.value && idx > 0)
    document.getElementById(`wdq-${idx - 1}`)?.focus();
  if (e.key === 'ArrowRight' && idx < maxIdx) { e.preventDefault(); document.getElementById(`wdq-${idx + 1}`)?.focus(); }
  if (e.key === 'ArrowLeft'  && idx > 0)      { e.preventDefault(); document.getElementById(`wdq-${idx - 1}`)?.focus(); }
  if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
}

async function checkWrittenDivision() {
  const q = state.currentQuestion;
  const { steps } = q;
  const k = steps.length;
  const inputs = Array.from({ length: k }, (_, i) => document.getElementById(`wdq-${i}`));

  const empty = inputs.find(inp => inp && inp.value === '');
  if (empty) { showToast('Uzupełnij wszystkie cyfry!', 'wrong'); empty.focus(); return; }

  let allCorrect = true;
  inputs.forEach((inp, i) => {
    const correct = String(steps[i].qDigit);
    inp.classList.remove('correct', 'wrong');
    inp.classList.add(inp.value === correct ? 'correct' : 'wrong');
    if (inp.value !== correct) allCorrect = false;
  });

  if (allCorrect) {
    state.answerLocked = true;
    playSound('correct');
    // Zawsze pokaż kroki słupka po poprawnej odpowiedzi (jeśli jeszcze nie widoczne)
    const hintEl = document.getElementById('wd-steps');
    if (hintEl && !hintEl.innerHTML) hintEl.innerHTML = buildWDHintHtml(q);
    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => loadQuestion(), 1200);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      showToast(pts > 0 ? `✓ Brawo! +${pts} pkt${suf}` : `✓ Brawo!${suf}`, 'correct');
      setTimeout(() => loadQuestion(), 1400);
    }
  } else {
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    playSound('wrong');
    if (state.mistakes <= 3) document.getElementById(`dot${state.mistakes - 1}`).classList.add('used');

    if (state.mistakes >= 3 && !state.solutionShown) {
      state.solutionShown = true;
      inputs.forEach((inp, i) => {
        inp.value = String(steps[i].qDigit);
        inp.classList.remove('wrong'); inp.classList.add('correct');
      });
      showToast(`Poprawna: ${q.answer}`, 'wrong');
    } else if (!state.solutionShown) {
      // Pokaż podpowiedź po pierwszym błędzie
      if (state.mistakes === 1) {
        const hintEl = document.getElementById('wd-steps');
        if (hintEl) hintEl.innerHTML = buildWDHintHtml(q);
      }
      const left = 3 - state.mistakes;
      showToast(`✗ Sprawdź cyfry! (${left} ${left === 1 ? 'szansa' : 'szanse'})`, 'wrong');
      setTimeout(() => inputs.forEach(inp => inp.classList.remove('wrong')), 1000);
    }
  }
}

async function checkAnswer() {
  if (state.answerLocked) return;
  if (state.currentQuestion?.type === 'written-addition' ||
      state.currentQuestion?.type === 'written-subtraction') { await checkWrittenAddition(); return; }
  if (state.currentQuestion?.type === 'written-multiplication') { await checkWrittenMultiplication(); return; }
  if (state.currentQuestion?.type === 'written-division') { await checkWrittenDivision(); return; }
  if (state.currentQuestion?.type === 'rounding') { await checkRounding(); return; }
  if (state.currentQuestion?.type === 'comparison')   { await checkComparison(); return; }
  if (state.currentQuestion?.type === 'divisibility') { await checkDivisibility(); return; }
  if (state.currentQuestion?.type === 'power')        { await checkPower(); return; }
  if (state.currentQuestion?.type === 'order_ops')    { await checkOrderOps(); return; }
  if (state.currentQuestion?.type === 'num_write')    { await checkNumWrite(); return; }
  if (state.currentQuestion?.type === 'function_q')  return; // obsługiwane przez klik TAK/NIE
  if (state.currentQuestion?.type === 'sqrt_bounds') { await checkSqrtBounds(); return; }
  if (state.currentQuestion?.type === 'prime_factors') { await checkPrimeFactors(); return; }
  if (state.currentQuestion?.type === 'nwd') { await checkNwd(); return; }
  if (state.currentQuestion?.type === 'nww') { await checkNww(); return; }
  if (state.currentQuestion?.type === 'abs_value') { await checkAbsValue(); return; }
  if (state.currentQuestion?.type === 'int_compare') return;  // obsługiwane przez przyciski
  if (state.currentQuestion?.type === 'int_order')   { await checkIntOrder(); return; }
  if (state.currentQuestion?.type === 'div_rem')       { await checkDivRem(); return; }
  if (state.currentQuestion?.type === 'fraction_read') { await checkFractionRead(); return; }
  if (state.currentQuestion?.type === 'fraction_op')   { await checkFractionOp();   return; }

  const input = document.getElementById('answerInput');

  // Odpowiedź tekstowa (np. cyfry rzymskie)
  if (typeof state.currentAnswer === 'string') {
    const userVal = input.value.trim().toUpperCase();
    if (!userVal) {
      input.classList.add('wrong');
      setTimeout(() => input.classList.remove('wrong'), 500);
      return;
    }
    const correct = userVal === state.currentAnswer.toUpperCase();
    if (correct) {
      state.answerLocked = true;
      input.classList.add('correct');
      playSound('correct');
      if (state.challengeActive) {
        state.challengeCorrect++;
        state.answerStreak++;
        document.getElementById('challengeScore').textContent = state.challengeCorrect;
        checkStreakBonus();
        showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
        setTimeout(() => { input.classList.remove('correct'); loadQuestion(); }, 350);
      } else {
        let pts = 0;
        const wasFirst = state.isFirstAttempt && !state.solutionShown;
        if (wasFirst) {
          state.answerStreak++;
          if (state.currentUser) {
            pts = await recordCorrect(state.currentTopic);
            showPointsPop(pts);
            updateStatsRow();
            checkStreakBonus();
          }
        }
        reportComeback();
        const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
        const msg = pts > 0
          ? `✓ Brawo! +${pts} pkt${suf}`
          : state.solutionShown ? '✓ Dobrze! Idziemy dalej.'
          : state.currentUser  ? `✓ Brawo! (nie za pierwszym razem)${suf}` : `✓ Brawo!${suf}`;
        showToast(msg, 'correct');
        const delay = state.solutionShown ? 300 : 400;
        setTimeout(() => { input.classList.remove('correct'); loadQuestion(); }, delay);
      }
      return;
    }
    // Błędna odpowiedź
    if (state.solutionShown) {
      input.classList.add('wrong');
      setTimeout(() => input.classList.remove('wrong'), 500);
      showToast(`Wpisz: ${state.currentAnswer}`, 'wrong');
      return;
    }
    state.answerStreak = 0;
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    input.classList.add('wrong');
    playSound('wrong');
    setTimeout(() => input.classList.remove('wrong'), 500);
    if (state.mistakes <= 3) {
      document.getElementById(`dot${state.mistakes-1}`).classList.add('used');
    }
    if (state.mistakes >= 3) {
      document.getElementById('solutionText').textContent = state.currentAnswer;
      document.getElementById('solutionReveal').classList.add('show');
      showToast(`✗ Poprawna: ${state.currentAnswer}`, 'wrong');
      state.solutionShown = true;
      const hint3 = state.currentQuestion?.hint3;
      if (hint3) {
        let hintEl = document.getElementById('questionHintLine');
        if (!hintEl) {
          hintEl = document.createElement('div');
          hintEl.id = 'questionHintLine';
          hintEl.className = 'question-hint-line';
          const qt = document.getElementById('questionText');
          qt?.parentNode.insertBefore(hintEl, qt.nextSibling);
        }
        const prev = hintEl.textContent;
        hintEl.textContent = prev ? `${prev}\n${hint3}` : `💡 ${hint3}`;
        hintEl.style.display = '';
      }
      setTimeout(() => { input.value = ''; input.focus(); }, 800);
    } else {
      const hint = state.currentQuestion?.hint;
      const hint2 = state.currentQuestion?.hint2;
      const showHint = state.mistakes === 1 ? hint : (state.mistakes === 2 ? (hint2 ?? hint) : null);
      if (showHint) {
        let hintEl = document.getElementById('questionHintLine');
        if (!hintEl) {
          hintEl = document.createElement('div');
          hintEl.id = 'questionHintLine';
          hintEl.className = 'question-hint-line';
          const qt = document.getElementById('questionText');
          qt?.parentNode.insertBefore(hintEl, qt.nextSibling);
        }
        const text = (state.mistakes === 2 && hint2 && hint)
          ? `💡 ${hint}\n${hint2}`
          : `💡 ${showHint}`;
        hintEl.textContent = text;
        hintEl.style.display = '';
      } else {
        showToast(`✗ Spróbuj jeszcze raz! (${3 - state.mistakes} szans)`, 'wrong');
      }
    }
    return;
  }

  const val = parseFloat(input.value);

  if (input.value === '' || isNaN(val)) {
    input.classList.add('wrong');
    setTimeout(() => input.classList.remove('wrong'), 500);
    return;
  }

  const correct = Math.abs(val - state.currentAnswer) < 0.01;

  if (correct) {
    state.answerLocked = true;
    input.classList.add('correct');
    playSound('correct');

    if (state.challengeActive) {
      state.challengeCorrect++;
      state.answerStreak++;
      document.getElementById('challengeScore').textContent = state.challengeCorrect;
      checkStreakBonus();
      showToast(`✓ Brawo!${streakSuffix(state.answerStreak)}`, 'correct');
      setTimeout(() => { input.classList.remove('correct'); loadQuestion(); }, 350);
    } else {
      let pts = 0;
      const wasFirst = state.isFirstAttempt && !state.solutionShown;
      if (wasFirst) {
        state.answerStreak++;
        if (state.currentUser) {
          pts = await recordCorrect(state.currentTopic);
          showPointsPop(pts);
          updateStatsRow();
          checkStreakBonus();
        }
      }
      reportComeback();
      const suf = wasFirst ? streakSuffix(state.answerStreak) : '';
      const msg = pts > 0
        ? `✓ Brawo! +${pts} pkt${suf}`
        : state.solutionShown ? '✓ Dobrze! Idziemy dalej.'
        : state.currentUser  ? `✓ Brawo! (nie za pierwszym razem)${suf}` : `✓ Brawo!${suf}`;
      showToast(msg, 'correct');
      const delay = state.solutionShown ? 300 : 400;
      setTimeout(() => { input.classList.remove('correct'); loadQuestion(); }, delay);
    }
  } else {
    // Jeśli rozwiązanie już pokazane – tylko delikatna podpowiedź, bez dodatkowych błędów
    if (state.solutionShown) {
      input.classList.add('wrong');
      setTimeout(() => input.classList.remove('wrong'), 500);
      showToast(`Wpisz: ${state.currentAnswer}`, 'wrong');
      return;
    }

    state.answerStreak = 0;  // reset streak na błędzie
    state.mistakes++;
    state.isFirstAttempt = false;
    reportMistake();
    input.classList.add('wrong');
    playSound('wrong');
    setTimeout(() => input.classList.remove('wrong'), 500);

    if (state.mistakes <= 3) {
      document.getElementById(`dot${state.mistakes-1}`).classList.add('used');
    }

    if (state.mistakes >= 3) {
      // Pokaż rozwiązanie, ale NIE blokuj inputu – uczeń może wpisać odpowiedź
      document.getElementById('solutionText').textContent = state.currentAnswer;
      document.getElementById('solutionReveal').classList.add('show');
      showToast(`✗ Poprawna: ${state.currentAnswer}`, 'wrong');
      state.solutionShown = true;
      // Opcjonalny hint3 – pokazuje pełne obliczenie przy ujawnieniu odpowiedzi
      const hint3 = state.currentQuestion?.hint3;
      if (hint3) {
        let hintEl = document.getElementById('questionHintLine');
        if (!hintEl) {
          hintEl = document.createElement('div');
          hintEl.id = 'questionHintLine';
          hintEl.className = 'question-hint-line';
          const qt = document.getElementById('questionText');
          qt?.parentNode.insertBefore(hintEl, qt.nextSibling);
        }
        const prev = hintEl.textContent;
        hintEl.textContent = prev ? `${prev}\n${hint3}` : `💡 ${hint3}`;
        hintEl.style.display = '';
      }
      // Wyczyść pole i daj fokus żeby uczeń mógł wpisać
      setTimeout(() => { input.value = ''; input.focus(); }, 800);
    } else {
      const hint = state.currentQuestion?.hint;
      const hint2 = state.currentQuestion?.hint2;
      const showHint = state.mistakes === 1 ? hint : (state.mistakes === 2 ? (hint2 ?? hint) : null);
      if (showHint) {
        let hintEl = document.getElementById('questionHintLine');
        if (!hintEl) {
          hintEl = document.createElement('div');
          hintEl.id = 'questionHintLine';
          hintEl.className = 'question-hint-line';
          const qt = document.getElementById('questionText');
          qt?.parentNode.insertBefore(hintEl, qt.nextSibling);
        }
        // Przy 2. pomyłce dołącz hint2 poniżej hint1 (nie wymazuj)
        const text = (state.mistakes === 2 && hint2 && hint)
          ? `💡 ${hint}\n${hint2}`
          : `💡 ${showHint}`;
        hintEl.textContent = text;
        hintEl.style.display = '';
      } else {
        showToast(`✗ Spróbuj jeszcze raz! (${3 - state.mistakes} szans)`, 'wrong');
      }
    }
  }
}

// ============================================================
// STREAK BONUS CHECK
// ============================================================

function streakSuffix(s) {
  if (s > 0 && s % 5 === 0) return `  🔥 ${s}×`;
  return '';
}

async function checkStreakBonus() {
  const streak = state.answerStreak;
  if (streak > 0 && streak % 10 === 0 && state.currentUser) {
    const difficulty = state.challengeActive ? 'challenge' : state.currentDifficulty;
    let data;
    try {
      data = await api('POST', '/api/bonus/streak', { topic: state.currentTopic, difficulty });
      if (data.error) throw new Error(data.error);
    } catch (e) {
      console.error('streak bonus error:', e);
      data = { pts: 5, dukat: false };
    }

    const pts = data.pts || 5;
    state.currentUser.season_points = (state.currentUser.season_points || 0) + pts;
    state.currentUser.total_points  = (state.currentUser.total_points  || 0) + pts;

    if (data.dukat) {
      state.dukaty = data.totalDukaty !== undefined ? data.totalDukaty : state.dukaty + 1;
      state.currentUser.dukaty = state.dukaty;
    }

    updateUserPanel();
    setTimeout(() => showStreakBanner(streak, pts, data.dukat || false), 2000);
  }
}

// ============================================================
// RECORD CORRECT → API
// ============================================================

async function recordCorrect(topic) {
  // W trakcie tury PvP używamy dedykowanego endpointu
  if (state.pvp.state === 'my_turn_playing') return pvpRecordCorrect(topic);

  const comeback = state.mistakes >= 2 && !state.solutionShown;
  const difficulty = state.challengeActive ? 'challenge' : state.currentDifficulty;
  const data = await api('POST', '/api/answer/correct', { topic, streak: state.answerStreak, comeback, server: state.server, difficulty });
  if (!data || data.error || !data.pts) return 0;

  // Aktualizuj lokalny stan
  if (state.currentUser) {
    if (state.server === 'class') {
      state.currentUser.class_season_points = (state.currentUser.class_season_points || 0) + data.pts;
      state.currentUser.class_total_points  = (state.currentUser.class_total_points  || 0) + data.pts;
    } else {
      state.currentUser.season_points = (state.currentUser.season_points || 0) + data.pts;
      state.currentUser.total_points  = (state.currentUser.total_points  || 0) + data.pts;
    }
    if (!state.currentUser.topics) state.currentUser.topics = {};
    if (!state.currentUser.topics[topic]) state.currentUser.topics[topic] = { done: 0, points: 0 };
    state.currentUser.topics[topic].done   = data.done;
    state.currentUser.topics[topic].points += data.pts;
  }

  // Osiągnięcia
  if (data.newAchs?.length) {
    data.newAchs.forEach(a => showAchievementToast(a));
    state.achievements.push(...data.newAchs.map(a => a.id));
    state.bonusPts = Math.floor(state.achievements.length / 15);
    updateAchBtn();
  }

  updateUserPanel();
  renderLeaderboards();
  return data.pts;
}

// ============================================================
// UI HELPERS
// ============================================================

let toastTimeout;
function showToast(msg, type = 'correct') {
  const t = document.getElementById('feedbackToast');
  t.textContent = msg;
  t.className = 'feedback-toast' + (type === 'wrong' ? ' wrong' : type === 'info' ? ' info' : '');
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2000);
}

function showPointsPop(pts) {
  const el = document.createElement('div');
  el.className = 'points-pop';
  el.textContent = `+${pts} ✨`;
  el.style.left = (50 + Math.random() * 20 - 10) + '%';
  el.style.top = '50%';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

function updateUserPanel() {
  const u = state.currentUser;
  if (!u) return;

  // Awatar
  const avatarEl = document.getElementById('userAvatarEl');
  if (state.avatarEmoji) {
    avatarEl.textContent  = state.avatarEmoji;
    avatarEl.style.fontSize = '28px';
  } else {
    avatarEl.textContent  = u.name.slice(0, 2).toUpperCase();
    avatarEl.style.fontSize = '';
  }

  document.getElementById('userNameEl').textContent = u.name;
  const titleEl = document.getElementById('userTitleEl');
  if (titleEl) {
    const t = TITLES_MAP.get(state.activeTitle);
    if (t) { titleEl.textContent = t.name; titleEl.style.display = ''; }
    else      titleEl.style.display = 'none';
  }

  // Poziom i XP
  const pts  = u.total_points || 0;
  const lvl  = getLevel(pts);
  const name = getLevelName(pts);
  const next = getNextLevelXp(pts);
  const prev = getPrevLevelXp(pts);
  const pct  = next ? Math.min(100, ((pts - prev) / (next - prev)) * 100) : 100;

  document.getElementById('lvlNum').textContent   = lvl;
  document.getElementById('lvlTitle').textContent  = name;
  document.getElementById('userLevelEl').style.display = '';
  document.getElementById('xpBarWrap').style.display   = '';
  document.getElementById('xpBarFill').style.width     = pct + '%';
  document.getElementById('xpLabel').textContent = next
    ? `${pts.toLocaleString()} / ${next.toLocaleString()} PP → poz. ${lvl + 1}`
    : '🏴‍☠️ Maksymalny poziom!';

  // Punkty — klasowe lub globalne w zależności od serwera
  const showClass = state.server === 'class';
  document.getElementById('userPtsEl').textContent   = (showClass ? (u.class_season_points || 0) : (u.season_points || 0)).toLocaleString();
  document.getElementById('userTotalEl').textContent = (showClass ? (u.class_total_points  || 0) : (u.total_points  || 0)).toLocaleString();

  // Punkty tygodniowe (tylko gdy zalogowany)
  const weekEl  = document.getElementById('userWeekEl');
  const weekPts = showClass ? (u.class_week_points || 0) : (u.week_points || 0);
  if (weekEl) {
    document.getElementById('userWeekPts').textContent = weekPts.toLocaleString();
    weekEl.style.display = '';
  }

  // Dukaty
  const d = state.dukaty;
  const dukatyEl = document.getElementById('dukatyEl');
  const suffix = d === 1 ? 'dukat' : d < 5 ? 'dukaty' : 'dukatów';
  dukatyEl.textContent = `🪙 ${d} ${suffix}`;
  dukatyEl.style.display = '';

  const authBtns = document.getElementById('userAuthBtns');
  if (authBtns) authBtns.style.display = 'flex';

  updateAchBtn();
}

function openChangePassword() {
  document.getElementById('changePassOld').value  = '';
  document.getElementById('changePassNew').value  = '';
  document.getElementById('changePassNew2').value = '';
  document.getElementById('changePassError').textContent = '';
  document.getElementById('changePassModal').style.display = 'flex';
}

function closeChangePassword() {
  document.getElementById('changePassModal').style.display = 'none';
}

async function submitChangePassword() {
  const oldPass = document.getElementById('changePassOld').value;
  const newPass = document.getElementById('changePassNew').value;
  const newPass2 = document.getElementById('changePassNew2').value;
  const errEl = document.getElementById('changePassError');
  errEl.textContent = '';

  if (!oldPass || !newPass || !newPass2) { errEl.textContent = 'Wypełnij wszystkie pola.'; return; }
  if (newPass.length < 4)               { errEl.textContent = 'Nowe hasło musi mieć min. 4 znaki.'; return; }
  if (newPass !== newPass2)             { errEl.textContent = 'Hasła nie są identyczne.'; return; }

  const data = await api('POST', '/api/change-password', { oldPassword: oldPass, newPassword: newPass });
  if (data.error) { errEl.textContent = data.error; return; }

  closeChangePassword();
  showToast('Hasło zostało zmienione!', 'correct');
}

async function logout() {
  await api('POST', '/api/logout');
  location.reload();
}

function updateStatsRow() {
  if (!state.currentUser || !state.currentTopic) return;
  const p = getTopicProgress(state.currentTopic);
  const pts = calcPoints(p.done);
  const total = pts + state.bonusPts;
  const bonusSuffix = state.bonusPts > 0 ? ` <span style="color:var(--accent);font-size:11px">(+${state.bonusPts} bonus)</span>` : '';
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-chip">📝 Zadania w temacie: <span class="val">${p.done}</span></div>
    <div class="stat-chip">⭐ Punkty za temat: <span class="val">${p.points}</span></div>
    <div class="stat-chip">➡️ Kolejne: <span class="val">+${total} pkt${bonusSuffix}</span></div>
  `;
}

// ============================================================
// DAILY BONUS
// ============================================================

function handleDailyBonus(dailyBonus, dailyStreak) {
  if (!dailyBonus && !dailyStreak) return;

  // Pokaż badge passy logowania
  const streakEl = document.getElementById('dailyStreakEl');
  if (dailyStreak >= 1) {
    document.getElementById('dailyStreakNum').textContent = dailyStreak;
    streakEl.style.display = 'inline-block';
  }

  // Toast z bonusem (tylko gdy faktycznie dostał punkty)
  if (dailyBonus > 0) {
    const days = dailyStreak;
    const msg = days > 1
      ? `☀️ Bonus dzienny: +${dailyBonus} pkt! (${days} dni z rzędu)`
      : `☀️ Bonus za logowanie: +${dailyBonus} pkt!`;
    setTimeout(() => showToast(msg, 'correct'), 800);
    // Aktualizuj lokalny stan
    if (state.currentUser) {
      state.currentUser.season_points = (state.currentUser.season_points || 0) + dailyBonus;
      state.currentUser.total_points  = (state.currentUser.total_points  || 0) + dailyBonus;
      updateUserPanel();
    }
  }
}

// ============================================================
// STREAK BANNER
// ============================================================

let streakBannerTimeout;
function showStreakBanner(streak, pts, dukat) {
  playSound(dukat ? 'dukat' : 'complete');
  const banner = document.getElementById('streakBanner');
  document.getElementById('streakBannerNum').textContent = streak;
  document.getElementById('streakBannerPts').textContent = `+${pts} pkt bonus!`;
  document.getElementById('streakBannerDukat').style.display = dukat ? '' : 'none';
  banner.classList.add('show');
  clearTimeout(streakBannerTimeout);
  streakBannerTimeout = setTimeout(() => banner.classList.remove('show'), 3500);
}

// ============================================================
// AVATAR PICKER
// ============================================================

function showShopTab(tab) {
  const isAvatars = tab === 'avatars';
  document.getElementById('shopSectionAvatars').style.display = isAvatars ? '' : 'none';
  document.getElementById('shopSectionTitles').style.display  = isAvatars ? 'none' : '';
  document.getElementById('shopTabBtnAvatars').classList.toggle('active', isAvatars);
  document.getElementById('shopTabBtnTitles').classList.toggle('active', !isAvatars);
  if (!isAvatars) renderTitlesGrid();
}

function openAvatarPicker() {
  if (!state.currentUser) return;
  document.getElementById('avatarShopBalance').textContent = `🪙 ${state.dukaty} dukatów`;
  // reset do zakładki awatarów
  document.getElementById('shopSectionAvatars').style.display = '';
  document.getElementById('shopSectionTitles').style.display  = 'none';
  document.getElementById('shopTabBtnAvatars').classList.add('active');
  document.getElementById('shopTabBtnTitles').classList.remove('active');
  const grid = document.getElementById('avatarPickerGrid');
  grid.innerHTML = '';

  // Opcja inicjałów – zawsze darmowa
  const initials = document.createElement('div');
  initials.className = 'avatar-shop-item';
  const initBox = document.createElement('div');
  initBox.className = 'avatar-option' + (!state.avatarEmoji ? ' chosen' : '');
  initBox.textContent = state.currentUser.name.slice(0, 2).toUpperCase();
  initBox.style.fontSize = '13px';
  initBox.title = 'Inicjały (darmowy)';
  initBox.onclick = () => setAvatar('');
  initials.appendChild(initBox);
  const freeLabel = document.createElement('div');
  freeLabel.className = 'avatar-price';
  freeLabel.textContent = 'FREE';
  initials.appendChild(freeLabel);
  grid.appendChild(initials);

  AVATAR_OPTIONS.forEach(ao => {
    const { emoji, price } = ao;
    const owned  = state.ownedAvatars.includes(emoji);
    const active = emoji === state.avatarEmoji;
    const canBuy = !owned && state.dukaty >= price;

    const wrap = document.createElement('div');
    wrap.className = 'avatar-shop-item';

    const el = document.createElement('div');
    if (active) el.className = 'avatar-option chosen';
    else if (owned) el.className = 'avatar-option';
    else if (canBuy) el.className = 'avatar-option buyable';
    else el.className = 'avatar-option locked';
    el.textContent = emoji;
    el.title = owned ? emoji : `Kup za ${price} 🪙`;

    if (owned) el.onclick = () => setAvatar(emoji);
    else if (canBuy) el.onclick = () => buyAvatar(emoji, price);

    const priceEl = document.createElement('div');
    priceEl.className = 'avatar-price';
    if (owned) priceEl.textContent = active ? '✓ Aktywny' : 'Twój';
    else priceEl.textContent = `${price} 🪙`;

    wrap.appendChild(el);
    wrap.appendChild(priceEl);
    grid.appendChild(wrap);
  });

  document.getElementById('avatarPickerModal').style.display = 'flex';
}

function closeAvatarPicker() {
  document.getElementById('avatarPickerModal').style.display = 'none';
}

function setAvatar(emoji) {
  state.avatarEmoji = emoji;
  localStorage.setItem('mq_avatar', emoji);
  if (state.currentUser) api('POST', '/api/avatar/set', { emoji });
  updateUserPanel();
  closeAvatarPicker();
}

async function buyAvatar(emoji, price = 3) {
  if (!confirm(`Kupić awatar ${emoji} za ${price} 🪙?`)) return;
  const data = await api('POST', '/api/avatar/buy', { avatarId: emoji });
  if (data.error) { showToast(data.error, 'wrong'); return; }
  state.dukaty = data.dukaty;
  state.ownedAvatars = JSON.parse(data.owned_avatars || '[]');
  if (state.currentUser) {
    state.currentUser.dukaty = state.dukaty;
    state.currentUser.owned_avatars = data.owned_avatars;
  }
  updateUserPanel();
  playSound('correct');
  showToast(`🎉 Awatar ${emoji} odblokowany!`, 'correct');
  openAvatarPicker(); // odśwież sklep
  setAvatar(emoji);
}

function renderTitlesGrid() {
  const grid = document.getElementById('titlesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  document.getElementById('avatarShopBalance').textContent = `🪙 ${state.dukaty} dukatów`;

  TITLES_LIST.forEach(t => {
    const owned  = state.ownedTitles.includes(t.id);
    const active = state.activeTitle === t.id;
    const canBuy = !owned && state.dukaty >= t.price;

    const item = document.createElement('div');
    item.className = 'title-item' + (active ? ' active-title' : owned ? ' owned' : !canBuy ? ' locked' : '');

    const nameEl = document.createElement('span');
    nameEl.className = 'title-item-name';
    nameEl.textContent = t.name;

    const priceEl = document.createElement('span');
    priceEl.className = 'title-item-price';
    if (active)      priceEl.textContent = 'Aktywny';
    else if (owned)  priceEl.textContent = 'Kliknij by założyć';
    else             priceEl.textContent = `${t.price} 🪙`;

    item.appendChild(nameEl);
    item.appendChild(priceEl);

    if (active)     item.onclick = () => setTitle('');
    else if (owned) item.onclick = () => setTitle(t.id);
    else if (canBuy) item.onclick = () => buyTitle(t.id, t.name, t.price);

    grid.appendChild(item);
  });
}

async function buyTitle(id, name, price) {
  if (!confirm(`Kupić tytuł "${name}" za ${price} 🪙?`)) return;
  const data = await api('POST', '/api/title/buy', { titleId: id });
  if (data.error) { showToast(data.error, 'wrong'); return; }
  state.dukaty = data.dukaty;
  state.ownedTitles = JSON.parse(data.owned_titles || '[]');
  if (state.currentUser) state.currentUser.dukaty = state.dukaty;
  playSound('correct');
  showToast(`📜 Tytuł "${name}" odblokowany!`, 'correct');
  renderTitlesGrid();
}

async function setTitle(id) {
  const data = await api('POST', '/api/title/set', { titleId: id });
  if (data.error) { showToast(data.error, 'wrong'); return; }
  state.activeTitle = data.active_title;
  updateUserPanel();
  renderTitlesGrid();
}

// ============================================================
// LEADERBOARDS → API
// ============================================================

function getWeekRangeLabel() {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now); mon.setHours(0,0,0,0); mon.setDate(now.getDate() + diff);
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt  = d => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

async function renderLeaderboards() {
  const isClass = state.server === 'class' && state.currentUser;

  document.getElementById('lb-class-card').style.display    = isClass ? '' : 'none';
  document.getElementById('lb-seasonal-card').style.display = isClass ? 'none' : '';
  document.getElementById('lb-global-card').style.display   = isClass ? 'none' : '';

  // Karta tygodniowa — tylko dla zalogowanych
  const weekCard = document.getElementById('lb-weekly-card');
  if (weekCard) weekCard.style.display = state.currentUser ? '' : 'none';

  if (isClass) {
    const classId  = state.teacherClassId || state.currentUser?.class_id;
    const classParam = classId ? `?classId=${classId}` : '';
    const [data, weekly] = await Promise.all([
      api('GET', `/api/leaderboard/class${classParam}`).catch(() => ({ students: [], teacher: null })),
      api('GET', `/api/leaderboard/weekly${classParam}`).catch(() => [])
    ]);
    renderLb('lb-class', (data.students || []).map(u => ({ name: u.name, points: u.season_points })));
    // Nauczyciel poza rankingiem
    const teacherEl = document.getElementById('lb-class-teacher');
    if (data.teacher) {
      const isMe = state.currentUser.id === data.teacher.id;
      teacherEl.innerHTML = `
        <div style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px">
          <div class="lb-entry ${isMe ? 'me' : ''}" style="opacity:0.7">
            <div class="lb-rank" style="font-size:11px">🏫</div>
            <div class="lb-name">${data.teacher.name}${isMe ? ' 👤' : ''} <span style="font-size:10px;color:var(--text3)">(nauczyciel)</span></div>
            <div class="lb-pts">${(data.teacher.season_points||0).toLocaleString()}</div>
          </div>
        </div>`;
    } else {
      teacherEl.innerHTML = '';
    }
    renderLb('lb-weekly', weekly);
  } else {
    const [seasonal, global, weekly] = await Promise.all([
      api('GET', '/api/leaderboard/seasonal').catch(() => []),
      api('GET', '/api/leaderboard/global').catch(() => []),
      api('GET', '/api/leaderboard/weekly').catch(() => [])
    ]);
    renderLb('lb-seasonal', seasonal);
    renderLb('lb-global', global);
    renderLb('lb-weekly', weekly);
  }

  const rangeEl = document.getElementById('lbWeekRange');
  if (rangeEl) rangeEl.textContent = getWeekRangeLabel();
}

function renderLb(containerId, users) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const medals = ['🥇','🥈','🥉'];
  const rankClasses = ['rank-1','rank-2','rank-3'];
  c.innerHTML = users.map((u, i) => {
    const isMe = state.currentUser && u.name === state.currentUser.name;
    const titleObj = u.active_title ? TITLES_MAP.get(u.active_title) : null;
    const titleHtml = titleObj ? `<span class="lb-title">${titleObj.name}</span>` : '';
    const avatarHtml = u.avatar_emoji ? `<span class="lb-avatar">${u.avatar_emoji}</span>` : '';
    return `<div class="lb-entry ${isMe ? 'me' : ''}">
      <div class="lb-rank ${rankClasses[i]||''}">${medals[i] || `${i+1}`}</div>
      ${avatarHtml}<div class="lb-name">${u.name}${isMe ? ' 👤' : ''}${titleHtml}</div>
      <div class="lb-pts">${(u.points||0).toLocaleString()}</div>
    </div>`;
  }).join('');
}

async function showFullLb(type) {
  if (state.currentUser) {
    api('POST', '/api/event', { event: 'lb_view' }).then(r => r.newAchs?.forEach(showAchievementToast));
  }
  const data = await api('GET', `/api/leaderboard/${type}/full`);
  document.getElementById('lbFullTitle').innerHTML = `
    ${type === 'seasonal' ? '🏆 Ranking sezonowy' : '🌍 Ranking globalny'}
    <button class="close-btn" onclick="closeLbFull()">✕</button>`;
  const medals = ['🥇','🥈','🥉'];
  document.getElementById('lbFullEntries').innerHTML = (data || []).map((u, i) => {
    const isMe = state.currentUser && u.name === state.currentUser.name;
    const titleObj = u.active_title ? TITLES_MAP.get(u.active_title) : null;
    const titleHtml = titleObj ? `<span class="lb-title">${titleObj.name}</span>` : '';
    const avatarHtml = u.avatar_emoji ? `<span class="lb-avatar">${u.avatar_emoji}</span>` : '';
    return `<div class="lb-entry ${isMe ? 'me' : ''}">
      <div class="lb-rank ${i < 3 ? `rank-${i+1}` : ''}">${medals[i] || `${i+1}.`}</div>
      ${avatarHtml}<div class="lb-name">${u.name}${isMe ? ' 👤' : ''}${titleHtml}</div>
      <div class="lb-pts">${(u.points||0).toLocaleString()} pkt</div>
    </div>`;
  }).join('');
  document.getElementById('lbFullModal').classList.add('show');
}

function closeLbFull() {
  document.getElementById('lbFullModal').classList.remove('show');
}

// ============================================================
// ACHIEVEMENTS — FRONTEND
// ============================================================

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

// Definicje (dublowane z serwera, tylko id/ikona/nazwa/opis/kategoria potrzebne po stronie klienta)
const ACHIEVEMENTS_DEF = [
  { id: 'first_task',    icon: '🎯', name: 'Pierwsze zadanie!',             cat: 'Pierwsze kroki', desc: 'Rozwiąż swoje pierwsze zadanie.' },
  { id: 'comeback',      icon: '💪', name: 'Comeback!',                     cat: 'Pierwsze kroki', desc: 'Odpowiedz poprawnie po 2+ błędach.' },
  { id: 'night_owl',     icon: '🦉', name: 'Nocna sowa',                    cat: 'Pierwsze kroki', desc: 'Rozwiąż zadanie po 23:00.' },
  { id: 'early_bird',    icon: '🐦', name: 'Ranny ptaszek',                 cat: 'Pierwsze kroki', desc: 'Rozwiąż zadanie przed 7:00.' },
  { id: 'weekend',       icon: '🏖️', name: 'Weekend warrior',              cat: 'Pierwsze kroki', desc: 'Rozwiąż zadanie w sobotę lub niedzielę.' },
  { id: 'tasks_10',      icon: '📝', name: 'Rozgrzewka',                    cat: 'Wytrwałość',     desc: 'Rozwiąż 10 zadań.' },
  { id: 'tasks_50',      icon: '📚', name: 'Regularny',                     cat: 'Wytrwałość',     desc: 'Rozwiąż 50 zadań.' },
  { id: 'tasks_100',     icon: '💯', name: 'Setka!',                        cat: 'Wytrwałość',     desc: 'Rozwiąż 100 zadań.' },
  { id: 'tasks_150',     icon: '🧩', name: 'Rozwiązywacz',                  cat: 'Wytrwałość',     desc: 'Rozwiąż 150 zadań.' },
  { id: 'tasks_250',     icon: '🔥', name: 'Wytrwały',                      cat: 'Wytrwałość',     desc: 'Rozwiąż 250 zadań.' },
  { id: 'tasks_500',     icon: '⚡', name: 'Pięćsetka',                     cat: 'Wytrwałość',     desc: 'Rozwiąż 500 zadań.' },
  { id: 'tasks_750',     icon: '🎯', name: 'Siedemset pięćdziesiąt',        cat: 'Wytrwałość',     desc: 'Rozwiąż 750 zadań.' },
  { id: 'tasks_1000',    icon: '🏆', name: 'Tysiącznik',                    cat: 'Wytrwałość',     desc: 'Rozwiąż 1000 zadań.' },
  { id: 'tasks_1500',    icon: '⭐', name: 'Półtorej tysiąca',              cat: 'Wytrwałość',     desc: 'Rozwiąż 1500 zadań.' },
  { id: 'tasks_2000',    icon: '🚀', name: 'Nałogowiec',                    cat: 'Wytrwałość',     desc: 'Rozwiąż 2000 zadań.' },
  { id: 'tasks_3000',    icon: '🌊', name: 'Trzy tysiące',                  cat: 'Wytrwałość',     desc: 'Rozwiąż 3000 zadań.' },
  { id: 'tasks_5000',    icon: '🌌', name: 'Obsesja',                       cat: 'Wytrwałość',     desc: 'Rozwiąż 5000 zadań.' },
  { id: 'tasks_10000',   icon: '🌠', name: 'Legenda matematyki',            cat: 'Wytrwałość',     desc: 'Rozwiąż 10 000 zadań.' },
  { id: 'tasks_25000',   icon: '♾️', name: 'Nieskończoność',               cat: 'Wytrwałość',     desc: 'Rozwiąż 25 000 zadań.' },
  { id: 'tasks_50000',   icon: '🔱', name: 'Absolut',                       cat: 'Wytrwałość',     desc: 'Rozwiąż 50 000 zadań.' },
  { id: 'streak_5',      icon: '✨', name: 'Rozgrzany',                     cat: 'Seria',          desc: 'Odpowiedz poprawnie 5 razy z rzędu.' },
  { id: 'streak_10',     icon: '🔥', name: 'Na fali',                       cat: 'Seria',          desc: 'Odpowiedz poprawnie 10 razy z rzędu.' },
  { id: 'streak_20',     icon: '⚡', name: 'Nie do zatrzymania',            cat: 'Seria',          desc: 'Odpowiedz poprawnie 20 razy z rzędu.' },
  { id: 'streak_50',     icon: '💫', name: 'Legenda',                       cat: 'Seria',          desc: 'Odpowiedz poprawnie 50 razy z rzędu.' },
  { id: 'streak_100',    icon: '👑', name: 'Nieśmiertelny',                 cat: 'Seria',          desc: 'Odpowiedz poprawnie 100 razy z rzędu.' },
  { id: 'mistake_1',     icon: '🙈', name: 'Każdy się myli',                cat: 'Błędy',          desc: 'Popełnij swój pierwszy błąd.' },
  { id: 'mistakes_10',   icon: '📖', name: 'Uczę się',                      cat: 'Błędy',          desc: 'Popełnij 10 błędów.' },
  { id: 'mistakes_50',   icon: '🧠', name: 'Człowiek uczy się na błędach',  cat: 'Błędy',          desc: 'Popełnij 50 błędów.' },
  { id: 'mistakes_100',  icon: '🎓', name: '100 lekcji',                    cat: 'Błędy',          desc: 'Popełnij 100 błędów.' },
  { id: 'mistakes_500',  icon: '📕', name: 'Kronikarz błędów',              cat: 'Błędy',          desc: 'Popełnij 500 błędów.' },
  { id: 'mistakes_1000', icon: '🔬', name: 'Naukowiec',                     cat: 'Błędy',          desc: 'Popełnij 1000 błędów.' },
  { id: 'mistakes_5000', icon: '🏗️', name: 'Budowniczy wiedzy',           cat: 'Błędy',          desc: 'Popełnij 5000 błędów.' },
  { id: 'login_2',       icon: '👋', name: 'Wróciłem!',                     cat: 'Logowanie',      desc: 'Zaloguj się 2 dni z rzędu.' },
  { id: 'login_7',       icon: '📅', name: 'Tygodniowy',                    cat: 'Logowanie',      desc: 'Zaloguj się 7 dni z rzędu.' },
  { id: 'login_14',      icon: '🗓️', name: 'Dwa tygodnie',                 cat: 'Logowanie',      desc: 'Zaloguj się 14 dni z rzędu.' },
  { id: 'login_30',      icon: '🌙', name: 'Miesięczny',                    cat: 'Logowanie',      desc: 'Zaloguj się 30 dni z rzędu.' },
  { id: 'login_100',     icon: '💎', name: 'Stuprocentowy',                 cat: 'Logowanie',      desc: 'Zaloguj się 100 dni z rzędu.' },
  { id: 'topics_3',      icon: '🗺️', name: 'Ciekawski',                    cat: 'Różnorodność',   desc: 'Spróbuj 3 różnych tematów.' },
  { id: 'topics_5',      icon: '🔍', name: 'Eksplorujący',                  cat: 'Różnorodność',   desc: 'Spróbuj 5 różnych tematów.' },
  { id: 'topics_10',     icon: '🌍', name: 'Wszechstronny',                 cat: 'Różnorodność',   desc: 'Spróbuj 10 różnych tematów.' },
  { id: 'topics_20',     icon: '📜', name: 'Encyklopedia',                  cat: 'Różnorodność',   desc: 'Spróbuj 20 różnych tematów.' },
  { id: 'topics_30',     icon: '🧭', name: 'Odkrywca',                      cat: 'Różnorodność',   desc: 'Spróbuj 30 różnych tematów.' },
  { id: 'topics_50',     icon: '🌐', name: 'Omnibus',                       cat: 'Różnorodność',   desc: 'Spróbuj 50 różnych tematów.' },
  { id: 'topics_75',     icon: '🎓', name: 'Erudyta tematów',               cat: 'Różnorodność',   desc: 'Spróbuj 75 różnych tematów.' },
  { id: 'topics_100',    icon: '🔭', name: 'Obserwator wiedzy',             cat: 'Różnorodność',   desc: 'Spróbuj 100 różnych tematów.' },
  { id: 'topics_125',    icon: '🌠', name: 'Prawie kompletny',              cat: 'Różnorodność',   desc: 'Spróbuj 125 różnych tematów.' },
  { id: 'topics_151',    icon: '👑', name: 'Koneser wszystkich',            cat: 'Różnorodność',   desc: 'Spróbuj wszystkich 151 tematów!' },
  { id: 'master_1',      icon: '⭐', name: 'Mistrz tematu',                 cat: 'Perfekcja',      desc: 'Ukończ 1 temat (≥20 zadań).' },
  { id: 'master_3',      icon: '🌟', name: 'Zaawansowany',                  cat: 'Perfekcja',      desc: 'Ukończ 3 tematy (≥20 zadań każdy).' },
  { id: 'master_5',      icon: '💫', name: 'Polimat',                       cat: 'Perfekcja',      desc: 'Ukończ 5 tematów (≥20 zadań każdy).' },
  { id: 'master_10',     icon: '🔮', name: 'Erudyta',                       cat: 'Perfekcja',      desc: 'Ukończ 10 tematów (≥20 zadań każdy).' },
  { id: 'master_15',     icon: '🎯', name: 'Kolekcjoner tematów',           cat: 'Perfekcja',      desc: 'Ukończ 15 tematów (≥20 zadań każdy).' },
  { id: 'master_20',     icon: '🏛️', name: 'Akademik',                     cat: 'Perfekcja',      desc: 'Ukończ 20 tematów (≥20 zadań każdy).' },
  { id: 'pts_100',       icon: '💰', name: 'Pierwsza stówka',               cat: 'Punkty',         desc: 'Zdobądź 100 punktów łącznie.' },
  { id: 'pts_500',       icon: '💵', name: 'Pięćsetka',                     cat: 'Punkty',         desc: 'Zdobądź 500 punktów łącznie.' },
  { id: 'pts_1000',      icon: '💸', name: 'Tysiącznik',                    cat: 'Punkty',         desc: 'Zdobądź 1000 punktów łącznie.' },
  { id: 'pts_2000',      icon: '🏅', name: 'Dorobkiewicz',                  cat: 'Punkty',         desc: 'Zdobądź 2000 punktów łącznie.' },
  { id: 'pts_5000',      icon: '👑', name: 'Elita',                         cat: 'Punkty',         desc: 'Zdobądź 5000 punktów łącznie.' },
  { id: 'pts_10000',     icon: '💎', name: 'Diamentowy',                    cat: 'Punkty',         desc: 'Zdobądź 10 000 punktów łącznie.' },
  { id: 'pts_25000',     icon: '🌟', name: 'Galaktyczny',                   cat: 'Punkty',         desc: 'Zdobądź 25 000 punktów łącznie.' },
  { id: 'pts_50000',     icon: '🚀', name: 'Kosmonauta punktów',            cat: 'Punkty',         desc: 'Zdobądź 50 000 punktów łącznie.' },
  { id: 'theme_change',  icon: '🎨', name: 'Stylista',                      cat: 'Specjalne',      desc: 'Zmień motyw kolorystyczny.' },
  { id: 'lb_view',       icon: '👀', name: 'Obserwator',                    cat: 'Specjalne',      desc: 'Otwórz pełną tablicę wyników.' },
  { id: 'class_join',      icon: '🏫', name: 'Klasowy debiut',             cat: 'Klasa',          desc: 'Dołącz do klasy szkolnej.' },
  { id: 'class_top1_week', icon: '🥇', name: 'Klasowy lider',             cat: 'Klasa',          desc: 'Zajmij 1. miejsce w tygodniowym rankingu klasy.' },
  { id: 'ach_15',        icon: '🥉', name: 'Kolekcjoner',                   cat: 'Meta',           desc: 'Odblokuj 15 osiągnięć.  Nagroda: +1 pkt/zadanie.' },
  { id: 'ach_30',        icon: '🥈', name: 'Entuzjasta',                    cat: 'Meta',           desc: 'Odblokuj 30 osiągnięć.  Nagroda: +2 pkt/zadanie.' },
  { id: 'ach_45',        icon: '🥇', name: 'Koneser',                       cat: 'Meta',           desc: 'Odblokuj 45 osiągnięć.  Nagroda: +3 pkt/zadanie.' },
  { id: 'ach_75',        icon: '🏆', name: 'Mistrz osiągnięć',             cat: 'Meta',           desc: 'Odblokuj 75 osiągnięć.  Nagroda: +5 pkt/zadanie.' },
  { id: 'ach_120',       icon: '💎', name: 'Legenda osiągnięć',            cat: 'Meta',           desc: 'Odblokuj 120 osiągnięć. Nagroda: +8 pkt/zadanie.' },
  { id: 'ach_200',       icon: '👑', name: 'Bóg osiągnięć',               cat: 'Meta',           desc: 'Odblokuj 200 osiągnięć. Nagroda: +13 pkt/zadanie.' },
];

function loadAchievementsState(userData) {
  state.achievements = userData.ach_unlocked || [];
  state.bonusPts     = userData.bonus_pts || 0;
  updateAchBtn();
}

function updateAchBtn() {
  const btn = document.getElementById('achBtn');
  const cnt = document.getElementById('achCount');
  if (!btn) return;
  if (state.currentUser) {
    btn.style.display = '';
    if (cnt) cnt.textContent = state.achievements.length;
  } else {
    btn.style.display = 'none';
  }

  // PvP button visibility
  const pvpBtn = document.getElementById('pvpBtn');
  if (pvpBtn) pvpBtn.style.display = state.currentUser ? '' : 'none';

  // Start/stop polling
  if (state.currentUser) startPvpPolling();
  else stopPvpPolling();
}

function reportComeback() {
  if (!state.currentUser || state.isFirstAttempt || state.mistakes < 2 || state.solutionShown) return;
  api('POST', '/api/event', { event: 'comeback' })
    .then(r => {
      r.newAchs?.forEach(showAchievementToast);
      if (r.newAchs?.length) {
        state.achievements.push(...r.newAchs.map(a => a.id));
        state.bonusPts = Math.floor(state.achievements.length / 15);
        updateAchBtn();
      }
    }).catch(() => {});
}

async function reportMistake() {
  if (!state.currentUser) return;
  try {
    const r = await api('POST', '/api/mistake', {});
    r.newAchs?.forEach(showAchievementToast);
    if (r.newAchs?.length) {
      state.achievements.push(...r.newAchs.map(a => a.id));
      state.bonusPts = Math.floor(state.achievements.length / 15);
      updateAchBtn();
    }
  } catch(e) { /* nie blokuj gry */ }
}

let _achToastQueue = [];
let _achToastRunning = false;

function showAchievementToast(ach) {
  _achToastQueue.push(ach);
  if (!_achToastRunning) drainAchToastQueue();
}

function drainAchToastQueue() {
  if (!_achToastQueue.length) { _achToastRunning = false; return; }
  _achToastRunning = true;
  const ach = _achToastQueue.shift();

  let el = document.getElementById('achToastEl');
  if (!el) {
    el = document.createElement('div');
    el.id = 'achToastEl';
    el.className = 'ach-toast';
    document.body.appendChild(el);
  }
  el.innerHTML = `🏆 Osiągnięcie!<br><strong>${ach.icon} ${ach.name}</strong>`;
  el.classList.add('show');
  playSound('achievement');

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(drainAchToastQueue, 400);
  }, 2800);
}

function openAchievements() {
  renderAchievementsOverlay();
  document.getElementById('achOverlay').style.display = 'flex';
}

function closeAchievements() {
  document.getElementById('achOverlay').style.display = 'none';
  document.getElementById('achTip').style.display = 'none';
}

function closeAchIfBg(e) {
  if (e.target === document.getElementById('achOverlay')) closeAchievements();
}

function renderAchievementsOverlay() {
  const unlockedSet = new Set(state.achievements);
  const count = unlockedSet.size;
  const bonus  = state.bonusPts;

  document.getElementById('achSummary').innerHTML =
    `${count} odblokowanych` +
    (bonus > 0 ? ` &nbsp;·&nbsp; +${bonus} pkt/zadanie` : '');

  // ── Sekcja ogólna ─────────────────────────────────────────
  const cats = {};
  for (const a of ACHIEVEMENTS_DEF) {
    if (!cats[a.cat]) cats[a.cat] = [];
    cats[a.cat].push(a);
  }

  const grid = document.getElementById('achGrid');
  let html = Object.entries(cats).map(([cat, achs]) => {
    const items = achs.map(a => {
      const unlocked = unlockedSet.has(a.id);
      return `<div class="ach-item ${unlocked ? 'unlocked' : 'locked'}" data-desc="${unlocked ? a.desc : '???'}">
        <div class="ach-icon">${unlocked ? a.icon : '🔒'}</div>
        <div class="ach-name">${unlocked ? a.name : '???'}</div>
      </div>`;
    }).join('');
    return `<div><div class="ach-cat-title">${cat}</div><div class="ach-cat-row">${items}</div></div>`;
  }).join('');

  // ── Sekcja tematyczna (4 rozwijane poziomy) ───────────────
  const topics = state.currentUser?.topics || {};
  const levelGroups = document.querySelectorAll('.level-group');
  if (levelGroups.length) {
    const levelsHtml = [...levelGroups].map(group => {
      const levelName = group.querySelector('.level-btn span')?.textContent?.trim() || '';
      const topicsInLevel = [...group.querySelectorAll('.topic-btn')].map(btn => {
        const m = btn.getAttribute('onclick')?.match(/'([^']+)'/);
        return m ? m[1] : null;
      }).filter(Boolean);

      const rows = topicsInLevel.map(topic => {
        const slug = topicSlug(topic);
        const done = topics[topic]?.done || 0;
        const milestones = TOPIC_THRESHOLDS.map(t => {
          const id = `tp_${slug}_${t.n}`;
          const unlocked = unlockedSet.has(id);
          const reachable = done > 0 && done < t.n;
          return `<span class="tp-mile ${unlocked ? 'unlocked' : reachable ? 'reachable' : 'locked'}"
            title="${unlocked ? `✓ ${t.suffix}` : t.suffix}">${unlocked ? t.icon : '🔒'}</span>`;
        }).join('');
        return `<div class="tp-row"><span class="tp-name">${topic}</span><span class="tp-miles">${milestones}</span></div>`;
      }).join('');

      const triedCount  = topicsInLevel.filter(t => (topics[t]?.done || 0) > 0).length;
      const unlockedCount = topicsInLevel.reduce((sum, t) => {
        const slug = topicSlug(t);
        return sum + TOPIC_THRESHOLDS.filter(th => unlockedSet.has(`tp_${slug}_${th.n}`)).length;
      }, 0);
      const totalPossible = topicsInLevel.length * TOPIC_THRESHOLDS.length;

      return `<details class="tp-level">
        <summary class="tp-level-summary">${levelName} <span class="tp-level-count">${unlockedCount}/${totalPossible}</span></summary>
        <div class="tp-table">${rows}</div>
      </details>`;
    }).join('');
    html += `<div><div class="ach-cat-title">Osiągnięcia tematyczne</div>${levelsHtml}</div>`;
  }

  grid.innerHTML = html;

  // Tooltip dla osiągnięć — fixed, poza overflow kontenerem
  const tip = document.getElementById('achTip');
  grid.addEventListener('mouseover', e => {
    const item = e.target.closest('[data-desc]');
    if (!item) return;
    tip.textContent = item.dataset.desc;
    tip.style.display = 'block';
  });
  grid.addEventListener('mousemove', e => {
    if (tip.style.display === 'none') return;
    const gap = 10;
    let x = e.clientX + gap;
    let y = e.clientY - tip.offsetHeight / 2;
    if (x + tip.offsetWidth > window.innerWidth - 8) x = e.clientX - tip.offsetWidth - gap;
    if (y < 4) y = 4;
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
  });
  grid.addEventListener('mouseout', e => {
    if (!e.target.closest('[data-desc]')) return;
    tip.style.display = 'none';
  });
}

// ============================================================
// PvP
// ============================================================

const PVP_LEVEL_NAMES = { k13: 'Klasy 1–3', k46: 'Klasy 4–6', k78: 'Klasy 7–8', sr: 'Szkoła średnia' };

function openPvp() {
  document.getElementById('pvpOverlay').style.display = 'flex';
  renderPvpContent();  // natychmiastowy render z aktualnego stanu
  pollPvpNow();        // odświeżenie danych z serwera
}

function closePvp() {
  document.getElementById('pvpOverlay').style.display = 'none';
}

function closePvpIfBg(e) {
  if (e.target === document.getElementById('pvpOverlay')) closePvp();
}

function startPvpPolling() {
  if (state.pvp.pollInterval) return;
  state.pvp.pollInterval = setInterval(pollPvpNow, 3000);
}

function stopPvpPolling() {
  clearInterval(state.pvp.pollInterval);
  state.pvp.pollInterval = null;
}

async function pollPvpNow() {
  if (!state.currentUser) return;
  const data = await api('GET', '/api/pvp/status').catch(() => null);
  if (!data) return;

  const prev = state.pvp.state;
  state.pvp.state       = data.state;
  state.pvp.match       = data.match || null;
  state.pvp.challenge   = data.challenge || null;
  // Tematy losujemy tylko raz przy wejściu w my_turn_choose; potem zachowujemy
  if (data.state === 'my_turn_choose' && state.pvp.topics.length === 0) {
    state.pvp.topics = data.topics || [];
  } else if (data.state !== 'my_turn_choose') {
    state.pvp.topics = [];
  }
  state.pvp.opponentName = data.opponent_name || '';
  state.pvp.iWon        = data.i_won ?? null;

  // Jeśli weszliśmy w aktywną turę (po stronie klienta – zostało wybrane topic)
  if (data.state === 'my_turn_playing' && prev !== 'my_turn_playing') {
    state.pvp.topic     = data.topic;
    state.pvp.startedAt = data.started_at;
    state.pvp.pvpScore  = data.match?.score || 0;
    startPvpTimer();
  }

  updatePvpBadge();
  if (document.getElementById('pvpOverlay').style.display !== 'none') {
    // Nie rerenderuj formularza idle/pending jeśli stan się nie zmienił — zachowuje wartości inputów
    if (data.state !== prev || (data.state !== 'idle' && data.state !== 'challenge_pending')) {
      renderPvpContent();
    }
  }
}

function updatePvpBadge() {
  const btn   = document.getElementById('pvpBtn');
  const badge = document.getElementById('pvpBadge');
  if (!btn) return;
  const s = state.pvp.state;
  if (s === 'my_turn_choose' || s === 'my_turn_playing') {
    badge.textContent = '!';
    badge.style.display = '';
    btn.classList.add('pvp-attention');
  } else if (s === 'match_finished') {
    badge.textContent = '✓';
    badge.style.display = '';
    btn.classList.remove('pvp-attention');
  } else if (s === 'waiting_opponent') {
    badge.textContent = '…';
    badge.style.display = '';
    btn.classList.remove('pvp-attention');
  } else {
    badge.style.display = 'none';
    btn.classList.remove('pvp-attention');
  }
}

function renderPvpContent() {
  const el = document.getElementById('pvpContent');
  if (!el) return;
  const s = state.pvp.state;

  if (s === 'idle') { el.innerHTML = renderPvpIdle(); loadAvailableChallenges(); }
  else if (s === 'challenge_pending') {
    el.innerHTML = renderPvpPending();
    loadAvailableChallenges();
    startPendingCountdown();
  }
  else if (s === 'my_turn_choose') { el.innerHTML = renderPvpChooseTopic(); }
  else if (s === 'my_turn_playing') { el.innerHTML = renderPvpPlaying(); }
  else if (s === 'waiting_opponent') { el.innerHTML = renderPvpWaiting(); }
  else if (s === 'match_finished') { el.innerHTML = renderPvpResult(); }
}

function startPendingCountdown() {
  const expiresAt = state.pvp.challenge?.expires_at;
  if (!expiresAt) return;
  const tick = () => {
    const el = document.getElementById('pvpPendingCountdown');
    if (!el) return; // element zniknął — stop
    const left = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
    const mm = String(Math.floor(left / 60)).padStart(2, '0');
    const ss = String(left % 60).padStart(2, '0');
    el.textContent = `${mm}:${ss}`;
    if (left > 0) setTimeout(tick, 1000);
  };
  setTimeout(tick, 1000);
}

/* ── Ekran: brak aktywności ── */
function renderPvpIdle() {
  return `
    <div class="pvp-form">
      <p style="margin:0 0 12px;font-size:14px;opacity:0.8">Stwórz wyzwanie lub zaakceptuj cudze. Stawka trafia do zwycięzcy, gra wa banque.</p>
      <div>
        <label>Poziom</label>
        <select id="pvpLevel">
          <option value="k13">Klasy 1–3</option>
          <option value="k46">Klasy 4–6</option>
          <option value="k78">Klasy 7–8</option>
          <option value="sr">Szkoła średnia</option>
        </select>
      </div>
      <div class="pvp-stake-row">
        <div>
          <label>Stawka dukatów (0–5)</label>
          <input type="number" id="pvpStakeDukats" value="0" min="0" max="5">
        </div>
        <div>
          <label>Stawka punktów (0–100)</label>
          <input type="number" id="pvpStakePoints" value="0" min="0" max="100">
        </div>
      </div>
      <button class="pvp-submit-btn" onclick="createChallenge()">⚔️ Szukaj przeciwnika</button>
    </div>
    <div id="pvpChallengeListWrap" style="margin-top:22px">${renderAvailableChallenges()}</div>
  `;
}

function renderAvailableChallenges() {
  return `<div style="font-size:13px;font-weight:700;margin-bottom:8px;opacity:0.6">DOSTĘPNE WYZWANIA</div>
    <div id="pvpChallengeList" style="font-size:13px;opacity:0.6">Ładowanie…</div>`;
}

/* ── Ekran: oczekuję na przeciwnika ── */
function renderPvpPending() {
  const c = state.pvp.challenge;
  const left = Math.max(0, c.expires_at - Math.floor(Date.now()/1000));
  const mm = String(Math.floor(left/60)).padStart(2,'0');
  const ss = String(left % 60).padStart(2,'0');
  return `
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:48px">⏳</div>
      <div style="font-size:18px;font-weight:800;margin:12px 0 6px">Czekam na przeciwnika…</div>
      <div style="font-size:14px;opacity:0.65;margin-bottom:6px">${PVP_LEVEL_NAMES[c.level]} | ${c.stake_dukats}🪙 | ${c.stake_points} pkt</div>
      <div style="font-size:13px;opacity:0.5;margin-bottom:18px">Wygasa za <span id="pvpPendingCountdown">${mm}:${ss}</span></div>
      <button class="pvp-submit-btn" style="background:rgba(255,255,255,0.1);color:var(--text)" onclick="cancelChallenge()">Anuluj wyzwanie</button>
    </div>
    <div id="pvpChallengeListWrap" style="margin-top:22px">${renderAvailableChallenges()}</div>
  `;
}

/* ── Ekran: wybór tematu ── */
function renderPvpChooseTopic() {
  const m = state.pvp.match;
  const topics = state.pvp.topics;
  const btns = topics.map(t =>
    `<button class="pvp-topic-btn" onclick="chooseTopic('${t.replace(/'/g, "\\'")}')">${t}</button>`
  ).join('');
  return `
    ${renderScoreboard()}
    <div style="font-size:14px;font-weight:700;margin-bottom:6px;text-align:center">Runda ${m.round} — wybierz temat:</div>
    <div class="pvp-topic-grid">${btns}</div>
  `;
}

/* ── Ekran: gram (60s timer) ── */
function renderPvpPlaying() {
  const m = state.pvp.match;
  const left = Math.max(0, 60 - Math.floor((Date.now()/1000) - state.pvp.startedAt));
  return `
    ${renderScoreboard()}
    <div class="pvp-timer-bar">
      <div class="pvp-timer-num${left <= 10 ? ' urgent' : ''}" id="pvpTimerNum">${left}</div>
      <div style="font-size:12px;opacity:0.5">sekund</div>
      <div class="pvp-live-score">Poprawne odpowiedzi: <span id="pvpLiveScore">${state.pvp.pvpScore}</span></div>
    </div>
    <div style="font-size:13px;text-align:center;opacity:0.65">Temat: <strong>${state.pvp.topic}</strong> | Poziom: średni</div>
    <div style="font-size:12px;text-align:center;opacity:0.45;margin-top:6px">Odpowiadaj normalnie — zamknij to okno i graj!</div>
  `;
}

function renderPvpTimerUI() {
  // Nie startujemy kolejnego timera jeśli już działa
}

/* ── Ekran: czekam na przeciwnika ── */
function renderPvpWaiting() {
  const m = state.pvp.match;
  return `
    ${renderScoreboard()}
    <div style="text-align:center;padding:16px 0">
      <div style="font-size:38px">⏳</div>
      <div style="font-size:16px;font-weight:700;margin:10px 0 4px">Runda ${m.round} — tura przeciwnika</div>
      <div style="font-size:13px;opacity:0.55">Czekaj, aż skończy…</div>
    </div>
  `;
}

/* ── Ekran: wynik meczu ── */
function renderPvpResult() {
  const m = state.pvp.match;
  const won = state.pvp.iWon;
  const draw = won === null || m.winner_id === null;

  let icon, title, sub;
  if (draw) { icon = '🤝'; title = 'Remis!'; sub = 'Stawki zwrócone obu graczom.'; }
  else if (won) { icon = '🏴‍☠️'; title = 'Zwycięstwo!'; sub = `Pokonałeś ${state.pvp.opponentName}!`; }
  else { icon = '💀'; title = 'Przegrana!'; sub = `${state.pvp.opponentName} wygrał tym razem.`; }

  let reward = '';
  if (won && (m.stake_dukats > 0 || m.stake_points > 0)) {
    reward = `+${m.stake_dukats}🪙 +${m.stake_points} pkt od przeciwnika`;
  } else if (draw && (m.stake_dukats > 0 || m.stake_points > 0)) {
    reward = `Stawka zwrócona: ${m.stake_dukats}🪙, ${m.stake_points} pkt`;
  }

  return `
    ${renderScoreboard()}
    <div class="pvp-result">
      <div class="pvp-result-icon">${icon}</div>
      <div class="pvp-result-title">${title}</div>
      <div class="pvp-result-sub">${sub}</div>
      ${reward ? `<div class="pvp-result-reward">${reward}</div>` : ''}
      <button class="pvp-new-btn" onclick="dismissPvpResult()">Nowy pojedynek</button>
    </div>
  `;
}

/* ── Helpers UI ── */
function renderScoreboard() {
  const m = state.pvp.match;
  if (!m) return '';
  const myRounds  = m.my_rounds_won  || 0;
  const oppRounds = m.opp_rounds_won || 0;
  const total = 3;
  const myDots  = Array.from({length: total}, (_,i) => {
    // Nie wiemy która runda była wygrana, tylko łącznie
    if (i < myRounds)  return '<div class="pvp-dot win"></div>';
    if (i < myRounds + (total - myRounds - Math.max(0, total - myRounds - oppRounds))) return '<div class="pvp-dot loss"></div>';
    return '<div class="pvp-dot"></div>';
  }).join('');

  return `
    <div class="pvp-scoreboard" style="margin-bottom:16px">
      <div>
        <div class="pvp-player-name">Ty</div>
        <div class="pvp-rounds-won">${myRounds}</div>
      </div>
      <div class="pvp-vs">VS</div>
      <div>
        <div class="pvp-player-name">${state.pvp.opponentName || '?'}</div>
        <div class="pvp-rounds-won">${oppRounds}</div>
      </div>
    </div>
  `;
}

/* ── Akcje użytkownika ── */
async function createChallenge() {
  try {
    const level = document.getElementById('pvpLevel')?.value;
    const dukats = parseInt(document.getElementById('pvpStakeDukats')?.value) || 0;
    const points = parseInt(document.getElementById('pvpStakePoints')?.value) || 0;

    const data = await api('POST', '/api/pvp/challenge', { level, stake_dukats: dukats, stake_points: points });
    if (data.error) { showToast(data.error, 'wrong'); return; }

    // Natychmiastowa aktualizacja stanu z odpowiedzi (bez czekania na poll)
    state.pvp.state = 'challenge_pending';
    state.pvp.challenge = data.challenge;
    renderPvpContent();
    pollPvpNow(); // odświeżenie w tle
  } catch (e) {
    showToast('Błąd połączenia: ' + e.message, 'wrong');
  }
}

async function cancelChallenge() {
  await api('DELETE', '/api/pvp/my-challenge');
  state.pvp.state = 'idle';
  state.pvp.challenge = null;
  renderPvpContent();
  loadAvailableChallenges();
}

async function loadAvailableChallenges() {
  const listEl = document.getElementById('pvpChallengeList');
  if (!listEl) return;
  const data = await api('GET', '/api/pvp/challenges').catch(() => null);
  if (!data || !data.challenges) return;

  if (data.challenges.length === 0) {
    listEl.textContent = 'Brak dostępnych wyzwań.';
    return;
  }

  listEl.innerHTML = data.challenges.map(c => `
    <div class="pvp-challenge-item">
      <div class="pvp-challenge-info">
        <strong>${c.challenger_name}</strong>
        ${PVP_LEVEL_NAMES[c.level]} | ${c.stake_dukats}🪙 | ${c.stake_points} pkt
      </div>
      <button class="pvp-accept-btn" onclick="acceptChallenge(${c.id})">Przyjmij</button>
    </div>
  `).join('');
}

async function acceptChallenge(id) {
  const data = await api('POST', `/api/pvp/accept/${id}`);
  if (data.error) { showToast(data.error, 'wrong'); return; }
  if (data.actual_dukats !== undefined || data.actual_points !== undefined) {
    // Zaktualizuj dukaty/punkty lokalnie po dedukcji stawki
    if (state.currentUser) {
      state.currentUser.dukaty         = Math.max(0, (state.currentUser.dukaty         || 0) - (data.actual_dukats || 0));
      state.currentUser.season_points  = Math.max(0, (state.currentUser.season_points  || 0) - (data.actual_points || 0));
      state.dukaty = state.currentUser.dukaty;
      updateUserPanel();
    }
  }
  await pollPvpNow();
  renderPvpContent();
}

async function chooseTopic(topic) {
  const data = await api('POST', '/api/pvp/choose-topic', { topic });
  if (data.error) { showToast(data.error, 'wrong'); return; }

  state.pvp.state     = 'my_turn_playing';
  state.pvp.topic     = topic;
  state.pvp.startedAt = data.started_at;
  state.pvp.pvpScore  = 0;

  // Ustaw temat i trudność dla pytań (nie wywołujemy selectTopic — nie ma przycisku)
  state.currentTopic      = topic;
  state.currentDifficulty = 'medium';
  state.mistakes          = 0;
  state.questionIndex     = 0;
  state.isFirstAttempt    = true;
  state.answerLocked      = false;
  state.solutionShown     = false;

  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('exerciseArea').classList.add('visible');
  const titleEl = document.getElementById('topicTitle');
  if (titleEl) titleEl.textContent = `⚔️ PvP – ${topic}`;

  const multPanel = document.getElementById('multTablePanel');
  if (multPanel) multPanel.style.display = topic === 'Tabliczka mnożenia' ? 'block' : 'none';

  // Ukryj zakładki trudności i "Inny przykład" — w PvP ich nie ma
  const diffTabs = document.getElementById('difficultyTabs');
  const nextBtn  = document.getElementById('nextExampleBtn');
  if (diffTabs) diffTabs.style.display = 'none';
  if (nextBtn)  nextBtn.style.display  = 'none';

  // Pokaż banner z timerem PvP
  const banner = document.getElementById('pvpExerciseBanner');
  if (banner) banner.style.display = '';

  closePvp();
  hideChallengeSetup();
  showExerciseCard();
  loadQuestion();
  startPvpTimer();
}

function startPvpTimer() {
  clearInterval(state.pvp.timerInterval);
  state.pvp.timerInterval = setInterval(() => {
    const elapsed = Math.floor(Date.now() / 1000) - state.pvp.startedAt;
    const left = Math.max(0, 60 - elapsed);
    const urgent = left <= 10;

    // Timer w overlaycie PvP
    const timerEl = document.getElementById('pvpTimerNum');
    if (timerEl) {
      timerEl.textContent = left;
      if (urgent) timerEl.classList.add('urgent');
    }
    // Timer + score w banerze nad zadaniem
    const exTimer = document.getElementById('pvpExerciseTimer');
    if (exTimer) {
      exTimer.textContent = left;
      exTimer.style.color = urgent ? '#f472b6' : '#818cf8';
    }
    const exScore = document.getElementById('pvpExerciseScore');
    if (exScore) exScore.textContent = state.pvp.pvpScore;

    // Score w overlaycie
    const scoreEl = document.getElementById('pvpLiveScore');
    if (scoreEl) scoreEl.textContent = state.pvp.pvpScore;

    if (left <= 0) {
      clearInterval(state.pvp.timerInterval);
      showPvpTimeUp();
    }
  }, 500);
}

function showPvpTimeUp() {
  const el = document.getElementById('pvpTimeUpScore');
  if (el) el.textContent = state.pvp.pvpScore;
  document.getElementById('pvpTimeUpOverlay').style.display = 'flex';
  endPvpTurn();
}

function dismissTimeUp() {
  document.getElementById('pvpTimeUpOverlay').style.display = 'none';
}

async function pvpRecordCorrect(topic) {
  const data = await api('POST', '/api/pvp/answer', { topic, streak: state.answerStreak });
  if (!data || data.error) return 0;

  state.pvp.pvpScore = data.pvp_score;

  // Aktualizuj normalny stan (punkty, tematy)
  if (state.currentUser) {
    state.currentUser.season_points = (state.currentUser.season_points || 0) + data.pts;
    state.currentUser.total_points  = (state.currentUser.total_points  || 0) + data.pts;
    if (!state.currentUser.topics) state.currentUser.topics = {};
    if (!state.currentUser.topics[topic]) state.currentUser.topics[topic] = { done: 0, points: 0 };
    state.currentUser.topics[topic].done   = data.done;
    state.currentUser.topics[topic].points += data.pts;
  }

  if (data.newAchs?.length) {
    data.newAchs.forEach(a => showAchievementToast(a));
    state.achievements.push(...data.newAchs.map(a => a.id));
    state.bonusPts = Math.floor(state.achievements.length / 15);
    updateAchBtn();
  }

  // Zaktualizuj liczniki (overlay + baner nad zadaniem)
  const scoreEl  = document.getElementById('pvpLiveScore');
  const exScore  = document.getElementById('pvpExerciseScore');
  if (scoreEl)  scoreEl.textContent  = state.pvp.pvpScore;
  if (exScore)  exScore.textContent  = state.pvp.pvpScore;

  updateUserPanel();
  return data.pts;
}

async function endPvpTurn() {
  clearInterval(state.pvp.timerInterval);
  state.pvp.timerInterval = null;

  // Przywróć normalny UI ćwiczeń
  const diffTabs = document.getElementById('difficultyTabs');
  const nextBtn  = document.getElementById('nextExampleBtn');
  const banner   = document.getElementById('pvpExerciseBanner');
  if (diffTabs) diffTabs.style.display = '';
  if (nextBtn)  nextBtn.style.display  = '';
  if (banner)   banner.style.display   = 'none';

  const data = await api('POST', '/api/pvp/end-turn').catch(() => null);
  state.pvp.state = 'waiting_opponent';
  state.pvp.topic = null;

  if (data?.match_status === 'finished') {
    await pollPvpNow();
  } else {
    updatePvpBadge();
  }

  showToast(`⚔️ Tura zakończona! Poprawnych: ${state.pvp.pvpScore}`, 'correct');
}

async function dismissPvpResult() {
  await api('POST', '/api/pvp/dismiss').catch(() => {});
  state.pvp.state = 'idle';
  state.pvp.match = null;
  state.pvp.iWon  = null;
  // Odświeżaj punkty/dukaty po meczu
  const fresh = await api('GET', '/api/me').catch(() => null);
  if (fresh?.user) {
    state.currentUser.dukaty        = fresh.user.dukaty;
    state.currentUser.season_points = fresh.user.season_points;
    state.currentUser.total_points  = fresh.user.total_points;
    state.dukaty = fresh.user.dukaty;
    updateUserPanel();
  }
  renderPvpContent();
  loadAvailableChallenges();
}

// ============================================================
// START
// ============================================================

window.addEventListener('DOMContentLoaded', initApp);

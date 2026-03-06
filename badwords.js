// Lista zakazanych słów — wulgaryzmy i slursy PL + EN
// Sprawdzamy podciąg po normalizacji (leet speak, polskie znaki → ASCII)

const BAD_WORDS = [
  // ── Polski ──────────────────────────────────────────────────
  'kurwa','kurw','kurwy','kurwę','kurwą','kurwi',
  'chuj','chuja','chujek','chujowy',
  'pizda','pizdę','pizdą','pizdy',
  'cipa','cipę','cipą',
  'jebac','jebać','jebany','jebana','jebane','jebię','jebie','jebię',
  'pierdol','pierdolić','pierdolę','pierdoli','pierdolony','pierdolona',
  'wkurw','wkurwi','wkurwia',
  'skurw','skurwiel','skurwysyn',
  'zapierd','zapierdalac','zapierdalać',
  'dupek','dupka',
  'gówno','gówna','gówniarz',
  'fiut','fiuta',
  'kutas','kutasa',
  'cwel','cwela',
  'pedal','pedał','pedalski',
  'pojeb','pojeban',
  'zjeb','zjeby',
  'sukinsyn',
  'morda','mordo',
  // Slursy etniczne/rasowe PL
  'czarnuch','czarnych',
  'bambus',
  'pedofil',
  'gwałcic','gwałciciel',
  // ── English ─────────────────────────────────────────────────
  'fuck','fucker','fucking','fucks','fucked','fuckface',
  'shit','shits','shitting','shitty',
  'bitch','bitches','bitchy',
  'cunt','cunts',
  'cock','cocks','cockhead',
  'dick','dicks','dickhead',
  'pussy','pussies',
  'ass','asshole','assholes','asses',
  'bastard','bastards',
  'whore','whores',
  'slut','sluts',
  'twat','twats',
  'wank','wanker','wankers',
  'nigger','nigga','niggas',
  'faggot','fag','fags',
  'retard','retards','retarded',
  'kike','spic','chink','gook','wetback','cracker','honkey',
  'pedo','pedophile',
  'rape','rapist',
];

// Normalizacja: małe litery + leet speak → litery
function normalize(str) {
  return str
    .toLowerCase()
    // Usuń polskie znaki diakrytyczne
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
    .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
    .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    // Leet speak
    .replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e')
    .replace(/4/g,'a').replace(/5/g,'s').replace(/8/g,'b')
    .replace(/@/g,'a').replace(/\$/g,'s').replace(/!/g,'i')
    // Usuń separatory (_, -, .)
    .replace(/[_\-\.]/g,'');
}

function containsBadWord(name) {
  const n = normalize(name);
  return BAD_WORDS.some(w => n.includes(normalize(w)));
}

module.exports = { containsBadWord };

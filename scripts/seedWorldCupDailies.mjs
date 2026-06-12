/**
 * Seeds World Cup 2026 themed daily games: 10 rounds per day, one of each of
 * the 10 round types, themed to that day's real fixtures (scripts/data/
 * wc2026-fixtures.json) and a curated facts bank (scripts/data/
 * worldcupFacts.mjs).
 *
 * Collections written (same model as migrateQuestions.mjs):
 *   questions/{id}        - round text + type + payload (NO answer here)
 *   questionAnswers/{id}  - the typed answer doc, locked down by firestore.rules
 *   dailyQuizzes/{date}   - status, availableAt, ordered questionIds, theme
 *
 * Round ids are deterministic (sha1 of date+slot+type) so re-runs are
 * idempotent; existing quiz docs are never clobbered unless --force-quizzes
 * (protects content edited in the admin panel).
 *
 * Usage:
 *   node scripts/seedWorldCupDailies.mjs [--dry-run] [--force-quizzes]
 *        [--date 2026-06-15] [--from 2026-06-12] [--to 2026-07-19]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import seedrandom from 'seedrandom';
import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, getDoc, Timestamp } from 'firebase/firestore';
import { ROUND_TYPES } from '../src/utils/roundTypes.js';
import { TEAMS, flagUrl, VENUES, NUMBER_FACTS, YEAR_FACTS, TIMELINE_EVENTS, LEGENDS } from './data/worldcupFacts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : null;
};
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const FORCE_QUIZZES = args.includes('--force-quizzes');

const FIXTURES = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'wc2026-fixtures.json'), 'utf8'));
const TOURNAMENT_END = '2026-07-19';
const todayStr = new Date().toISOString().slice(0, 10);
const FROM = argValue('--date') || argValue('--from') || todayStr;
const TO = argValue('--date') || argValue('--to') || TOURNAMENT_END;

// --- Firebase config: .env.local first, fallback to the project defaults ---
const loadEnvLocal = () => {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
};
const env = loadEnvLocal();
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAKhlBJk6gAZ5oNrCDniNGmrDOqPSLeirI',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'triviaworldcup-3930a.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'triviaworldcup-3930a',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'triviaworldcup-3930a.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '909476377418',
  appId: env.VITE_FIREBASE_APP_ID || '1:909476377418:web:e741d725943865572207b3'
};

// --- Helpers ---------------------------------------------------------------

const ALL_TEAMS = Object.keys(TEAMS);
const GROUPS = FIXTURES.groups;
const groupOf = (team) => Object.keys(GROUPS).find((g) => GROUPS[g].includes(team)) || null;

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const shuffle = (rng, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sample = (rng, arr, n) => shuffle(rng, arr).slice(0, n);

const scramble = (rng, name) => {
  const word = name.toUpperCase();
  for (let attempt = 0; attempt < 10; attempt++) {
    const scrambled = word
      .split(' ')
      .map((w) => shuffle(rng, w.split('')).join(''))
      .join(' ');
    if (scrambled !== word) return scrambled;
  }
  return word.split('').reverse().join('');
};

const stripVowels = (name) => name.toUpperCase().replace(/[AEIOUÁÉÍÓÚÜ]/g, '_');

// "Kylian Mbappé" → also accept "Mbappé"; teams accept nothing extra.
const acceptedFor = (name) => {
  const words = name.trim().split(/\s+/);
  return words.length > 1 ? [words[words.length - 1]] : [];
};

// Real (non-placeholder) teams playing on a date; falls back to all 48.
const teamsOfDay = (date) => {
  const matches = FIXTURES[date] || [];
  const teams = [];
  for (const m of matches) {
    if (TEAMS[m.home]) teams.push(m.home);
    if (TEAMS[m.away]) teams.push(m.away);
  }
  return teams.length ? [...new Set(teams)] : null;
};

const themeFor = (date) => {
  const matches = FIXTURES[date] || [];
  if (!matches.length) return 'World Cup 2026 — rest day special';
  const m = matches[0];
  const extra = matches.length - 1;
  return `${m.home} vs ${m.away} (${m.stage})${extra > 0 ? ` + ${extra} more game${extra > 1 ? 's' : ''}` : ''}`;
};

// --- Per-type round generators ---------------------------------------------
// Each returns the editor/seed shape that ROUND_TYPES[type].validate accepts:
// { text, options?, payload, answer, category, difficulty }

const withEliminate = (rng, payload, correct) => {
  const wrong = (payload.options || []).filter((o) => o !== correct);
  return wrong.length ? { ...payload, eliminate: pick(rng, wrong) } : payload;
};

const genCrestMatch = (rng, dayTeams) => {
  const team = pick(rng, dayTeams || ALL_TEAMS);
  const others = sample(rng, ALL_TEAMS.filter((t) => t !== team), 3);
  const options = [team, ...others];
  const payload = withEliminate(rng, { imageUrl: flagUrl(team), options }, team);
  return {
    type: 'crestMatch',
    text: 'Which nation flies this flag at the 2026 World Cup?',
    payload,
    answer: { correctAnswer: team },
    category: 'Flags'
  };
};

const genAnagram = (rng, dayTeams) => {
  const team = pick(rng, dayTeams || ALL_TEAMS);
  const star = TEAMS[team].star;
  const usePlayer = star && rng() < 0.6;
  const name = usePlayer ? star : team;
  return {
    type: 'anagram',
    text: usePlayer ? `They're playing today — unscramble this star's name:` : 'Unscramble this World Cup nation:',
    payload: { scrambled: scramble(rng, name), category: usePlayer ? 'Player' : 'Team' },
    answer: { correctAnswer: name, accepted: acceptedFor(name) },
    category: 'Word game'
  };
};

const genMissingVowels = (rng, dayTeams, avoid = []) => {
  const base = dayTeams || ALL_TEAMS;
  const blocked = new Set(avoid.map((a) => String(a).toLowerCase()));
  // Retry selection until the resolved name (team OR its star) isn't one an
  // earlier round already used — avoids the same answer twice in a day.
  let team = pick(rng, base);
  let usePlayer = TEAMS[team].star && rng() < 0.5;
  let name = usePlayer ? TEAMS[team].star : team;
  for (let attempt = 0; attempt < 20 && blocked.has(name.toLowerCase()); attempt++) {
    team = pick(rng, base);
    usePlayer = TEAMS[team].star && rng() < 0.5;
    name = usePlayer ? TEAMS[team].star : team;
  }
  return {
    type: 'missingVowels',
    text: 'The vowels have gone missing. Who or what is this?',
    payload: { puzzle: stripVowels(name), category: usePlayer ? 'Player' : 'Team' },
    answer: { correctAnswer: name, accepted: acceptedFor(name) },
    category: 'Word game'
  };
};

const genHigherLower = (rng, dayTeams) => {
  const base = dayTeams || ALL_TEAMS;
  // Prefer comparing a team playing today against anyone with a different
  // titles count; titles are the cleanest "who has more" metric.
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = pick(rng, base);
    const b = pick(rng, ALL_TEAMS);
    if (a === b || TEAMS[a].titles === TEAMS[b].titles) continue;
    const winner = TEAMS[a].titles > TEAMS[b].titles ? a : b;
    return {
      type: 'higherLower',
      text: 'Who has won more World Cups?',
      payload: { itemA: a, itemB: b, metric: 'World Cup titles' },
      answer: { correctAnswer: winner },
      category: 'Stats'
    };
  }
  return {
    type: 'higherLower',
    text: 'Who has won more World Cups?',
    payload: { itemA: 'Brazil', itemB: 'Germany', metric: 'World Cup titles' },
    answer: { correctAnswer: 'Brazil' },
    category: 'Stats'
  };
};

const genClosestGuess = (rng, date, dayIndex) => {
  const venues = [...new Set((FIXTURES[date] || []).map((m) => m.venue).filter((v) => VENUES[v]))];
  if (venues.length && rng() < 0.7) {
    const city = pick(rng, venues);
    const { stadium, capacity } = VENUES[city];
    return {
      type: 'closestGuess',
      text: `${stadium} hosts a match today. What's its capacity?`,
      payload: { min: 20000, max: 120000, step: 500, unit: 'seats' },
      answer: { correctValue: capacity, tolerancePct: 8 },
      category: 'Stadiums'
    };
  }
  const fact = NUMBER_FACTS[dayIndex % NUMBER_FACTS.length];
  return {
    type: 'closestGuess',
    text: fact.prompt,
    payload: { min: fact.min, max: fact.max, step: fact.step, unit: fact.unit },
    answer: { correctValue: fact.value, tolerancePct: 10 },
    category: 'Stats'
  };
};

const genYearGuesser = (rng, dayTeams, dayIndex) => {
  const candidates = (dayTeams || []).filter((t) => TEAMS[t].firstYear);
  if (candidates.length && rng() < 0.5) {
    const team = pick(rng, candidates);
    return {
      type: 'yearGuesser',
      text: `${team} play today. What year did they FIRST appear at a World Cup?`,
      payload: { min: 1930, max: 2026 },
      answer: { correctValue: TEAMS[team].firstYear },
      category: 'History'
    };
  }
  const fact = YEAR_FACTS[dayIndex % YEAR_FACTS.length];
  return {
    type: 'yearGuesser',
    text: fact.prompt,
    payload: { min: 1930, max: 2026 },
    answer: { correctValue: fact.year },
    category: 'History'
  };
};

const genCareerPath = (rng, dayTeams, dayIndex) => {
  const themed = LEGENDS.filter((l) => (dayTeams || []).includes(l.country));
  const legend = themed.length ? pick(rng, themed) : LEGENDS[dayIndex % LEGENDS.length];
  const options = [legend.answer, ...legend.distractors];
  const payload = withEliminate(rng, { clues: legend.clues, options }, legend.answer);
  return {
    type: 'careerPath',
    text: 'Mystery legend — who is it?',
    payload,
    answer: { correctAnswer: legend.answer },
    category: 'Legends'
  };
};

const genTimeline = (rng) => {
  // 4 events with distinct years, stored chronologically (ids a-d); players
  // see them shuffled client-side.
  const chosen = [];
  for (const ev of shuffle(rng, TIMELINE_EVENTS)) {
    if (!chosen.some((c) => c.year === ev.year)) chosen.push(ev);
    if (chosen.length === 4) break;
  }
  chosen.sort((x, y) => x.year - y.year);
  const ids = ['a', 'b', 'c', 'd'];
  return {
    type: 'timelineOrder',
    text: 'Put these World Cup moments in order',
    payload: { items: chosen.map((ev, i) => ({ id: ids[i], label: ev.label })) },
    answer: { correctOrder: ids },
    category: 'History'
  };
};

const genOddOneOut = (rng, dayTeams) => {
  const champions = ALL_TEAMS.filter((t) => TEAMS[t].titles > 0);
  const base = dayTeams || ALL_TEAMS;
  if (rng() < 0.5) {
    const nonChampions = base.filter((t) => TEAMS[t].titles === 0);
    const odd = nonChampions.length ? pick(rng, nonChampions) : pick(rng, ALL_TEAMS.filter((t) => TEAMS[t].titles === 0));
    const options = [...sample(rng, champions, 3), odd];
    return {
      type: 'oddOneOut',
      text: 'One of these nations has NEVER won the World Cup. Which?',
      payload: withEliminate(rng, { options }, odd),
      answer: { correctAnswer: odd },
      category: 'History'
    };
  }
  const team = pick(rng, base.filter(groupOf));
  const group = groupOf(team);
  const insiders = sample(rng, GROUPS[group].filter((t) => t !== team), 3);
  const outsider = pick(rng, ALL_TEAMS.filter((t) => groupOf(t) !== group));
  const options = [...insiders, outsider];
  return {
    type: 'oddOneOut',
    text: `Three of these are in Group ${group} with ${team}. Which one is NOT?`,
    payload: withEliminate(rng, { options }, outsider),
    answer: { correctAnswer: outsider },
    category: 'Groups'
  };
};

const genStandard = (rng, date, dayTeams) => {
  const matches = (FIXTURES[date] || []).filter((m) => TEAMS[m.home] && TEAMS[m.away]);
  if (matches.length && rng() < 0.6) {
    const m = pick(rng, matches);
    const subject = rng() < 0.5 ? m.home : m.away;
    const opponent = subject === m.home ? m.away : m.home;
    const others = sample(rng, ALL_TEAMS.filter((t) => t !== subject && t !== opponent), 2);
    return {
      type: 'standard',
      text: `Who do ${subject} face at the World Cup today?`,
      options: shuffle(rng, [opponent, ...others]),
      answer: { correctAnswer: opponent },
      category: 'Fixtures'
    };
  }
  const team = pick(rng, (dayTeams || ALL_TEAMS).filter(groupOf));
  const group = groupOf(team);
  const otherGroups = sample(rng, Object.keys(GROUPS).filter((g) => g !== group), 2);
  return {
    type: 'standard',
    text: `Which group are ${team} in at the 2026 World Cup?`,
    options: shuffle(rng, [group, ...otherGroups].map((g) => `Group ${g}`)),
    answer: { correctAnswer: `Group ${group}` },
    category: 'Groups'
  };
};

// --- Build a day ------------------------------------------------------------

// The answer "subject" of a round, used to keep one daily from asking about
// the same nation/player/value twice. Timeline has no single subject.
const answerKey = (round) => {
  const a = round.answer || {};
  if (a.correctAnswer) return a.correctAnswer.toLowerCase();
  if (a.correctValue !== undefined) return `#${a.correctValue}`;
  return null;
};

const buildDay = (date, dayIndex) => {
  const rng = seedrandom(`worldcupple-2026-${date}`);
  const dayTeams = teamsOfDay(date);

  // Each generator takes only an rng here so the dedup pass can re-roll any one
  // round in isolation with a fresh seed.
  const generators = {
    standard: (r) => genStandard(r, date, dayTeams),
    anagram: (r) => genAnagram(r, dayTeams),
    missingVowels: (r, avoid) => genMissingVowels(r, dayTeams, avoid),
    higherLower: (r) => genHigherLower(r, dayTeams),
    closestGuess: (r) => genClosestGuess(r, date, dayIndex),
    yearGuesser: (r) => genYearGuesser(r, dayTeams, dayIndex),
    careerPath: (r) => genCareerPath(r, dayTeams, dayIndex),
    crestMatch: (r) => genCrestMatch(r, dayTeams),
    timelineOrder: (r) => genTimeline(r),
    oddOneOut: (r) => genOddOneOut(r, dayTeams)
  };

  const order = ['standard', 'anagram', 'missingVowels', 'higherLower', 'closestGuess',
    'yearGuesser', 'careerPath', 'crestMatch', 'timelineOrder', 'oddOneOut'];

  // Build in order, re-rolling any round whose answer subject already appeared
  // earlier in the day (up to a few tries, then accept to stay deterministic).
  const used = new Set();
  const rounds = order.map((type) => {
    let round = generators[type](rng, [...used]);
    for (let attempt = 0; attempt < 8; attempt++) {
      const key = answerKey(round);
      if (!key || !used.has(key)) break;
      round = generators[type](seedrandom(`worldcupple-2026-${date}-${type}-${attempt}`), [...used]);
    }
    const key = answerKey(round);
    if (key) used.add(key);
    return round;
  });

  // Shuffle the order so every daily surprises (but keep trivia first as a warm-up).
  const [first, ...rest] = rounds;
  const ordered = [first, ...shuffle(rng, rest)];

  // Validate every round against the shared registry before it gets near Firestore.
  ordered.forEach((round, slot) => {
    const def = ROUND_TYPES[round.type];
    if (!def) throw new Error(`${date} slot ${slot}: unknown type ${round.type}`);
    const problem = def.validate(round);
    if (problem) throw new Error(`${date} slot ${slot} (${round.type}) ${problem}`);
  });

  return ordered.map((round, slot) => ({
    id: createHash('sha1').update(`${date}|${slot}|${round.type}`).digest('hex').slice(0, 16),
    round
  }));
};

const dateRange = (from, to) => {
  const dates = [];
  let d = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + 86400000);
  }
  return dates;
};

// --- Run ---------------------------------------------------------------------

const run = async () => {
  const dates = dateRange(FROM, TO);
  console.log(`Generating ${dates.length} day(s): ${FROM} → ${TO}`);

  const days = dates.map((date, i) => ({
    date,
    theme: themeFor(date),
    slots: buildDay(date, i)
  }));

  const totalRounds = days.reduce((n, d) => n + d.slots.length, 0);
  console.log(`All ${totalRounds} rounds validated against the round-type registry.`);

  if (DRY_RUN) {
    for (const day of days) {
      console.log(`\n${day.date} — ${day.theme}`);
      day.slots.forEach(({ id, round }, i) => {
        console.log(`  ${i + 1}. [${round.type}] ${round.text}  (${id})`);
        if (VERBOSE) {
          const shown = round.type === 'standard' ? { options: round.options } : round.payload;
          console.log(`        shows:  ${JSON.stringify(shown)}`);
          console.log(`        answer: ${JSON.stringify(ROUND_TYPES[round.type].answerDoc(round))}`);
        }
      });
    }
    console.log('\n[dry run] nothing written.');
    process.exit(0);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let batch = writeBatch(db);
  let ops = 0;
  const flush = async () => {
    if (ops > 0) await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };

  let created = 0;
  let skipped = 0;
  for (const day of days) {
    const quizRef = doc(db, 'dailyQuizzes', day.date);
    if (!FORCE_QUIZZES && (await getDoc(quizRef)).exists()) {
      skipped++;
      continue;
    }

    for (const { id, round } of day.slots) {
      const questionDoc = {
        text: round.text,
        type: round.type,
        category: round.category || '',
        difficulty: round.difficulty || '',
        inPracticePool: false,
        source: 'wc2026-seed'
      };
      if (round.type === 'standard') {
        questionDoc.options = round.options;
      } else {
        questionDoc.payload = round.payload;
      }
      batch.set(doc(db, 'questions', id), questionDoc);
      batch.set(doc(db, 'questionAnswers', id), ROUND_TYPES[round.type].answerDoc(round));
      ops += 2;
      if (ops >= 450) await flush();
    }

    const [y, m, d] = day.date.split('-').map(Number);
    batch.set(quizRef, {
      status: 'published',
      availableAt: Timestamp.fromDate(new Date(Date.UTC(y, m - 1, d))),
      questionIds: day.slots.map((s) => s.id),
      theme: day.theme
    });
    ops++;
    created++;
    if (ops >= 450) await flush();
  }
  await flush();

  console.log(`Daily quizzes: ${created} created, ${skipped} already existed (kept as-is; use --force-quizzes to overwrite).`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

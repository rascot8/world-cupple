/**
 * One-time migration: moves the CSV trivia questions into Firestore and
 * pre-generates the daily quizzes.
 *
 * Collections written:
 *   questions/{id}        - question text + 3 options (NO correct answer here)
 *   questionAnswers/{id}  - the correct answer, locked down by firestore.rules
 *   dailyQuizzes/{date}   - one doc per day (YYYY-MM-DD UTC) with 10 questionIds,
 *                           status ('published'/'draft') and availableAt timestamp.
 *                           Edit/review these in the Firebase console ahead of time.
 *
 * Questions used for the seeded daily quizzes are reserved (inPracticePool: false)
 * so practice mode can never reveal a daily answer.
 *
 * Usage:
 *   node scripts/migrateQuestions.mjs [--days 14] [--force-quizzes] [--dry-run]
 *
 * IMPORTANT: run this BEFORE deploying firestore.rules (the rules block client
 * writes to these collections). After rules are live, manage content via the
 * Firebase console.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import seedrandom from 'seedrandom';
import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, getDoc, Timestamp } from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const QUESTIONS_PER_DAY = 10;
const args = process.argv.slice(2);
const DAYS = (() => {
  const i = args.indexOf('--days');
  return i !== -1 ? parseInt(args[i + 1], 10) : 14;
})();
const FORCE_QUIZZES = args.includes('--force-quizzes');
const DRY_RUN = args.includes('--dry-run');

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Load + clean CSV rows ---
const parseCsvFile = (file) => {
  const csv = fs.readFileSync(path.join(__dirname, 'data', file), 'utf8');
  return Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
};

const rows = [
  ...parseCsvFile('FifaTriviaPart1 - Sheet1.csv'),
  ...parseCsvFile('FifaTriviaPart2 - Sheet1.csv')
];

const seenTexts = new Set();
const questions = [];
for (const row of rows) {
  const text = (row.Question || '').trim();
  const correctAnswer = (row['Correct Answer'] || '').trim();
  if (!text || !correctAnswer) continue;

  const key = text.toLowerCase();
  if (seenTexts.has(key)) {
    console.warn(`  duplicate skipped: "${text}"`);
    continue;
  }
  seenTexts.add(key);

  const options = [row['Option A'], row['Option B'], row['Option C']]
    .map(o => (o || '').trim())
    .filter(Boolean);
  if (!options.includes(correctAnswer)) {
    console.warn(`  correct answer not among options, fixing: "${text}"`);
    options[options.length - 1] = correctAnswer;
  }

  questions.push({
    id: createHash('sha1').update(key).digest('hex').slice(0, 16),
    text,
    options,
    category: (row.Category || '').trim(),
    difficulty: (row.Difficulty || '').trim(),
    correctAnswer
  });
}

console.log(`Parsed ${questions.length} unique questions from CSV.`);

const reservedCount = DAYS * QUESTIONS_PER_DAY;
if (questions.length < reservedCount) {
  console.error(`Not enough questions to reserve ${reservedCount} for ${DAYS} days of dailies. Lower --days.`);
  process.exit(1);
}

// Deterministic split so re-runs assign the same questions to the same pools.
const rng = seedrandom('somesingsexy-migration-v1');
const shuffled = [...questions];
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
const dailyReserve = shuffled.slice(0, reservedCount);
const dailyIds = new Set(dailyReserve.map(q => q.id));

// --- Build daily quiz docs for the next DAYS days (UTC) ---
const todayUTC = new Date();
const dateStrFor = (offset) => {
  const d = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate() + offset));
  return {
    str: d.toISOString().slice(0, 10),
    availableAt: Timestamp.fromDate(d)
  };
};

const quizDocs = [];
for (let day = 0; day < DAYS; day++) {
  const { str, availableAt } = dateStrFor(day);
  quizDocs.push({
    date: str,
    data: {
      status: 'published',
      availableAt,
      questionIds: dailyReserve.slice(day * QUESTIONS_PER_DAY, (day + 1) * QUESTIONS_PER_DAY).map(q => q.id)
    }
  });
}

const run = async () => {
  if (DRY_RUN) {
    console.log(`[dry run] would write ${questions.length} questions + answers`);
    console.log(`[dry run] would create quizzes: ${quizDocs.map(q => q.date).join(', ')}`);
    process.exit(0);
  }

  // Questions + answers, in batches (500 op limit per batch)
  let batch = writeBatch(db);
  let ops = 0;
  const flush = async () => {
    if (ops > 0) await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };

  for (const q of questions) {
    batch.set(doc(db, 'questions', q.id), {
      text: q.text,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty,
      inPracticePool: !dailyIds.has(q.id),
      source: 'csv-migration'
    });
    batch.set(doc(db, 'questionAnswers', q.id), { correctAnswer: q.correctAnswer });
    ops += 2;
    if (ops >= 450) await flush();
  }
  await flush();
  console.log(`Wrote ${questions.length} questions (${questions.length - dailyIds.size} in practice pool, ${dailyIds.size} reserved for dailies).`);

  // Daily quizzes — never clobber a quiz the admin may have edited
  let created = 0, skipped = 0;
  for (const quiz of quizDocs) {
    const ref = doc(db, 'dailyQuizzes', quiz.date);
    if (!FORCE_QUIZZES && (await getDoc(ref)).exists()) {
      skipped++;
      continue;
    }
    batch.set(ref, quiz.data);
    ops++;
    created++;
    if (ops >= 450) await flush();
  }
  await flush();
  console.log(`Daily quizzes: ${created} created, ${skipped} already existed (kept as-is; use --force-quizzes to overwrite).`);
  console.log('Done. Now deploy firestore.rules and remove Firestore test mode.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

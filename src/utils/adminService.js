import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  documentId,
  writeBatch,
  Timestamp
} from 'firebase/firestore';

/**
 * Admin-only data layer. Every write here is gated by firestore.rules
 * (isAdmin()), so a non-admin calling these will simply be rejected server-side.
 */

// --- Quizzes ---

/**
 * Fetch all daily-quiz docs whose date id falls in [startDate, endDate]
 * (inclusive). Date ids are YYYY-MM-DD, which sort chronologically.
 * Returns a map keyed by date string.
 */
export const fetchQuizzesInRange = async (startDate, endDate) => {
  if (!db) return {};
  const q = query(
    collection(db, 'dailyQuizzes'),
    where(documentId(), '>=', startDate),
    where(documentId(), '<=', endDate),
    orderBy(documentId())
  );
  const snap = await getDocs(q);
  const byDate = {};
  snap.forEach((d) => {
    byDate[d.id] = { date: d.id, ...d.data() };
  });
  return byDate;
};

/**
 * Load a single day's quiz fully hydrated: the quiz meta plus each question
 * with its options and correct answer, in quiz order.
 * Returns null if no quiz exists for that date.
 */
export const fetchQuizForEditing = async (date) => {
  const quizSnap = await getDoc(doc(db, 'dailyQuizzes', date));
  if (!quizSnap.exists()) return null;
  const quiz = quizSnap.data();
  const ids = Array.isArray(quiz.questionIds) ? quiz.questionIds : [];

  const questions = await Promise.all(
    ids.map(async (id) => {
      const [qSnap, aSnap] = await Promise.all([
        getDoc(doc(db, 'questions', id)),
        getDoc(doc(db, 'questionAnswers', id))
      ]);
      const qData = qSnap.exists() ? qSnap.data() : { text: '', options: ['', '', ''] };
      return {
        id,
        text: qData.text || '',
        options: [qData.options?.[0] || '', qData.options?.[1] || '', qData.options?.[2] || ''],
        category: qData.category || '',
        difficulty: qData.difficulty || '',
        inPracticePool: qData.inPracticePool ?? false,
        correctAnswer: aSnap.exists() ? aSnap.data().correctAnswer : ''
      };
    })
  );

  return {
    date,
    status: quiz.status || 'draft',
    availableAt: quiz.availableAt || null,
    questions
  };
};

/**
 * Convert a YYYY-MM-DD string to a Firestore Timestamp at 00:00 UTC.
 */
export const dateStringToTimestamp = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return Timestamp.fromDate(new Date(Date.UTC(y, m - 1, d)));
};

/**
 * Persist a full day of edits in one atomic batch:
 *  - each question doc (text/options/category/difficulty, preserving inPracticePool)
 *  - each answer doc (correctAnswer)
 *  - the quiz doc (status, availableAt, ordered questionIds)
 *
 * `questions` is the editor array; correctAnswer must be one of the options.
 */
export const saveQuiz = async (date, { status, questions }) => {
  const batch = writeBatch(db);

  for (const q of questions) {
    const options = q.options.map((o) => (o || '').trim());
    batch.set(doc(db, 'questions', q.id), {
      text: (q.text || '').trim(),
      options,
      category: (q.category || '').trim(),
      difficulty: (q.difficulty || '').trim(),
      // Daily questions stay out of the practice pool so they can't be farmed
      // for answers; preserve whatever the question already had otherwise.
      inPracticePool: q.inPracticePool ?? false,
      source: 'admin'
    });
    batch.set(doc(db, 'questionAnswers', q.id), {
      correctAnswer: (q.correctAnswer || '').trim()
    });
  }

  batch.set(doc(db, 'dailyQuizzes', date), {
    status,
    availableAt: dateStringToTimestamp(date),
    questionIds: questions.map((q) => q.id)
  });

  await batch.commit();
};

/**
 * Create an empty draft quiz for a date that has none yet.
 */
export const createDraftQuiz = async (date) => {
  await setDoc(doc(db, 'dailyQuizzes', date), {
    status: 'draft',
    availableAt: dateStringToTimestamp(date),
    questionIds: []
  });
};

// --- Questions library (for the "add existing question" picker) ---

/**
 * Fetch every question (without answers) for the admin picker. Fine for the
 * current dataset size; paginate later if the library grows large.
 */
export const fetchAllQuestions = async () => {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'questions'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * A blank question shell for adding a brand-new question to a day.
 * Uses a client-generated id; the doc is only created on save.
 */
export const blankQuestion = () => ({
  id: (crypto.randomUUID?.() || `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).replace(/-/g, '').slice(0, 16),
  text: '',
  options: ['', '', ''],
  category: '',
  difficulty: '',
  inPracticePool: false,
  correctAnswer: '',
  isNew: true
});

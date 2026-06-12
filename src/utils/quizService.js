import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { getTodayUTCString } from './dailySeed';

/**
 * Fetch today's quiz definition (date + ordered question ids).
 * Returns null if no published quiz exists for today.
 */
export const fetchTodayQuiz = async () => {
  if (!db) return null;
  const date = getTodayUTCString();
  const snap = await getDoc(doc(db, 'dailyQuizzes', date));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.status !== 'published' || !Array.isArray(data.questionIds) || data.questionIds.length === 0) {
    return null;
  }
  return { date, questionIds: data.questionIds, theme: data.theme || null };
};

/**
 * Fetch a single question (text + options only — the answer lives in a
 * separate, rule-locked collection).
 */
export const fetchQuestion = async (questionId) => {
  const snap = await getDoc(doc(db, 'questions', questionId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Fetch the correct answer for a question. Security rules only allow this
 * for practice-pool questions, or daily questions the user already answered.
 */
export const fetchCorrectAnswer = async (questionId) => {
  const snap = await getDoc(doc(db, 'questionAnswers', questionId));
  return snap.exists() ? snap.data().correctAnswer : null;
};

/**
 * The full answer doc for a round. Shape depends on the round type
 * (correctAnswer / accepted / correctValue / correctOrder…) — see grading.js.
 * Same rule lock as fetchCorrectAnswer: readable only after the user's
 * dailyAnswers doc exists (or for practice-pool questions).
 */
export const fetchAnswerDoc = async (questionId) => {
  const snap = await getDoc(doc(db, 'questionAnswers', questionId));
  return snap.exists() ? snap.data() : null;
};

/**
 * Lock in the user's answer for a daily round (immutable, enforced by
 * rules), then fetch the now-unlocked answer doc.
 * Pass choice = null for a timeout (locks the round with an empty answer).
 */
export const submitDailyAnswer = async (uid, quizDate, questionId, choice) => {
  try {
    await setDoc(doc(db, 'users', uid, 'dailyAnswers', questionId), {
      choice: choice ?? '',
      quizDate,
      submittedAt: serverTimestamp()
    });
  } catch (error) {
    // Rules reject a second write for the same question (answers are final).
    // The answer is already unlocked in that case, so just continue.
    console.warn('Answer already locked in:', error?.code || error);
  }
  return fetchAnswerDoc(questionId);
};

/**
 * Answers the user already submitted for a given quiz date, keyed by
 * question id. Used to resume a quiz after a refresh (no replays).
 */
export const fetchTodaySubmissions = async (uid, quizDate) => {
  const q = query(
    collection(db, 'users', uid, 'dailyAnswers'),
    where('quizDate', '==', quizDate)
  );
  const snap = await getDocs(q);
  const submissions = {};
  snap.forEach((d) => {
    submissions[d.id] = d.data().choice;
  });
  return submissions;
};

/**
 * All practice-pool questions. Questions reserved for daily quizzes are
 * excluded so practice can never reveal a daily answer.
 */
export const fetchPracticeQuestions = async () => {
  if (!db) return [];
  const q = query(collection(db, 'questions'), where('inPracticePool', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

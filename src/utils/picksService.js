import { db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

/**
 * Data layer for Match Day Picks. Writes that move RP (placing and settling
 * wagers) go through Cloud Functions so the betting economy stays server-
 * authoritative; reads come straight from Firestore.
 */

/**
 * Lock a wager on a pick. The Function escrows the stake, snapshots the odds,
 * and returns the new balance. Throws (with a readable message) on any
 * validation failure — closed betting, insufficient RP, already locked, etc.
 */
export const placePick = async (quizDate, questionId, choice, stake) => {
  const fn = httpsCallable(functions, 'placePick');
  const res = await fn({ quizDate, questionId, choice, stake });
  return res.data; // { ok, stake, odds, newBalance }
};

/**
 * Every pick the user has wagered on, newest first, hydrated with the question
 * (fixture/options) and the settlement outcome if it has been settled.
 * Returns [{ questionId, choice, stake, odds, quizDate, fixture, text, options,
 *            settlement: { result, won, void, payout, rpDelta } | null }]
 */
export const fetchUserPicks = async (uid) => {
  if (!db || !uid) return [];
  const ansSnap = await getDocs(
    query(collection(db, 'users', uid, 'dailyAnswers'), where('type', '==', 'pick'))
  );

  const picks = await Promise.all(
    ansSnap.docs.map(async (d) => {
      const a = d.data();
      const [qSnap, sSnap] = await Promise.all([
        getDoc(doc(db, 'questions', d.id)),
        getDoc(doc(db, 'users', uid, 'pickSettlements', d.id))
      ]);
      const q = qSnap.exists() ? qSnap.data() : {};
      return {
        questionId: d.id,
        choice: a.choice,
        stake: a.stake,
        odds: a.odds,
        quizDate: a.quizDate || '',
        fixture: q.fixture || '',
        text: q.text || '',
        options: q.options || [],
        settlement: sSnap.exists() ? sSnap.data() : null
      };
    })
  );

  picks.sort((a, b) => (b.quizDate || '').localeCompare(a.quizDate || ''));
  return picks;
};

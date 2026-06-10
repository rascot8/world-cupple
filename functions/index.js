/**
 * Cloud Functions for Match Day Picks — the server-authoritative half of the
 * wagering feature. RP (stored as `users/{uid}.fp`) can only move through here,
 * which is what keeps the betting economy honest:
 *
 *   placePick   — a player locks a wager. Runs in a transaction: validates the
 *                 pick is open, snapshots the odds from the question doc (so the
 *                 client can't forge favourable odds), checks the balance, then
 *                 escrows the stake (fp -= stake) and writes the immutable pick.
 *
 *   settlePick  — an admin enters the result (or voids). Fans out over every
 *                 wager on the question, credits each wallet, and records a
 *                 per-user settlement. Idempotent: a pick that already has a
 *                 settlement doc is skipped, so re-running never double-pays.
 *
 * Payout model (decimal odds d, stake S, escrowed up front):
 *   win   -> credit S*d   (stake back + profit)  => net +S*(d-1)
 *   lose  -> credit 0                              => net -S
 *   void  -> credit S      (stake refunded)        => net  0
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const requireAuth = (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be signed in.');
  return uid;
};

/**
 * Lock a wager on a Match Day Pick. Everything that matters (odds, lock time,
 * balance) is read server-side inside the transaction so it can't be spoofed.
 */
exports.placePick = onCall(async (request) => {
  const uid = requireAuth(request);
  const { questionId, choice, stake, quizDate } = request.data || {};

  if (typeof questionId !== 'string' || typeof choice !== 'string' || typeof quizDate !== 'string') {
    throw new HttpsError('invalid-argument', 'Missing pick details.');
  }
  const stakeInt = Math.floor(Number(stake));
  if (!Number.isFinite(stakeInt) || stakeInt <= 0) {
    throw new HttpsError('invalid-argument', 'Stake must be a positive whole number.');
  }

  const result = await db.runTransaction(async (tx) => {
    const qRef = db.doc(`questions/${questionId}`);
    const quizRef = db.doc(`dailyQuizzes/${quizDate}`);
    const userRef = db.doc(`users/${uid}`);
    const ansRef = db.doc(`users/${uid}/dailyAnswers/${questionId}`);

    const [qSnap, quizSnap, userSnap, ansSnap] = await Promise.all([
      tx.get(qRef), tx.get(quizRef), tx.get(userRef), tx.get(ansRef)
    ]);

    if (ansSnap.exists) throw new HttpsError('already-exists', 'You already locked this pick.');
    if (!qSnap.exists) throw new HttpsError('not-found', 'Question not found.');

    const q = qSnap.data();
    if (q.type !== 'pick') throw new HttpsError('failed-precondition', 'This question is not a Match Day Pick.');

    if (!quizSnap.exists) throw new HttpsError('not-found', 'Quiz not found.');
    const quiz = quizSnap.data();
    if (quiz.status !== 'published') throw new HttpsError('failed-precondition', 'This quiz is not live yet.');
    if (!Array.isArray(quiz.questionIds) || !quiz.questionIds.includes(questionId)) {
      throw new HttpsError('failed-precondition', 'This pick is not part of the quiz.');
    }

    const now = admin.firestore.Timestamp.now();
    if (quiz.availableAt && quiz.availableAt.toMillis() > now.toMillis()) {
      throw new HttpsError('failed-precondition', 'This quiz is not available yet.');
    }
    if (q.locksAt && q.locksAt.toMillis() <= now.toMillis()) {
      throw new HttpsError('failed-precondition', 'Betting has closed for this match.');
    }

    const idx = (q.options || []).indexOf(choice);
    if (idx < 0) throw new HttpsError('invalid-argument', 'That option is not one of the choices.');
    const odds = Number(q.odds && q.odds[idx]);
    if (!Number.isFinite(odds) || odds < 1) {
      throw new HttpsError('failed-precondition', 'Odds are not set for that option.');
    }

    const balance = Number((userSnap.exists && userSnap.data().fp) || 0);
    if (balance < stakeInt) throw new HttpsError('failed-precondition', 'Not enough RP for that stake.');

    tx.set(ansRef, {
      choice,
      quizDate,
      questionId,
      type: 'pick',
      stake: stakeInt,
      odds,
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    tx.update(userRef, { fp: balance - stakeInt });

    return { stake: stakeInt, odds, newBalance: balance - stakeInt };
  });

  return { ok: true, ...result };
});

/**
 * Settle a Match Day Pick. Admin-only. Pass { questionId, winningOption } to
 * settle, or { questionId, voidPick: true } to refund every stake.
 */
exports.settlePick = onCall(async (request) => {
  const uid = requireAuth(request);

  const adminSnap = await db.doc(`users/${uid}`).get();
  if (!adminSnap.exists || adminSnap.data().isAdmin !== true) {
    throw new HttpsError('permission-denied', 'Admins only.');
  }

  const { questionId, winningOption, voidPick } = request.data || {};
  if (typeof questionId !== 'string') throw new HttpsError('invalid-argument', 'Missing questionId.');

  const qSnap = await db.doc(`questions/${questionId}`).get();
  if (!qSnap.exists || qSnap.data().type !== 'pick') {
    throw new HttpsError('failed-precondition', 'This question is not a Match Day Pick.');
  }
  const options = qSnap.data().options || [];

  const isVoid = voidPick === true;
  if (!isVoid) {
    if (typeof winningOption !== 'string') throw new HttpsError('invalid-argument', 'Provide a winning option or void.');
    if (!options.includes(winningOption)) throw new HttpsError('invalid-argument', 'Winning option is not one of the choices.');
  }

  // Record the outcome. This also unlocks the result for players who picked
  // (the questionAnswers read rule grants access once a dailyAnswer exists).
  await db.doc(`questionAnswers/${questionId}`).set({
    correctAnswer: isVoid ? '' : winningOption,
    void: isVoid,
    settledAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Every wager lives at users/{uid}/dailyAnswers/{questionId} with a
  // questionId field, so a collection-group query gathers them all.
  const picks = await db.collectionGroup('dailyAnswers').where('questionId', '==', questionId).get();

  let settled = 0;
  let skipped = 0;
  for (const pickDoc of picks.docs) {
    const data = pickDoc.data();
    const stake = Math.floor(Number(data.stake));
    if (data.type !== 'pick' || !(stake > 0)) { skipped++; continue; }

    const userRef = pickDoc.ref.parent.parent; // users/{uid}
    const settleRef = userRef.collection('pickSettlements').doc(questionId);

    const didSettle = await db.runTransaction(async (tx) => {
      const [settleSnap, userSnap] = await Promise.all([tx.get(settleRef), tx.get(userRef)]);
      if (settleSnap.exists) return false; // already settled — never double-pay

      const odds = Number(data.odds) || 1;
      const won = !isVoid && data.choice === winningOption;
      const payout = isVoid ? stake : (won ? Math.round(stake * odds) : 0);
      const rpDelta = payout - stake;
      const balance = Number((userSnap.exists && userSnap.data().fp) || 0);

      tx.update(userRef, { fp: Math.max(0, balance + payout) });
      tx.set(settleRef, {
        questionId,
        result: isVoid ? 'void' : winningOption,
        choice: data.choice,
        won,
        void: isVoid,
        stake,
        odds,
        payout,
        rpDelta,
        settledAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    });

    if (didSettle) settled++; else skipped++;
  }

  return { ok: true, settled, skipped, total: picks.size };
});

/**
 * Pure helpers for Match Day Picks — payout maths and display formatting.
 * The authoritative version of this maths lives in the settlePick Cloud
 * Function; these mirror it so the UI can show an accurate preview.
 *
 * Decimal odds `d`, stake `S`:
 *   win  -> net +round(S*(d-1))   (you also get your stake back)
 *   lose -> net -S
 */

// Net RP gained on a winning wager (profit only — stake is returned on top).
export const potentialWin = (stake, odds) => {
  const s = Math.floor(Number(stake) || 0);
  const d = Number(odds) || 0;
  if (s <= 0 || d < 1) return 0;
  return Math.round(s * d) - s;
};

// Decimal odds shown as e.g. "×4.00".
export const formatOdds = (odds) => {
  const d = Number(odds);
  return Number.isFinite(d) && d >= 1 ? `×${d.toFixed(2)}` : '—';
};

// Implied chance for a set of decimal odds, e.g. 4.0 -> "25%".
export const impliedChance = (odds) => {
  const d = Number(odds);
  return Number.isFinite(d) && d >= 1 ? `${Math.round(100 / d)}%` : '—';
};

// A Firestore Timestamp (or {seconds}) -> millis, tolerant of shapes.
export const toMillis = (ts) => {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  return null;
};

// True once a pick's betting window (locksAt = kickoff) has passed.
export const isBettingClosed = (locksAt) => {
  const ms = toMillis(locksAt);
  return ms !== null && Date.now() >= ms;
};

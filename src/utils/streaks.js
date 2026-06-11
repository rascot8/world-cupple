/**
 * Daily streak engine. A streak is consecutive UTC days with a completed
 * Daily Match. Streak Shields (bought in the store or earned at milestones)
 * are consumed automatically to bridge exactly one missed day.
 */

/** dateStr ± n days, both as YYYY-MM-DD (UTC). */
export const addDaysUTC = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

/**
 * Given the user's record and today's date, work out the new streak.
 * Returns { newStreak, usedFreeze }.
 */
export const computeStreakUpdate = (userData, today) => {
  const last = userData?.lastPlayedDate || null;
  const prev = Math.max(0, userData?.playStreak || 0);
  const freezes = Math.max(0, userData?.streakFreezes || 0);

  if (!last) return { newStreak: 1, usedFreeze: false };
  if (last === today) return { newStreak: prev || 1, usedFreeze: false }; // double-call guard
  if (last === addDaysUTC(today, -1)) return { newStreak: prev + 1, usedFreeze: false };
  // Exactly one missed day and a shield in the bag: the shield eats the gap.
  if (last === addDaysUTC(today, -2) && freezes > 0) return { newStreak: prev + 1, usedFreeze: true };
  return { newStreak: 1, usedFreeze: false };
};

/**
 * Milestone rewards paid out the day a streak hits the mark.
 * Beyond 30, every 7th day keeps paying — the streak must never go stale.
 */
const MILESTONES = {
  3: { fp: 50, coins: 0, packs: { bronze: 1 }, label: 'Group Stage Form' },
  7: { fp: 100, coins: 50, consumables: { hints: 1, extraTime: 1 }, label: 'One Week Wonder' },
  14: { fp: 200, coins: 100, consumables: { hints: 2, extraTime: 2, secondChances: 1 }, label: 'Two-Week Titan' },
  21: { fp: 300, coins: 150, consumables: { hints: 3, extraTime: 3 }, label: 'Knockout Material' },
  30: { fp: 500, coins: 300, consumables: { hints: 5, extraTime: 5, secondChances: 2 }, label: 'The Invincible' }
};

export const getMilestoneReward = (streak) => {
  if (MILESTONES[streak]) return { streak, ...MILESTONES[streak] };
  if (streak > 30 && streak % 7 === 0) {
    return { streak, fp: 150, coins: 75, consumables: { hints: 2, extraTime: 2, secondChances: 1 }, label: 'Still Standing' };
  }
  return null;
};

/** The next milestone ahead of the current streak (for "N days to go" UI). */
export const getNextMilestone = (streak) => {
  const fixed = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b);
  for (const m of fixed) if (m > streak) return m;
  return Math.ceil((streak + 1) / 7) * 7;
};

/**
 * Which of the trailing 7 days (oldest → today) are covered by the streak.
 * Used for the Wordle-style week dots on the dashboard.
 */
export const weekDots = (userData, today) => {
  const last = userData?.lastPlayedDate || null;
  const streak = Math.max(0, userData?.playStreak || 0);
  // The streak covers `streak` consecutive days ending at lastPlayedDate —
  // but only if that run is still alive (played today or yesterday).
  const alive = last === today || last === addDaysUTC(today, -1);
  const covered = new Set();
  if (alive && streak > 0) {
    for (let i = 0; i < streak; i++) covered.add(addDaysUTC(last, -i));
  }
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const day = addDaysUTC(today, -i);
    dots.push({ day, played: covered.has(day), isToday: day === today });
  }
  return dots;
};

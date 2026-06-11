/**
 * Ghost players — the crowd that makes the stadium feel full.
 *
 * 45 deterministic fake competitors blended into the global leaderboard
 * client-side (no Firestore writes, works under locked-down rules). Their FP
 * drifts every UTC day via seeded noise, so the table reshuffles daily and
 * the movement arrows light up — same board for every player.
 */
import seedrandom from 'seedrandom';
import { addDaysUTC } from './streaks';

const SEASON_START = '2026-06-11'; // opening day — ghosts grind from here

// [username, countryCode, baseFP, dailyGrowth, vip]
const GHOSTS = [
  ['SambaKing10', 'BR', 5230, 38, true],
  ['LaPulgaForever', 'AR', 4910, 41, false],
  ['Siuuu_Madeira', 'PT', 4655, 35, true],
  ['KaiserFranz_II', 'DE', 4310, 33, false],
  ['AllezLesBleus', 'FR', 4050, 39, false],
  ['ThreeLionsRoar', 'EN', 3870, 31, true],
  ['TikiTakaTio', 'ES', 3640, 34, false],
  ['OranjeStorm', 'NL', 3415, 30, false],
  ['AzzurriHeart', 'IT', 3200, 28, false],
  ['ElTriGuerrero', 'MX', 3010, 36, false],
  ['ChicharitoFan', 'MX', 2840, 27, false],
  ['SakaStan7', 'EN', 2690, 32, false],
  ['GauchoMagic', 'BR', 2515, 25, true],
  ['TangoMaestro', 'AR', 2380, 29, false],
  ['BavarianWall', 'DE', 2245, 24, false],
  ['LeButeur', 'FR', 2110, 26, false],
  ['Cafeteros_9', 'CO', 1985, 30, false],
  ['CelticViking', 'NO', 1860, 28, false],
  ['TaegukWarrior', 'KR', 1740, 25, false],
  ['SamuraiBlue10', 'JP', 1625, 27, false],
  ['DesertFalcon', 'SA', 1510, 22, false],
  ['PharaohKing', 'EG', 1400, 24, false],
  ['AtlasLion_MA', 'MA', 1295, 31, true],
  ['BafanaBafana1', 'ZA', 1190, 20, false],
  ['SuperEagleJay', 'NG', 1090, 26, false],
  ['CaptainAmerica26', 'US', 995, 33, false],
  ['MapleStriker', 'CA', 905, 25, false],
  ['SocceroosFan', 'AU', 820, 21, false],
  ['KiwiKeeper', 'NZ', 740, 18, false],
  ['PolskaPower', 'PL', 665, 22, false],
  ['DanishDynamite', 'DK', 595, 20, false],
  ['HelvetiaRock', 'CH', 530, 17, false],
  ['VikingClap_IS', 'IS', 470, 16, false],
  ['DragonWales', 'WA', 415, 19, false],
  ['TartanArmy_SC', 'SC', 365, 18, false],
  ['LaRojaChile', 'CL', 320, 21, false],
  ['GarraCharrua', 'UY', 280, 23, false],
  ['VinotintoVal', 'VE', 240, 15, false],
  ['BlueSamurai_K', 'JP', 200, 19, false],
  ['QatariFalcon', 'QA', 165, 14, false],
  ['CroatiaCheck', 'HR', 130, 22, false],
  ['MagyarMidfield', 'HU', 100, 16, false],
  ['BeneluxBaller', 'BE', 75, 20, false],
  ['AndesCondor', 'EC', 50, 18, false],
  ['RookieOfTheCup', 'US', 20, 12, false]
];

const dayIndex = (dateStr) => {
  const ms = Date.parse(`${dateStr}T00:00:00Z`) - Date.parse(`${SEASON_START}T00:00:00Z`);
  return Math.max(0, Math.floor(ms / 86400000));
};

const ghostFpOn = (ghost, idx, dateStr) => {
  const [username, , base, growth] = ghost;
  const days = dayIndex(dateStr);
  let fp = base;
  for (let d = 1; d <= days; d++) {
    const rng = seedrandom(`ghost:${username}:${d}`);
    // Some days a ghost crushes the quiz, some days they lose FP — like us.
    fp += Math.round(growth * (rng() * 2.2 - 0.55));
  }
  return Math.max(0, fp + idx % 3); // tiny tiebreaker so sorts stay stable
};

/**
 * The ghost field for a given UTC date, with `startOfDayRank` precomputed so
 * the existing leaderboard movement arrows just work after merging.
 */
export const getGhostPlayers = (dateStr) => {
  const yesterday = addDaysUTC(dateStr, -1);
  const ghosts = GHOSTS.map((g, i) => ({
    id: `ghost_${i}`,
    username: g[0],
    country: g[1],
    vip: g[4],
    isGhost: true,
    fp: ghostFpOn(g, i, dateStr),
    fpYesterday: ghostFpOn(g, i, yesterday)
  }));

  const yesterdayRank = new Map(
    [...ghosts].sort((a, b) => b.fpYesterday - a.fpYesterday).map((g, i) => [g.id, i + 1])
  );
  const todayRank = new Map(
    [...ghosts].sort((a, b) => b.fp - a.fp).map((g, i) => [g.id, i + 1])
  );
  return ghosts.map((g) => ({
    ...g,
    // Relative churn among ghosts → believable ↑/↓ arrows post-merge.
    ghostRankDelta: yesterdayRank.get(g.id) - todayRank.get(g.id)
  }));
};

export const GHOST_COUNT = GHOSTS.length;

/** Name pool reused by the live ticker. */
export const GHOST_HANDLES = GHOSTS.map(([name, country]) => ({ name, country }));

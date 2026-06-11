/**
 * The heartbeat of the stadium: a fake-but-believable live activity feed,
 * an online-now counter with a daypart curve, and the real tournament
 * calendar so copy can say "Group Stage · Day 3" instead of feeling static.
 */
import seedrandom from 'seedrandom';
import { GHOST_HANDLES } from './ghostPlayers';
import { getFlagForCountry } from './countries';
import { STICKERS } from './stickers';

// ——— Tournament calendar (World Cup 2026: Jun 11 – Jul 19) ———

const PHASES = [
  { from: '2026-06-11', to: '2026-06-27', name: 'Group Stage', icon: '🌍' },
  { from: '2026-06-28', to: '2026-07-03', name: 'Round of 32', icon: '⚔️' },
  { from: '2026-07-04', to: '2026-07-08', name: 'Round of 16', icon: '🔥' },
  { from: '2026-07-09', to: '2026-07-12', name: 'Quarter-Finals', icon: '💎' },
  { from: '2026-07-13', to: '2026-07-16', name: 'Semi-Finals', icon: '🌟' },
  { from: '2026-07-17', to: '2026-07-18', name: 'Third Place', icon: '🥉' },
  { from: '2026-07-19', to: '2026-07-19', name: 'THE FINAL', icon: '🏆' }
];

export const getTournamentStatus = (dateStr) => {
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  const start = Date.parse('2026-06-11T00:00:00Z');
  const end = Date.parse('2026-07-19T00:00:00Z');
  if (t < start) {
    const days = Math.ceil((start - t) / 86400000);
    return { live: false, label: `Kickoff in ${days} day${days === 1 ? '' : 's'}`, icon: '⏳', day: 0 };
  }
  if (t > end) return { live: false, label: 'Champions crowned — see you in 2030', icon: '🏆', day: 39 };
  const day = Math.floor((t - start) / 86400000) + 1;
  const phase = PHASES.find((p) => t >= Date.parse(`${p.from}T00:00:00Z`) && t <= Date.parse(`${p.to}T00:00:00Z`)) || PHASES[0];
  return { live: true, label: `${phase.name} · Day ${day}`, icon: phase.icon, day };
};

// ——— Online-now counter ———

/**
 * Believable concurrent-fans number: a daypart sine curve (quiet ~04:00 UTC,
 * peak around the evening matches), plus per-minute seeded jitter so it
 * twitches without jumping wildly between renders.
 */
export const getOnlineCount = (now = new Date()) => {
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const curve = Math.sin(((hour - 4 + 24) % 24) / 24 * Math.PI); // 0 at 4am, 1 at 4pm
  const base = 900 + Math.round(3400 * Math.pow(Math.max(curve, 0.05), 1.3));
  const minuteSeed = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
  const jitter = Math.round((seedrandom(`online:${minuteSeed}`)() - 0.5) * base * 0.12);
  return base + jitter;
};

// ——— Activity ticker ———

const FIXTURES_26 = [
  'MEX vs RSA', 'USA vs PAR', 'CAN vs QAT', 'BRA vs MAR', 'ARG vs ALG',
  'FRA vs SEN', 'GER vs CUW', 'ESP vs CPV', 'ENG vs HAI', 'POR vs UZB',
  'NED vs JOR', 'JPN vs TUN', 'KOR vs EGY', 'NOR vs CIV', 'CRO vs SCO'
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomFan = () => {
  const fan = pick(GHOST_HANDLES);
  return { name: fan.name, flag: getFlagForCountry(fan.country) };
};

/** One fresh fake event. Variety is the illusion of life. */
export const makeTickerEvent = () => {
  const fan = randomFan();
  const legendaries = STICKERS.filter((s) => s.rarity === 'legendary');
  const epics = STICKERS.filter((s) => s.rarity === 'epic');
  const templates = [
    () => `${fan.flag} ${fan.name} just went 10/10 — PERFECT MATCH!`,
    () => `${fan.flag} ${fan.name} scored ${pick(['9/10', '8/10'])} — what a performance!`,
    () => `${fan.flag} ${fan.name} ripped a ${pick(legendaries).name} ✨ LEGENDARY pull!`,
    () => `${fan.flag} ${fan.name} pulled ${pick(epics).name} from a Gold Pack`,
    () => `🔥 ${fan.name} is on a ${7 + Math.floor(Math.random() * 19)}-day streak`,
    () => `💰 ${fan.flag} ${fan.name} won +${(2 + Math.floor(Math.random() * 9)) * 50} FP on ${pick(FIXTURES_26)}`,
    () => `${fan.flag} ${fan.name} just joined Captain's Club ⭐`,
    () => `🧤 ${fan.name} hit a ${pick([7, 8, 9])}-answer streak — ON FIRE`,
    () => `${fan.flag} ${fan.name} joined the Cup — ¡olé!`,
    () => `📈 ${fan.name} climbed ${2 + Math.floor(Math.random() * 14)} places on the leaderboard`,
    () => `🃏 ${fan.flag} ${fan.name} used a Golden Wildcard on ${pick(legendaries).name}`,
    () => `🛡️ ${fan.name}'s Streak Shield just saved a ${10 + Math.floor(Math.random() * 20)}-day streak`
  ];
  return pick(templates)();
};

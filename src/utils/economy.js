/**
 * The CupCoins economy — pricing, bundles, store items and VIP perks.
 *
 * Design intent (free-to-play classics, applied honestly):
 *  - CupCoins are the premium currency. FP stays the skill/leaderboard currency.
 *  - Free players get a slow coin drip (daily match, album page rewards) so
 *    they learn what coins buy — taste, never feast.
 *  - First purchase of each bundle is doubled (the strongest conversion lever).
 *  - One bundle is anchored "Most Popular", one "Best Value".
 *  - A Daily Deal rotates every UTC midnight with a countdown — FOMO that
 *    resets exactly when the next quiz drops, stacking the comeback hooks.
 */
import seedrandom from 'seedrandom';

export const COIN_BUNDLES = [
  { id: 'starter', name: 'Starter Bag', coins: 500, price: 4.99, icon: '🪙', tag: null },
  { id: 'fan', name: 'Fan Stash', coins: 1200, price: 9.99, icon: '💰', tag: 'MOST POPULAR' },
  { id: 'pro', name: 'Pro Vault', coins: 2600, price: 19.99, icon: '🧰', tag: 'BEST VALUE' },
  { id: 'legend', name: 'Legend Chest', coins: 7000, price: 49.99, icon: '👑', tag: 'VIP TREATMENT' }
];

export const FIRST_BUY_MULTIPLIER = 2;

// Items purchasable with CupCoins. `field` is the user-doc counter they fill.
export const STORE_ITEMS = [
  {
    id: 'var',
    name: 'VAR Token',
    icon: '📺',
    coins: 150,
    field: 'varTokens',
    blurb: 'Overturn one wrong answer per Daily Match. The ref is on your side.'
  },
  {
    id: 'shield',
    name: 'Streak Shield',
    icon: '🛡️',
    coins: 200,
    field: 'streakFreezes',
    blurb: 'Miss a day, keep your streak. Consumed automatically.'
  },
  {
    id: 'hint',
    name: 'Scouting Report',
    icon: '💡',
    coins: 150,
    field: 'hints',
    blurb: 'Remove one incorrect answer from the options.'
  },
  {
    id: 'extra_time',
    name: 'Extra Time',
    icon: '⏱️',
    coins: 150,
    field: 'extraTime',
    blurb: 'Add 10 seconds to the timer when you need more time to think.'
  },
  {
    id: 'free_kick',
    name: 'Free Kick',
    icon: '⚡',
    coins: 300,
    field: 'freeKicks',
    blurb: 'Automatically blast the correct answer into the net without guessing.'
  }
];

export const STORE_ITEMS_BY_ID = Object.fromEntries(STORE_ITEMS.map((i) => [i.id, i]));

// ——— Captain's Club (season VIP) ———

export const VIP = {
  priceCoins: 1500,
  fpMultiplier: 1.5, // applied to positive daily-match FP only
  dupeMultiplier: 2, // duplicate stickers convert at double FP
  perks: [
    '💡 A daily care package: 1 Scout, 1 Extra Time, 1 Free Kick',
    '⚡ +50% Football Points on every winning Daily Match',
    '💱 Duplicates convert to FP at 2× value',
    '⭐ Gold name + star on the global leaderboard',
    "🎖️ Exclusive Captain's Club badge"
  ]
};

export const applyVipFp = (fpChange, isVip) =>
  isVip && fpChange > 0 ? Math.round(fpChange * VIP.fpMultiplier) : fpChange;

// ——— Free coin drip ———

export const DAILY_MATCH_COINS = 25;
export const WELCOME_COINS = 100; // new accounts start with a taste of premium

// ——— Daily Deal ———

const DEAL_POOL = ['var', 'shield', 'hint', 'extra_time', 'free_kick'];
export const DEAL_DISCOUNT = 0.4;

/** Deterministic per-UTC-day deal: same for every player, rotates at midnight. */
export const getDailyDeal = (dateStr) => {
  const rng = seedrandom(`deal:${dateStr}`);
  const item = STORE_ITEMS_BY_ID[DEAL_POOL[Math.floor(rng() * DEAL_POOL.length)]];
  const dealCoins = Math.max(1, Math.round((item.coins * (1 - DEAL_DISCOUNT)) / 5) * 5);
  return { item, dealCoins, percentOff: Math.round(DEAL_DISCOUNT * 100) };
};

/** Milliseconds until the next UTC midnight (deal + quiz + VIP claim reset). */
export const msUntilUtcMidnight = () => {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
};

export const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

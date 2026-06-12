/**
 * Mutations for the CupCoins economy. Every function validates against the
 * passed-in userData, writes the user's own doc (allowed by firestore.rules),
 * and returns a partial user object for the caller to merge into local state.
 *
 * NOTE: like FP scoring, this is client-trusted by design for now — the
 * README's "known limitations" hardening path (move writes into Cloud
 * Functions) applies here too. Real-money crediting already has a server
 * path: see `stripeWebhook` in functions/index.js.
 */
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { rollPack, PACK_FIELDS, albumProgress, PAGE_REWARD_COINS, STICKERS_BY_ID, PACKS, RARITIES } from './stickers';
import { STORE_ITEMS_BY_ID, FIRST_BUY_MULTIPLIER, VIP } from './economy';
import { TIERS, BADGES } from './achievements';
import { getTodayUTCString } from './dailySeed';

const write = async (uid, partial) => {
  if (db && uid) await updateDoc(doc(db, 'users', uid), partial);
  return partial;
};

/** Badges granted by economy events, deduped against what's already owned. */
const collectionBadges = (userData, stickersAfter) => {
  const owned = new Set([...(userData.badges || [])]);
  const progress = albumProgress(stickersAfter);
  const earned = [];
  const grant = (id) => { if (!owned.has(id)) { owned.add(id); earned.push(id); } };
  grant('first_pack');
  if (progress.legendariesOwned >= 3) grant('shiny_hunter');
  if (progress.complete) grant('the_collector');
  return earned;
};

/** Credit a coin bundle (sandbox checkout or post-Stripe). First buy = 2×. */
export const purchaseCoins = async (uid, userData, bundle) => {
  const already = userData.purchasedBundles || [];
  const firstBuy = !already.includes(bundle.id);
  const credited = bundle.coins * (firstBuy ? FIRST_BUY_MULTIPLIER : 1);
  const partial = {
    coins: (userData.coins || 0) + credited,
    purchasedBundles: firstBuy ? [...already, bundle.id] : already
  };
  await write(uid, partial);
  return { ...partial, credited, firstBuy };
};

/** Spend coins on a store item (optionally at the Daily Deal price). */
export const purchaseItem = async (uid, userData, itemId, priceOverride = null, isDailyDeal = false) => {
  const item = STORE_ITEMS_BY_ID[itemId];
  if (!item) throw new Error('Unknown item.');
  const cost = priceOverride ?? item.coins;
  const coins = userData.coins || 0;
  if (coins < cost) throw new Error('Not enough CupCoins.');
  const partial = {
    coins: coins - cost,
    [item.field]: (userData[item.field] || 0) + 1
  };
  if (isDailyDeal) {
    partial.dailyDealBoughtDate = getTodayUTCString();
  }
  await write(uid, partial);
  return partial;
};

/** Join the Captain's Club (season VIP). */
export const purchaseVip = async (uid, userData) => {
  if (userData.vip) throw new Error("You're already in the Captain's Club.");
  const coins = userData.coins || 0;
  if (coins < VIP.priceCoins) throw new Error('Not enough CupCoins.');
  const badges = userData.badges || [];
  const partial = {
    coins: coins - VIP.priceCoins,
    vip: true,
    vipSince: getTodayUTCString(),
    badges: badges.includes('captains_club') ? badges : [...badges, 'captains_club']
  };
  await write(uid, partial);
  return partial;
};

/** Buy any pack with either FP or CupCoins. */
export const purchasePack = async (uid, userData, packId, currencyType = 'coins') => {
  const pack = PACKS[packId];
  if (!pack) throw new Error('Unknown pack.');
  
  const field = PACK_FIELDS[packId];
  const partial = {};

  if (currencyType === 'fp') {
    const cost = pack.costFP;
    const fp = userData.fp || 0;
    if (fp < cost) throw new Error(`You need ${cost} FP for a ${pack.name}.`);
    partial.fp = fp - cost;
  } else {
    const cost = pack.costCoins;
    const coins = userData.coins || 0;
    if (coins < cost) throw new Error(`You need ${cost} CupCoins for a ${pack.name}.`);
    partial.coins = coins - cost;
  }

  partial[field] = (userData[field] || 0) + 1;
  await write(uid, partial);
  return partial;
};

/**
 * Open one owned pack: rolls contents, consumes the pack, converts dupes to
 * FP (VIP 2×), advances the pity counter and unlocks collection badges.
 * Returns { result, partial } — result feeds the opening ceremony.
 */
export const openOwnedPack = async (uid, userData, packId) => {
  const field = PACK_FIELDS[packId];
  const ownedPacks = userData[field] || 0;
  if (ownedPacks < 1) throw new Error('No packs of that type to open.');

  const result = rollPack(packId, userData.stickers || {}, userData.packsSinceLegendary || 0);

  const stickers = { ...(userData.stickers || {}) };
  for (const s of result.stickers) stickers[s.id] = (stickers[s.id] || 0) + 1;

  const newBadges = collectionBadges(userData, stickers);
  const partial = {
    [field]: ownedPacks - 1,
    stickers,
    packsSinceLegendary: result.newPity,
    ...(newBadges.length > 0 ? { badges: [...(userData.badges || []), ...newBadges] } : {})
  };
  await write(uid, partial);
  return { result: { ...result, newBadges }, partial };
};

export const sellDuplicateSticker = async (uid, userData, stickerId) => {
  const count = userData.stickers?.[stickerId] || 0;
  if (count <= 1) throw new Error('No duplicate to sell.');
  
  const sticker = STICKERS_BY_ID[stickerId];
  const rarity = RARITIES[sticker.rarity];
  const coinsEarned = rarity.dupeCP;
  
  const partial = {
    coins: (userData.coins || 0) + coinsEarned,
    stickers: { ...userData.stickers, [stickerId]: count - 1 }
  };
  await write(uid, partial);
  return partial;
};

/** Captain's Club daily care package — one claim per UTC day. */
export const claimVipDailyPack = async (uid, userData) => {
  if (!userData.vip) throw new Error('Captain’s Club members only.');
  const today = getTodayUTCString();
  if (userData.vipClaimedDate === today) throw new Error('Already claimed today — come back tomorrow!');
  const partial = { 
    vipClaimedDate: today, 
    hints: (userData.hints || 0) + 1,
    extraTime: (userData.extraTime || 0) + 1,
    freeKicks: (userData.freeKicks || 0) + 1
  };
  await write(uid, partial);
  return partial;
};

/** Album page completion reward (claim-once per page). */
export const claimPageReward = async (uid, userData, pageId) => {
  const claimed = userData.claimedPages || [];
  if (claimed.includes(pageId)) throw new Error('Already claimed.');
  const progress = albumProgress(userData.stickers || {});
  if (!progress.byPage[pageId]?.complete) throw new Error('Page not complete yet.');
  const badges = userData.badges || [];
  const partial = {
    coins: (userData.coins || 0) + PAGE_REWARD_COINS,
    claimedPages: [...claimed, pageId],
    badges: badges.includes('page_turner') ? badges : [...badges, 'page_turner']
  };
  await write(uid, partial);
  return partial;
};

/** Burn one VAR token (called the moment the overturn is accepted). */
export const consumeVarToken = async (uid, userData) => {
  const tokens = userData.varTokens || 0;
  if (tokens < 1) throw new Error('No VAR tokens.');
  const partial = { varTokens: tokens - 1 };
  await write(uid, partial);
  return partial;
};

/** Consume a generic gameplay item. */
export const consumeConsumable = async (uid, userData, field) => {
  const current = userData[field] || 0;
  if (current < 1) throw new Error(`Not enough ${field}.`);
  const partial = { [field]: current - 1 };
  await write(uid, partial);
  return partial;
};

export const claimBadgeReward = async (uid, userData, badgeId) => {
  const claimed = userData.claimedBadges || [];
  if (claimed.includes(badgeId)) throw new Error('Reward already claimed.');

  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) throw new Error('Badge not found.');

  const tier = TIERS[badge.tier];
  const reward = tier?.rewardCP || 0;

  const partial = {
    coins: (userData.coins || 0) + reward,
    claimedBadges: [...claimed, badgeId]
  };
  return write(uid, partial);
};

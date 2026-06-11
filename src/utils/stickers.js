/**
 * The Legends Album — World Cupple's collection metagame.
 *
 * 64 stickers across 6 themed pages. Packs are the daily dopamine loop:
 * every completed Daily Match earns a free Bronze Pack, premium packs are
 * bought with CupCoins, and duplicates auto-convert to FP. A pity counter
 * guarantees a Legendary at most every PITY_THRESHOLD packs.
 *
 * Everything here is pure data + pure functions (rolls take Math.random
 * injection-free; results are persisted by economyService).
 */

export const RARITIES = {
  common: {
    id: 'common',
    label: 'Common',
    dupeCP: 5,
    text: 'text-gray-300',
    frame: 'border-white/20 bg-gradient-to-b from-white/10 to-white/[0.03]',
    glow: '',
    order: 0
  },
  rare: {
    id: 'rare',
    label: 'Rare',
    dupeCP: 15,
    text: 'text-sky-300',
    frame: 'border-sky-400/50 bg-gradient-to-b from-sky-500/20 to-sky-900/10',
    glow: 'shadow-[0_0_14px_rgba(56,189,248,0.25)]',
    order: 1
  },
  epic: {
    id: 'epic',
    label: 'Epic',
    dupeCP: 40,
    text: 'text-fuchsia-300',
    frame: 'border-fuchsia-400/60 bg-gradient-to-b from-fuchsia-500/25 to-purple-900/20',
    glow: 'shadow-[0_0_18px_rgba(217,70,239,0.35)]',
    order: 2
  },
  legendary: {
    id: 'legendary',
    label: 'Legendary',
    dupeCP: 100,
    text: 'text-yellow-300',
    frame: 'border-yellow-400/80 foil-legendary',
    glow: 'shadow-[0_0_24px_rgba(250,204,21,0.45)]',
    order: 3
  }
};

export const PAGES = [
  { id: 'legends', name: 'The Immortals', icon: '👑', blurb: 'The kings who built the game.' },
  { id: 'boots', name: 'Golden Boots', icon: '🥇', blurb: 'The deadliest finishers in Cup history.' },
  { id: 'gloves', name: 'The Guardians', icon: '🧤', blurb: 'Walls, cats and miracle hands.' },
  { id: 'moments', name: 'Iconic Moments', icon: '📸', blurb: 'Seconds that became forever.' },
  { id: 'class26', name: "Class of '26", icon: '⚡', blurb: 'The stars of this summer.' },
  { id: 'temples', name: 'Temples & Trophies', icon: '🏟️', blurb: 'Where legends are crowned.' }
];

// id, page, name, sub (era line), flag, icon (portrait emoji), rarity, flavor
export const STICKERS = [
  // ——— THE IMMORTALS (12) ———
  { id: 'leg_pele', page: 'legends', name: 'Pelé', sub: 'O Rei • 1958–70', flag: '🇧🇷', icon: '👑', rarity: 'legendary', flavor: 'Three World Cups. No one else has even two as a player.' },
  { id: 'leg_maradona', page: 'legends', name: 'Maradona', sub: 'D10S • 1986', flag: '🇦🇷', icon: '🐐', rarity: 'legendary', flavor: 'Carried a nation on his left foot in Mexico ’86.' },
  { id: 'leg_cruyff', page: 'legends', name: 'Johan Cruyff', sub: 'Total Football • 1974', flag: '🇳🇱', icon: '🌀', rarity: 'epic', flavor: 'Turned defenders inside out — then named the move.' },
  { id: 'leg_beckenbauer', page: 'legends', name: 'Beckenbauer', sub: 'Der Kaiser • 1974', flag: '🇩🇪', icon: '🎩', rarity: 'epic', flavor: 'Won it as captain, then again as coach.' },
  { id: 'leg_zidane', page: 'legends', name: 'Zinedine Zidane', sub: 'Zizou • 1998–2006', flag: '🇫🇷', icon: '🎻', rarity: 'epic', flavor: 'Two headers in a final. Poetry with a violent ending.' },
  { id: 'leg_r9', page: 'legends', name: 'Ronaldo Nazário', sub: 'O Fenômeno • 2002', flag: '🇧🇷', icon: '🦷', rarity: 'epic', flavor: 'Redemption in Yokohama, eight goals and that haircut.' },
  { id: 'leg_ronaldinho', page: 'legends', name: 'Ronaldinho', sub: 'Joga Bonito • 2002', flag: '🇧🇷', icon: '🕺', rarity: 'rare', flavor: 'Smiled his way through entire defences.' },
  { id: 'leg_platini', page: 'legends', name: 'Michel Platini', sub: 'Le Roi • 1982–86', flag: '🇫🇷', icon: '🎨', rarity: 'rare', flavor: 'Midfield royalty of the golden carré magique.' },
  { id: 'leg_eusebio', page: 'legends', name: 'Eusébio', sub: 'Black Panther • 1966', flag: '🇵🇹', icon: '🐆', rarity: 'rare', flavor: 'Nine goals in ’66 and tears at Wembley.' },
  { id: 'leg_garrincha', page: 'legends', name: 'Garrincha', sub: 'Alegria do Povo • 1962', flag: '🇧🇷', icon: '🐦', rarity: 'rare', flavor: 'Bent legs, straight to the title in ’62.' },
  { id: 'leg_distefano', page: 'legends', name: 'Di Stéfano', sub: 'Saeta Rubia • 1947–66', flag: '🇦🇷', icon: '⚙️', rarity: 'common', flavor: 'The greatest who never played a World Cup.' },
  { id: 'leg_baggio', page: 'legends', name: 'Roberto Baggio', sub: 'Il Divin Codino • 1994', flag: '🇮🇹', icon: '🎭', rarity: 'common', flavor: 'Dragged Italy to the final. Forgave himself eventually.' },

  // ——— GOLDEN BOOTS (10) ———
  { id: 'boot_klose', page: 'boots', name: 'Miroslav Klose', sub: '16 WC goals • 2002–14', flag: '🇩🇪', icon: '🎯', rarity: 'epic', flavor: 'The all-time World Cup top scorer. Front-flip included.' },
  { id: 'boot_fontaine', page: 'boots', name: 'Just Fontaine', sub: '13 goals in 1958', flag: '🇫🇷', icon: '💥', rarity: 'epic', flavor: 'Thirteen goals in one tournament. Untouchable record.' },
  { id: 'boot_muller', page: 'boots', name: 'Gerd Müller', sub: 'Der Bomber • 1970–74', flag: '🇩🇪', icon: '💣', rarity: 'rare', flavor: 'If it bounced in the box, it was already in.' },
  { id: 'boot_romario', page: 'boots', name: 'Romário', sub: 'Baixinho • 1994', flag: '🇧🇷', icon: '🦊', rarity: 'rare', flavor: 'Toe-pokes from the penalty spot to the trophy.' },
  { id: 'boot_stoichkov', page: 'boots', name: 'Hristo Stoichkov', sub: '6 goals • 1994', flag: '🇧🇬', icon: '🗡️', rarity: 'rare', flavor: 'Dragged Bulgaria to a semi-final, scowling throughout.' },
  { id: 'boot_schillaci', page: 'boots', name: 'Totò Schillaci', sub: 'Notti Magiche • 1990', flag: '🇮🇹', icon: '👀', rarity: 'common', flavor: 'Those wide eyes lit up Italian nights.' },
  { id: 'boot_suker', page: 'boots', name: 'Davor Šuker', sub: '6 goals • 1998', flag: '🇭🇷', icon: '🧨', rarity: 'common', flavor: 'A left foot that deserved its own passport.' },
  { id: 'boot_james', page: 'boots', name: 'James Rodríguez', sub: '6 goals • 2014', flag: '🇨🇴', icon: '🚀', rarity: 'common', flavor: 'That chest-and-volley against Uruguay. Goosebumps.' },
  { id: 'boot_kane', page: 'boots', name: 'Harry Kane', sub: '6 goals • 2018', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', icon: '🎰', rarity: 'common', flavor: 'Penalties count too. All of them.' },
  { id: 'boot_mbappe22', page: 'boots', name: 'Kylian Mbappé', sub: 'Final hat-trick • 2022', flag: '🇫🇷', icon: '⚡', rarity: 'rare', flavor: 'A hat-trick in a World Cup final — and still lost.' },

  // ——— THE GUARDIANS (8) ———
  { id: 'glove_yashin', page: 'gloves', name: 'Lev Yashin', sub: 'Black Spider • 1958–70', flag: '🕷️', icon: '🕸️', rarity: 'epic', flavor: 'The only keeper to win the Ballon d’Or.' },
  { id: 'glove_banks', page: 'gloves', name: 'Gordon Banks', sub: 'England • 1966–70', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', icon: '🧱', rarity: 'rare', flavor: 'Ask Pelé about Guadalajara, 1970.' },
  { id: 'glove_buffon', page: 'gloves', name: 'Gianluigi Buffon', sub: 'Italia • 2006', flag: '🇮🇹', icon: '🛡️', rarity: 'rare', flavor: 'Two goals conceded all tournament. One was an own goal.' },
  { id: 'glove_casillas', page: 'gloves', name: 'Iker Casillas', sub: 'San Iker • 2010', flag: '🇪🇸', icon: '😇', rarity: 'rare', flavor: 'That toe vs Robben kept the World Cup Spanish.' },
  { id: 'glove_neuer', page: 'gloves', name: 'Manuel Neuer', sub: 'Sweeper-Keeper • 2014', flag: '🇩🇪', icon: '🧹', rarity: 'common', flavor: 'Played keeper and libero simultaneously in Brazil.' },
  { id: 'glove_zoff', page: 'gloves', name: 'Dino Zoff', sub: 'Capitano • 1982', flag: '🇮🇹', icon: '🗿', rarity: 'common', flavor: 'Lifted the Cup at 40 years old. Aged like marble.' },
  { id: 'glove_schmeichel', page: 'gloves', name: 'Peter Schmeichel', sub: 'The Great Dane • 1998', flag: '🇩🇰', icon: '🐻', rarity: 'common', flavor: 'Star jumps that blocked out the sun.' },
  { id: 'glove_martinez', page: 'gloves', name: 'Emi Martínez', sub: 'Dibu • 2022', flag: '🇦🇷', icon: '🧤', rarity: 'common', flavor: 'That last-minute save from Kolo Muani. Breathe.' },

  // ——— ICONIC MOMENTS (12) ———
  { id: 'mom_hand', page: 'moments', name: 'Hand of God', sub: 'Mexico City • 1986', flag: '🇦🇷', icon: '✋', rarity: 'legendary', flavor: '“A little with the head of Maradona…”' },
  { id: 'mom_century', page: 'moments', name: 'Goal of the Century', sub: '4 minutes later • 1986', flag: '🇦🇷', icon: '🌪️', rarity: 'epic', flavor: 'Sixty metres, six Englishmen, one immortal slalom.' },
  { id: 'mom_cruyffturn', page: 'moments', name: 'The Cruyff Turn', sub: 'vs Sweden • 1974', flag: '🇳🇱', icon: '🔄', rarity: 'rare', flavor: 'Jan Olsson is still buying a ticket back.' },
  { id: 'mom_headbutt', page: 'moments', name: 'The Headbutt', sub: 'Berlin Final • 2006', flag: '🇫🇷', icon: '🤯', rarity: 'rare', flavor: 'Zidane’s last touch was Materazzi’s chest.' },
  { id: 'mom_mineirazo', page: 'moments', name: 'The 7–1', sub: 'Belo Horizonte • 2014', flag: '🇩🇪', icon: '😱', rarity: 'rare', flavor: 'Five goals in 18 minutes. Brazil still doesn’t talk about it.' },
  { id: 'mom_bern', page: 'moments', name: 'Miracle of Bern', sub: 'Final • 1954', flag: '🇩🇪', icon: '🌧️', rarity: 'rare', flavor: 'Rain, Fritz Walter weather, and the great upset.' },
  { id: 'mom_maracanazo', page: 'moments', name: 'Maracanazo', sub: 'Rio • 1950', flag: '🇺🇾', icon: '🤫', rarity: 'rare', flavor: 'Ghiggia silenced 200,000 people with one shot.' },
  { id: 'mom_iniesta', page: 'moments', name: "Iniesta 116'", sub: 'Johannesburg • 2010', flag: '🇪🇸', icon: '⏱️', rarity: 'rare', flavor: 'The pale knight wins Spain its first star.' },
  { id: 'mom_gotze', page: 'moments', name: "Götze 113'", sub: 'Maracanã • 2014', flag: '🇩🇪', icon: '🎯', rarity: 'common', flavor: '“Show the world you are better than Messi.” He did, once.' },
  { id: 'mom_bankssave', page: 'moments', name: 'The Save', sub: 'Banks vs Pelé • 1970', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', icon: '🦸', rarity: 'common', flavor: 'Physics filed a formal complaint.' },
  { id: 'mom_bergkamp', page: 'moments', name: "Bergkamp's Touch", sub: 'vs Argentina • 1998', flag: '🇳🇱', icon: '🪶', rarity: 'common', flavor: 'Three touches: control, beat, finish. 89th minute.' },
  { id: 'mom_messi22', page: 'moments', name: 'Messi Lifts It', sub: 'Lusail • 2022', flag: '🇦🇷', icon: '🏆', rarity: 'legendary', flavor: 'The bisht, the trophy, the ending the story demanded.' },

  // ——— CLASS OF '26 (14) ———
  { id: 'c26_mbappe', page: 'class26', name: 'Kylian Mbappé', sub: 'France • Forward', flag: '🇫🇷', icon: '🐢', rarity: 'legendary', flavor: 'Chasing the one medal his cabinet is missing… again.' },
  { id: 'c26_bellingham', page: 'class26', name: 'Jude Bellingham', sub: 'England • Midfield', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', icon: '🦁', rarity: 'epic', flavor: 'Hey Jude, don’t make it bad — bring it home.' },
  { id: 'c26_vini', page: 'class26', name: 'Vinícius Jr', sub: 'Brazil • Winger', flag: '🇧🇷', icon: '💃', rarity: 'epic', flavor: 'Dances first, asks questions never.' },
  { id: 'c26_haaland', page: 'class26', name: 'Erling Haaland', sub: 'Norway • Striker', flag: '🇳🇴', icon: '🤖', rarity: 'epic', flavor: 'Norway’s first World Cup since ’98. The robot is hungry.' },
  { id: 'c26_yamal', page: 'class26', name: 'Lamine Yamal', sub: 'Spain • Winger', flag: '🇪🇸', icon: '🧒', rarity: 'epic', flavor: 'Older than the last World Cup. Barely.' },
  { id: 'c26_musiala', page: 'class26', name: 'Jamal Musiala', sub: 'Germany • Midfield', flag: '🇩🇪', icon: '🪄', rarity: 'rare', flavor: 'Bambi on espresso, defenders on skates.' },
  { id: 'c26_wirtz', page: 'class26', name: 'Florian Wirtz', sub: 'Germany • Playmaker', flag: '🇩🇪', icon: '🧠', rarity: 'rare', flavor: 'Sees passes that haven’t been invented yet.' },
  { id: 'c26_pedri', page: 'class26', name: 'Pedri', sub: 'Spain • Midfield', flag: '🇪🇸', icon: '🎼', rarity: 'rare', flavor: 'Conducts midfield like it owes him money.' },
  { id: 'c26_valverde', page: 'class26', name: 'Fede Valverde', sub: 'Uruguay • Midfield', flag: '🇺🇾', icon: '🔨', rarity: 'rare', flavor: 'El Pajarito hits shots that need a permit.' },
  { id: 'c26_saka', page: 'class26', name: 'Bukayo Saka', sub: 'England • Winger', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', icon: '⭐', rarity: 'common', flavor: 'Starboy, redemption arc fully loaded.' },
  { id: 'c26_pulisic', page: 'class26', name: 'Christian Pulisic', sub: 'USA • Captain America', flag: '🇺🇸', icon: '🦅', rarity: 'common', flavor: 'A home World Cup and a nation learning to scream “GOLAZO”.' },
  { id: 'c26_son', page: 'class26', name: 'Son Heung-min', sub: 'South Korea • Forward', flag: '🇰🇷', icon: '📸', rarity: 'common', flavor: 'One last dance for the nicest assassin in football.' },
  { id: 'c26_endrick', page: 'class26', name: 'Endrick', sub: 'Brazil • Striker', flag: '🇧🇷', icon: '🌱', rarity: 'common', flavor: 'The next R9? No pressure, kid.' },
  { id: 'c26_olise', page: 'class26', name: 'Michael Olise', sub: 'France • Winger', flag: '🇫🇷', icon: '🎮', rarity: 'common', flavor: 'Plays like the game is set to “beginner”.' },

  // ——— TEMPLES & TROPHIES (8) ———
  { id: 'tmp_trophy', page: 'temples', name: 'The World Cup', sub: '6.1 kg of forever', flag: '🌍', icon: '🏆', rarity: 'legendary', flavor: 'Solid gold. You can’t even keep it — you just borrow glory.' },
  { id: 'tmp_rimet', page: 'temples', name: 'Jules Rimet Trophy', sub: '1930–1970', flag: '🇫🇷', icon: '🗝️', rarity: 'epic', flavor: 'Stolen twice, found once by a dog named Pickles.' },
  { id: 'tmp_maracana', page: 'temples', name: 'Maracanã', sub: 'Rio de Janeiro', flag: '🇧🇷', icon: '🏟️', rarity: 'rare', flavor: 'Two finals, two heartbreaks, one cathedral.' },
  { id: 'tmp_azteca', page: 'temples', name: 'Estadio Azteca', sub: 'Opening match • 2026', flag: '🇲🇽', icon: '🌋', rarity: 'rare', flavor: 'The only stadium to host three World Cups. It starts here.' },
  { id: 'tmp_metlife', page: 'temples', name: 'New York Final', sub: 'July 19, 2026', flag: '🇺🇸', icon: '🗽', rarity: 'rare', flavor: 'Eighty thousand seats. One ending.' },
  { id: 'tmp_wembley', page: 'temples', name: 'Wembley 1966', sub: 'They think it’s all over', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', icon: '👑', rarity: 'common', flavor: 'It is now.' },
  { id: 'tmp_lusail', page: 'temples', name: 'Lusail 2022', sub: 'The greatest final', flag: '🇶🇦', icon: '✨', rarity: 'common', flavor: '3–3, Mbappé hat-trick, Messi coronation. Cinema.' },
  { id: 'tmp_telstar', page: 'temples', name: 'The Telstar', sub: 'The original ball • 1970', flag: '⚽', icon: '⚽', rarity: 'common', flavor: '32 panels that taught the world what a football looks like.' }
];

export const STICKERS_BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));
export const TOTAL_STICKERS = STICKERS.length;

// ——— Packs ———

export const PITY_THRESHOLD = 10; // packs without a legendary before one is forced

export const PACKS = {
  bronze: {
    id: 'bronze',
    name: 'Bronze Pack',
    icon: '📦',
    size: 3,
    costFP: 50,
    costCoins: 15,
    gradient: 'from-amber-700 to-amber-900',
    ring: 'border-amber-600/60',
    blurb: '3 stickers. Free with every Daily Match.',
    weights: { common: 70, rare: 24, epic: 5, legendary: 1 },
    guarantee: null
  },
  silver: {
    id: 'silver',
    name: 'Silver Pack',
    icon: '💿',
    size: 4,
    costFP: 150,
    costCoins: 40,
    gradient: 'from-gray-300 to-gray-500',
    ring: 'border-gray-400/70',
    blurb: '4 stickers. Better odds for Rare cards.',
    weights: { common: 55, rare: 35, epic: 8, legendary: 2 },
    guarantee: null
  },
  gold: {
    id: 'gold',
    name: 'Gold Pack',
    icon: '🥇',
    size: 4,
    costFP: 400,
    costCoins: 100,
    gradient: 'from-yellow-400 to-amber-600',
    ring: 'border-yellow-400/70',
    blurb: '4 stickers. Rare or better guaranteed.',
    weights: { common: 42, rare: 40, epic: 14, legendary: 4 },
    guarantee: 'rare'
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary Pack',
    icon: '💎',
    size: 5,
    costFP: 1000,
    costCoins: 250,
    gradient: 'from-fuchsia-500 to-amber-400',
    ring: 'border-fuchsia-400/70',
    blurb: '5 stickers. Epic guaranteed, 3× Legendary odds.',
    weights: { common: 25, rare: 40, epic: 23, legendary: 12 },
    guarantee: 'epic'
  }
};

export const PACK_FIELDS = { bronze: 'packBronze', silver: 'packSilver', gold: 'packGold', legendary: 'packLegendary' };

const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

const pickWeightedRarity = (weights, minRarity = null) => {
  const minOrder = minRarity ? RARITY_ORDER.indexOf(minRarity) : 0;
  const eligible = RARITY_ORDER.slice(minOrder).filter((r) => (weights[r] || 0) > 0);
  const total = eligible.reduce((sum, r) => sum + weights[r], 0);
  let roll = Math.random() * total;
  for (const r of eligible) {
    roll -= weights[r];
    if (roll <= 0) return r;
  }
  return eligible[eligible.length - 1];
};

const pickStickerOfRarity = (rarity, alreadyRolled, ownedMap) => {
  const pool = STICKERS.filter((s) => s.rarity === rarity);
  // Prefer stickers the player doesn't own yet and hasn't pulled this pack —
  // keeps the album moving without ever making completion automatic.
  const fresh = pool.filter((s) => !alreadyRolled.has(s.id) && !(ownedMap[s.id] > 0));
  const unrolled = pool.filter((s) => !alreadyRolled.has(s.id));
  const candidates = (Math.random() < 0.65 && fresh.length > 0)
    ? fresh
    : (unrolled.length > 0 ? unrolled : pool);
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * Roll the contents of a pack.
 * Returns { stickers: [{...sticker, isNew}], legendaryHit, newPity }
 */
export const rollPack = (packId, ownedMap = {}, packsSinceLegendary = 0) => {
  const pack = PACKS[packId];
  const rolled = new Set();
  const results = [];

  const rarities = [];
  for (let i = 0; i < pack.size; i++) {
    rarities.push(pickWeightedRarity(pack.weights, i === 0 ? pack.guarantee : null));
  }
  // Pity: force a legendary if the drought is about to hit the threshold.
  const hasLegendary = rarities.includes('legendary');
  if (!hasLegendary && packsSinceLegendary + 1 >= PITY_THRESHOLD) {
    rarities[rarities.length - 1] = 'legendary';
  }

  const counts = { ...ownedMap };
  for (const rarity of rarities) {
    const sticker = pickStickerOfRarity(rarity, rolled, counts);
    rolled.add(sticker.id);
    const isNew = !(counts[sticker.id] > 0);
    counts[sticker.id] = (counts[sticker.id] || 0) + 1;
    results.push({ ...sticker, isNew });
  }

  // Big reveals last — the ceremony builds to the best card.
  results.sort((a, b) => RARITIES[a.rarity].order - RARITIES[b.rarity].order);

  const legendaryHit = results.some((s) => s.rarity === 'legendary');
  return {
    packId,
    stickers: results,
    legendaryHit,
    newPity: legendaryHit ? 0 : packsSinceLegendary + 1
  };
};

// ——— Album helpers ———

export const PAGE_REWARD_COINS = 120;

export const albumProgress = (ownedMap = {}) => {
  const ownedIds = STICKERS.filter((s) => ownedMap[s.id] > 0);
  const byPage = {};
  for (const page of PAGES) {
    const pageStickers = STICKERS.filter((s) => s.page === page.id);
    const owned = pageStickers.filter((s) => ownedMap[s.id] > 0).length;
    byPage[page.id] = { owned, total: pageStickers.length, complete: owned === pageStickers.length };
  }
  return {
    owned: ownedIds.length,
    total: TOTAL_STICKERS,
    percent: Math.round((ownedIds.length / TOTAL_STICKERS) * 100),
    complete: ownedIds.length === TOTAL_STICKERS,
    legendariesOwned: ownedIds.filter((s) => s.rarity === 'legendary').length,
    byPage
  };
};

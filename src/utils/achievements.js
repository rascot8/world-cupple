export const TIERS = {
  BRONZE: { name: 'Bronze', color: 'from-orange-500 to-amber-700', shadow: 'shadow-orange-500/50' },
  SILVER: { name: 'Silver', color: 'from-gray-300 to-gray-500', shadow: 'shadow-gray-400/50' },
  GOLD: { name: 'Gold', color: 'from-yellow-300 to-yellow-600', shadow: 'shadow-yellow-400/50' },
  DIAMOND: { name: 'Diamond', color: 'from-cyan-300 to-blue-500', shadow: 'shadow-cyan-400/50' }
};

export const BADGES = [
  // BRONZE TIER
  { id: 'first_cap', tier: 'BRONZE', name: 'First Cap', description: 'Complete your first Daily Match.' },
  { id: 'off_the_mark', tier: 'BRONZE', name: 'Off the Mark', description: 'Get your first question correct.' },
  { id: 'hat_trick', tier: 'BRONZE', name: 'Hat Trick', description: 'Achieve a streak of 3 correct answers.' },
  { id: 'clean_sheet', tier: 'BRONZE', name: 'Clean Sheet', description: 'Get 10/10 in an Unranked Practice match.' },
  { id: 'squad_player', tier: 'BRONZE', name: 'Squad Player', description: 'Invite 1 friend via your invite link.' },
  { id: 'first_pack', tier: 'BRONZE', name: 'Pack Animal', description: 'Open your first sticker pack.' },

  // SILVER TIER
  { id: 'group_stage', tier: 'SILVER', name: 'Group Stage', description: 'Play the Daily Match for 7 consecutive days.' },
  { id: 'golden_boot', tier: 'SILVER', name: 'Golden Boot', description: 'Achieve a streak of 7 correct answers in a Daily Match.' },
  { id: 'playmaker', tier: 'SILVER', name: 'Playmaker', description: 'Invite 3 friends via your invite link.' },
  { id: 'midfield_maestro', tier: 'SILVER', name: 'Midfield Maestro', description: 'Reach the Silver Rank.' },
  { id: 'derby_winner', tier: 'SILVER', name: 'Derby Winner', description: 'Score higher than a friend on the Friends Leaderboard.' },
  { id: 'page_turner', tier: 'SILVER', name: 'Page Turner', description: 'Complete a full page of the Legends Album.' },

  // GOLD TIER
  { id: 'knockout_stage', tier: 'GOLD', name: 'Knockout Stage', description: 'Play the Daily Match for 15 consecutive days.' },
  { id: 'perfect_10', tier: 'GOLD', name: 'Perfect 10', description: 'Score exactly 10/10 in a Daily Match.' },
  { id: 'captains_armband', tier: 'GOLD', name: 'Captain\'s Armband', description: 'Reach the Gold Rank.' },
  { id: 'global_scout', tier: 'GOLD', name: 'Global Scout', description: 'Invite 5 friends via your invite link.' },
  { id: 'top_bins', tier: 'GOLD', name: 'Top Bins', description: 'Answer a question correctly in under 3 seconds.' },
  { id: 'shiny_hunter', tier: 'GOLD', name: 'Shiny Hunter', description: 'Own 3 Legendary stickers.' },
  { id: 'captains_club', tier: 'GOLD', name: "Captain's Club", description: "Join the Captain's Club." },

  // DIAMOND TIER
  { id: 'world_champion', tier: 'DIAMOND', name: 'World Champion', description: 'Reach the top "World Class" Rank.' },
  { id: 'invincible', tier: 'DIAMOND', name: 'Invincible', description: 'Play the Daily Match for 30 consecutive days.' },
  { id: 'ballon_dor', tier: 'DIAMOND', name: 'Ballon d\'Or', description: 'Reach the Top 50 on the Global Leaderboard.' },
  { id: 'golden_glove', tier: 'DIAMOND', name: 'Golden Glove', description: 'Achieve five "Perfect 10" Daily Matches.' },
  { id: 'legendary_status', tier: 'DIAMOND', name: 'Legendary Status', description: 'Accumulate 5,000 Total Football Points (FP).' },
  { id: 'the_collector', tier: 'DIAMOND', name: 'The Collector', description: 'Complete all 64 stickers in the Legends Album.' }
];

export const evaluateAchievements = (userData, matchData) => {
  const currentBadges = userData?.badges || [];
  const newlyUnlocked = [];

  const unlock = (id) => {
    if (!currentBadges.includes(id) && !newlyUnlocked.includes(id)) {
      newlyUnlocked.push(id);
    }
  };

  const {
    isDaily,
    score,
    maxStreak,
    fastAnswers, // count of answers < 3s
    rankName, // current rank name string
    globalRankIndex, // if known
    beatFriend
  } = matchData;

  const totalFP = userData?.fp || 0;
  const playStreak = userData?.playStreak || 1;
  const perfectMatchesCount = userData?.perfectMatchesCount || 0;
  const inviteCount = userData?.inviteCount || 0;

  // General Matches
  if (isDaily) unlock('first_cap');
  if (score > 0) unlock('off_the_mark');
  if (maxStreak >= 3) unlock('hat_trick');
  if (!isDaily && score === 10) unlock('clean_sheet');
  if (fastAnswers > 0) unlock('top_bins');

  // Daily specific
  if (isDaily) {
    if (playStreak >= 7) unlock('group_stage');
    if (playStreak >= 15) unlock('knockout_stage');
    if (playStreak >= 30) unlock('invincible');
    
    if (maxStreak >= 7) unlock('golden_boot');
    if (score === 10) unlock('perfect_10');
    if (perfectMatchesCount >= 5) unlock('golden_glove');
  }

  // Rank / FP based
  const rankLower = rankName?.toLowerCase() || '';
  if (rankLower.includes('silver') || rankLower.includes('gold') || rankLower.includes('world class')) {
    unlock('midfield_maestro');
  }
  if (rankLower.includes('gold') || rankLower.includes('world class')) {
    unlock('captains_armband');
  }
  if (rankLower.includes('world class')) {
    unlock('world_champion');
  }
  if (totalFP >= 5000) unlock('legendary_status');

  // Invites
  if (inviteCount >= 1) unlock('squad_player');
  if (inviteCount >= 3) unlock('playmaker');
  if (inviteCount >= 5) unlock('global_scout');

  // Leaderboard
  if (beatFriend) unlock('derby_winner');
  if (globalRankIndex !== undefined && globalRankIndex <= 50) unlock('ballon_dor');

  return newlyUnlocked;
};

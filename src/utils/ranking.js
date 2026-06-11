export const RANK_THRESHOLDS = {
  IRON: { min: 0, max: 99, name: "Iron", color: "text-gray-400" },
  BRONZE: { min: 100, max: 299, name: "Bronze", color: "text-amber-600" },
  SILVER: { min: 300, max: 599, name: "Silver", color: "text-gray-300" },
  GOLD: { min: 600, max: 999, name: "Gold", color: "text-yellow-400" },
  PLATINUM: { min: 1000, max: 1499, name: "Platinum", color: "text-cyan-400" },
  EMERALD: { min: 1500, max: 2499, name: "Emerald", color: "text-emerald-500" },
  WORLD_CLASS: { min: 2500, max: Infinity, name: "World Class", color: "text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" }
};

export const getRankForFP = (fp) => {
  const points = Math.max(0, fp); // Floor at 0
  if (points < RANK_THRESHOLDS.BRONZE.min) return RANK_THRESHOLDS.IRON;
  if (points < RANK_THRESHOLDS.SILVER.min) return RANK_THRESHOLDS.BRONZE;
  if (points < RANK_THRESHOLDS.GOLD.min) return RANK_THRESHOLDS.SILVER;
  if (points < RANK_THRESHOLDS.PLATINUM.min) return RANK_THRESHOLDS.GOLD;
  if (points < RANK_THRESHOLDS.EMERALD.min) return RANK_THRESHOLDS.PLATINUM;
  if (points < RANK_THRESHOLDS.WORLD_CLASS.min) return RANK_THRESHOLDS.EMERALD;
  return RANK_THRESHOLDS.WORLD_CLASS;
};

export const calculateDailyFPChange = (score) => {
  // 10/10: +50 FP
  // 9/10: +40 FP
  // 8/10: +30 FP
  // 7/10: +20 FP
  // 6/10: +10 FP
  // 5/10: 0 FP
  // 4/10: -10 FP
  // 3/10: -20 FP
  // 2/10: -30 FP
  // 1/10: -40 FP
  // 0/10: -50 FP
  
  if (score >= 10) return 50;
  if (score === 9) return 40;
  if (score === 8) return 30;
  if (score === 7) return 20;
  if (score === 6) return 10;
  if (score === 5) return 0;
  if (score === 4) return -10;
  if (score === 3) return -20;
  if (score === 2) return -30;
  if (score === 1) return -40;
  return -50;
};

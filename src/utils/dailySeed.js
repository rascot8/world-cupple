import seedrandom from 'seedrandom';

/**
 * Returns today's date as a string in YYYY-MM-DD format based on UTC time.
 */
export const getTodayUTCString = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Deterministically select exactly 10 questions from the pool based on the current UTC date.
 * @param {Array} allQuestions - The full parsed CSV pool.
 */
export const getDailyQuestions = (allQuestions) => {
  if (!allQuestions || allQuestions.length === 0) return [];
  
  // Filter out any invalid rows first
  const validQuestions = allQuestions.filter(q => q.Question && q['Correct Answer']);
  
  const todayStr = getTodayUTCString();
  
  // Use today's date string as the seed
  const rng = seedrandom(todayStr);
  
  // Create an array of available indices
  let indices = Array.from({ length: validQuestions.length }, (_, i) => i);
  
  // Fisher-Yates shuffle using the seeded RNG
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Pick the first 10
  const selectedIndices = indices.slice(0, 10);
  
  return selectedIndices.map(index => validQuestions[index]);
};

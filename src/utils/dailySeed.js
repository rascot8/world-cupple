/**
 * Returns today's date as a string in YYYY-MM-DD format based on UTC time.
 * This is also the document id of today's quiz in the dailyQuizzes collection.
 */
export const getTodayUTCString = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

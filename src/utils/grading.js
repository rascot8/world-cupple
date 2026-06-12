/**
 * Round grading: maps a player's serialized choice string + the (post-reveal)
 * answer doc to a score in 0..1. Pure functions — shared by live gameplay,
 * the resume-after-refresh re-grade in App.jsx, and the seed script's
 * self-checks. The answer doc is only ever available AFTER the choice is
 * locked in (firestore.rules), so nothing here can leak an answer early.
 */

// Lowercase, strip accents, punctuation and whitespace so "Mbappé!" === "mbappe".
export const normalizeText = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

const textMatches = (choice, answer) => {
  const c = normalizeText(choice);
  if (!c) return false;
  if (c === normalizeText(answer.correctAnswer)) return true;
  return (answer.accepted || []).some((a) => c === normalizeText(a));
};

// careerPath choices are serialized "<option>|<clueIndex>" (clueIndex 0-3:
// how many clues were visible when the player answered).
export const serializeCareerPathChoice = (option, clueIndex) => `${option}|${clueIndex}`;
const parseCareerPathChoice = (choice) => {
  const i = (choice || '').lastIndexOf('|');
  if (i === -1) return { option: choice || '', clueIndex: 3 };
  return { option: choice.slice(0, i), clueIndex: Math.min(3, Math.max(0, Number(choice.slice(i + 1)) || 0)) };
};

const CAREER_PATH_CREDIT = [1, 0.75, 0.5, 0.25];

/**
 * Grade one round. `choice` is the serialized string stored in
 * users/{uid}/dailyAnswers ('' on timeout). Returns 0..1.
 */
export const gradeRound = (type, choice, answer) => {
  if (!answer || choice === null || choice === undefined || choice === '') return 0;

  switch (type) {
    case 'anagram':
    case 'missingVowels':
      return textMatches(choice, answer) ? 1 : 0;

    case 'closestGuess': {
      const guess = Number(choice);
      const target = Number(answer.correctValue);
      if (!Number.isFinite(guess) || !Number.isFinite(target)) return 0;
      const tolerance = Math.max(1, Math.abs(target) * ((answer.tolerancePct ?? 10) / 100));
      const distance = Math.abs(guess - target);
      if (distance <= tolerance) return 1;
      // Linear falloff: zero credit at 3x the tolerance band.
      const score = 1 - (distance - tolerance) / (tolerance * 2);
      return Math.max(0, Math.round(score * 100) / 100);
    }

    case 'yearGuesser': {
      const guess = Number(choice);
      const target = Number(answer.correctValue);
      if (!Number.isFinite(guess) || !Number.isFinite(target)) return 0;
      const off = Math.abs(guess - target);
      if (off === 0) return 1;
      if (off <= 1) return 0.75;
      if (off <= 3) return 0.5;
      if (off <= 5) return 0.25;
      return 0;
    }

    case 'careerPath': {
      const { option, clueIndex } = parseCareerPathChoice(choice);
      if (option !== answer.correctAnswer) return 0;
      return CAREER_PATH_CREDIT[clueIndex] ?? 0.25;
    }

    case 'timelineOrder': {
      const order = choice.split(',');
      const correct = answer.correctOrder || [];
      if (order.length !== correct.length) return 0;
      if (order.every((id, i) => id === correct[i])) return 1;
      // Partial credit per correct slot, capped so it never beats a solve.
      const right = order.filter((id, i) => id === correct[i]).length;
      return Math.min(0.5, right * 0.25);
    }

    // standard, crestMatch, oddOneOut, higherLower — exact option match.
    default:
      return choice === answer.correctAnswer ? 1 : 0;
  }
};

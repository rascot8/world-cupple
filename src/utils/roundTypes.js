/**
 * The single registry of daily round types. Consumed by:
 *   - gameplay (RoundRouter/RoundShell: timers, consumable applicability)
 *   - the admin editor (labels, blank shapes, validation)
 *   - the seed script (validation before writing to Firestore)
 *
 * Deliberately framework-free (no React/Firebase imports) so Node scripts can
 * import it directly.
 *
 * Data model recap:
 *   questions/{id}:       { text, type, payload, options?, category, difficulty, ... }
 *   questionAnswers/{id}: type-shaped answer doc (see answerDoc per type)
 *   dailyAnswers choice:  always a string (see grading.js for shapes)
 *
 * 'standard' keeps its legacy shape (options on the question root, answer as
 * { correctAnswer }) for backwards compatibility with existing content.
 * 'pick' (Match Day Picks) is intentionally NOT in this registry — it has its
 * own screen, economy and settlement flow.
 */

const trimmed = (s) => (s || '').trim();
const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

const validOptions = (options, count) => {
  const opts = (options || []).map(trimmed).filter(Boolean);
  return opts.length >= count && new Set(opts).size === opts.length;
};

export const ROUND_TYPES = {
  standard: {
    label: 'Trivia',
    icon: '❓',
    timerSeconds: 15,
    optionBased: true,
    optionsOf: (q) => q.options || [],
    blank: () => ({ options: ['', '', ''], answer: { correctAnswer: '' } }),
    validate: (q) => {
      if (!trimmed(q.text)) return 'needs question text';
      if (!validOptions(q.options, 3)) return 'needs 3 distinct options';
      if (!q.options.map(trimmed).includes(trimmed(q.answer?.correctAnswer))) return 'correct answer must be one of the options';
      return null;
    },
    answerDoc: (q) => ({ correctAnswer: trimmed(q.answer.correctAnswer) })
  },

  anagram: {
    label: 'Anagram',
    icon: '🔀',
    timerSeconds: 25,
    optionBased: false,
    optionsOf: () => null,
    blank: () => ({ payload: { scrambled: '', category: '' }, answer: { correctAnswer: '', accepted: [] } }),
    validate: (q) => {
      if (!trimmed(q.payload?.scrambled)) return 'needs scrambled letters';
      if (!trimmed(q.answer?.correctAnswer)) return 'needs the unscrambled answer';
      return null;
    },
    answerDoc: (q) => ({
      correctAnswer: trimmed(q.answer.correctAnswer),
      accepted: (q.answer.accepted || []).map(trimmed).filter(Boolean)
    })
  },

  missingVowels: {
    label: 'Missing Vowels',
    icon: '🔤',
    timerSeconds: 25,
    optionBased: false,
    optionsOf: () => null,
    blank: () => ({ payload: { puzzle: '', category: '' }, answer: { correctAnswer: '', accepted: [] } }),
    validate: (q) => {
      if (!trimmed(q.payload?.puzzle)) return 'needs the vowel-less puzzle';
      if (!trimmed(q.answer?.correctAnswer)) return 'needs the full answer';
      return null;
    },
    answerDoc: (q) => ({
      correctAnswer: trimmed(q.answer.correctAnswer),
      accepted: (q.answer.accepted || []).map(trimmed).filter(Boolean)
    })
  },

  higherLower: {
    label: 'Higher or Lower',
    icon: '⚖️',
    timerSeconds: 15,
    optionBased: true,
    optionsOf: (q) => [q.payload?.itemA, q.payload?.itemB].filter(Boolean),
    blank: () => ({ payload: { itemA: '', itemB: '', metric: '' }, answer: { correctAnswer: '' } }),
    validate: (q) => {
      if (!trimmed(q.payload?.itemA) || !trimmed(q.payload?.itemB)) return 'needs both items';
      if (!trimmed(q.payload?.metric)) return 'needs the metric being compared';
      const a = trimmed(q.answer?.correctAnswer);
      if (a !== trimmed(q.payload.itemA) && a !== trimmed(q.payload.itemB)) return 'winner must be item A or item B';
      return null;
    },
    answerDoc: (q) => ({ correctAnswer: trimmed(q.answer.correctAnswer) })
  },

  closestGuess: {
    label: 'Closest Guess',
    icon: '🎯',
    timerSeconds: 20,
    optionBased: false,
    optionsOf: () => null,
    blank: () => ({ payload: { min: 0, max: 100, step: 1, unit: '' }, answer: { correctValue: '', tolerancePct: 10 } }),
    validate: (q) => {
      if (!trimmed(q.text)) return 'needs a prompt';
      const min = num(q.payload?.min); const max = num(q.payload?.max); const v = num(q.answer?.correctValue);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return 'needs a valid min < max range';
      if (!Number.isFinite(v) || v < min || v > max) return 'correct value must be inside the range';
      return null;
    },
    answerDoc: (q) => ({ correctValue: num(q.answer.correctValue), tolerancePct: num(q.answer.tolerancePct) || 10 })
  },

  yearGuesser: {
    label: 'Guess the Year',
    icon: '📅',
    timerSeconds: 20,
    optionBased: false,
    optionsOf: () => null,
    blank: () => ({ payload: { min: 1930, max: 2026 }, answer: { correctValue: '' } }),
    validate: (q) => {
      if (!trimmed(q.text)) return 'needs a prompt';
      const min = num(q.payload?.min); const max = num(q.payload?.max); const v = num(q.answer?.correctValue);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return 'needs a valid year range';
      if (!Number.isFinite(v) || v < min || v > max) return 'correct year must be inside the range';
      return null;
    },
    answerDoc: (q) => ({ correctValue: num(q.answer.correctValue) })
  },

  careerPath: {
    label: 'Career Path',
    icon: '🕵️',
    timerSeconds: 30,
    optionBased: true,
    optionsOf: (q) => q.payload?.options || [],
    blank: () => ({ payload: { clues: ['', '', '', ''], options: ['', '', '', ''] }, answer: { correctAnswer: '' } }),
    validate: (q) => {
      const clues = (q.payload?.clues || []).map(trimmed).filter(Boolean);
      if (clues.length < 4) return 'needs 4 clues';
      if (!validOptions(q.payload?.options, 4)) return 'needs 4 distinct options';
      if (!q.payload.options.map(trimmed).includes(trimmed(q.answer?.correctAnswer))) return 'correct answer must be one of the options';
      return null;
    },
    answerDoc: (q) => ({ correctAnswer: trimmed(q.answer.correctAnswer) })
  },

  crestMatch: {
    label: 'Crest & Colors',
    icon: '🛡️',
    timerSeconds: 15,
    optionBased: true,
    optionsOf: (q) => q.payload?.options || [],
    blank: () => ({ payload: { imageUrl: '', options: ['', '', '', ''] }, answer: { correctAnswer: '' } }),
    validate: (q) => {
      if (!trimmed(q.payload?.imageUrl)) return 'needs an image URL';
      if (!validOptions(q.payload?.options, 4)) return 'needs 4 distinct options';
      if (!q.payload.options.map(trimmed).includes(trimmed(q.answer?.correctAnswer))) return 'correct answer must be one of the options';
      return null;
    },
    answerDoc: (q) => ({ correctAnswer: trimmed(q.answer.correctAnswer) })
  },

  timelineOrder: {
    label: 'Timeline',
    icon: '🧩',
    timerSeconds: 25,
    optionBased: false,
    optionsOf: () => null,
    blank: () => ({
      payload: { items: [{ id: 'a', label: '' }, { id: 'b', label: '' }, { id: 'c', label: '' }, { id: 'd', label: '' }] },
      answer: { correctOrder: [] }
    }),
    validate: (q) => {
      const items = q.payload?.items || [];
      if (items.length !== 4 || items.some((it) => !trimmed(it.label))) return 'needs 4 labelled events';
      const ids = items.map((it) => it.id);
      const order = q.answer?.correctOrder || [];
      if (order.length !== 4 || [...ids].sort().join() !== [...order].sort().join()) return 'correct order must use each event exactly once';
      return null;
    },
    answerDoc: (q) => ({ correctOrder: q.answer.correctOrder })
  },

  oddOneOut: {
    label: 'Odd One Out',
    icon: '🚩',
    timerSeconds: 15,
    optionBased: true,
    optionsOf: (q) => q.payload?.options || [],
    blank: () => ({ payload: { options: ['', '', '', ''] }, answer: { correctAnswer: '' } }),
    validate: (q) => {
      if (!trimmed(q.text)) return 'needs a prompt';
      if (!validOptions(q.payload?.options, 4)) return 'needs 4 distinct options';
      if (!q.payload.options.map(trimmed).includes(trimmed(q.answer?.correctAnswer))) return 'the odd one must be one of the options';
      return null;
    },
    answerDoc: (q) => ({ correctAnswer: trimmed(q.answer.correctAnswer) })
  }
};

export const ROUND_TYPE_IDS = Object.keys(ROUND_TYPES);

export const getRoundType = (type) => ROUND_TYPES[type] || ROUND_TYPES.standard;

export const roundTimerSeconds = (question) =>
  question?.timerSeconds || getRoundType(question?.type).timerSeconds;

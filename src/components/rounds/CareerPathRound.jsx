import React from 'react';
import OptionGrid from './OptionGrid';
import { serializeCareerPathChoice } from '../../utils/grading';
import { Lock } from 'lucide-react';

// Mystery footballer: four clues reveal across the timer (one per quarter).
// Answering on an early clue earns more credit — the clue index is encoded in
// the serialized choice so grading can pay out 1.0 / 0.75 / 0.5 / 0.25.
const CareerPathRound = ({ question, locked, answer, choice, overturned, submit, timeLeft, duration, eliminated }) => {
  const { payload = {} } = question;
  const clues = payload.clues || [];

  // Clue i unlocks once i/4 of the timer has elapsed; all revealed when locked.
  const elapsed = duration - timeLeft;
  const visibleCount = locked ? clues.length : Math.min(clues.length, 1 + Math.floor(elapsed / (duration / clues.length)));
  const clueIndex = visibleCount - 1;

  const pickedOption = choice ? choice.slice(0, choice.lastIndexOf('|') === -1 ? undefined : choice.lastIndexOf('|')) : null;

  return (
    <div>
      <h2 className="text-2xl font-black text-white leading-tight text-center mb-1">
        {question.text || 'Who is this player?'}
      </h2>
      <p className="text-center text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">
        Fewer clues = more points
      </p>

      <div className="space-y-2 mb-2">
        {clues.map((clue, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border text-sm font-bold transition-all duration-500 ${
              i < visibleCount
                ? 'bg-white/10 border-fifa-neon/30 text-white'
                : 'bg-white/5 border-white/10 text-gray-600'
            }`}
          >
            {i < visibleCount ? (
              <span><span className="text-fifa-neon mr-2">{i + 1}.</span>{clue}</span>
            ) : (
              <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Clue {i + 1} unlocks soon…</span>
            )}
          </div>
        ))}
      </div>

      <OptionGrid
        options={payload.options || []}
        choice={pickedOption}
        correct={answer?.correctAnswer || null}
        locked={locked}
        overturned={overturned}
        eliminated={eliminated}
        onChoose={(opt) => submit(serializeCareerPathChoice(opt, clueIndex))}
        compact
      />
    </div>
  );
};

export default CareerPathRound;

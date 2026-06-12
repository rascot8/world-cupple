import React, { useState, useEffect } from 'react';
import { gradeRound } from '../../utils/grading';

// Shared numeric-estimate round (closest guess, year guesser): a slider plus
// fine-tune steppers, lock-in button, and a reveal showing how close you got.
const SliderRound = ({ question, locked, answer, choice, overturned, submit, type }) => {
  const { payload = {} } = question;
  const min = Number(payload.min) || 0;
  const max = Number(payload.max) || 100;
  const step = Number(payload.step) || 1;
  const [value, setValue] = useState(Math.round((min + max) / 2));
  useEffect(() => { setValue(Math.round((min + max) / 2)); }, [question]); // eslint-disable-line react-hooks/exhaustive-deps

  const revealed = locked && answer;
  const score = revealed ? (overturned ? 1 : gradeRound(type, choice ?? '', answer)) : 0;
  const fmt = (n) => Number(n).toLocaleString();

  return (
    <div>
      <h2 className="text-2xl font-black text-white leading-tight text-center mb-6">
        {question.text}
      </h2>

      {!revealed ? (
        <div className="px-2">
          <div className="text-center mb-4">
            <span className="text-4xl font-black text-fifa-neon tabular-nums">{fmt(value)}</span>
            {payload.unit && <span className="text-gray-400 font-bold ml-2">{payload.unit}</span>}
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={locked}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-fifa-green h-3"
          />
          <div className="flex justify-between text-xs text-gray-500 font-bold mt-1 mb-4">
            <span>{fmt(min)}</span>
            <span>{fmt(max)}</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-5">
            {[-step * 10, -step, step, step * 10].map((d) => (
              <button
                key={d}
                disabled={locked}
                onClick={() => setValue((v) => Math.min(max, Math.max(min, v + d)))}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-sm font-black text-white hover:bg-white/20 transition-colors"
              >
                {d > 0 ? `+${fmt(d)}` : fmt(d)}
              </button>
            ))}
          </div>
          <button
            onClick={() => submit(String(value))}
            disabled={locked}
            className="w-full py-4 rounded-2xl bg-fifa-neon text-black font-black text-lg uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
          >
            Lock it in
          </button>
        </div>
      ) : (
        <div className={`p-5 rounded-2xl border-2 text-center ${score >= 0.5 ? 'bg-green-500/15 border-green-500' : score > 0 ? 'bg-yellow-500/15 border-yellow-500' : 'bg-red-500/15 border-red-500'}`}>
          <p className="text-gray-300 font-bold">
            Your guess: <span className="text-white font-black">{choice ? fmt(choice) : '—'}</span>
          </p>
          <p className="text-2xl font-black text-white mt-2">
            Answer: {fmt(answer.correctValue)}{payload.unit ? ` ${payload.unit}` : ''}
          </p>
          <p className={`mt-2 font-black uppercase tracking-wider text-sm ${score >= 0.5 ? 'text-green-400' : score > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {overturned ? '📺 Overturned — full credit!' : score >= 1 ? '🎯 Bang on!' : score > 0 ? `Close — ${Math.round(score * 100)}% credit` : 'Way off!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SliderRound;

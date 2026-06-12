import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, Check } from 'lucide-react';

// Put four events in chronological order (earliest first), then lock it in.
// Choice serializes as comma-joined item ids; exact order = full credit,
// partial positions = up to half credit (see grading.js).
const TimelineRound = ({ question, locked, answer, choice, overturned, submit }) => {
  const items = question.payload?.items || [];

  // Start shuffled so the solved order is never the default.
  const initial = useMemo(() => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  const [order, setOrder] = useState(initial);
  useEffect(() => { setOrder(initial); }, [initial]);

  const move = (idx, delta) => {
    if (locked) return;
    setOrder((prev) => {
      const next = [...prev];
      const j = idx + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const revealed = locked && answer;
  const correctOrder = answer?.correctOrder || [];
  const submittedIds = (choice || '').split(',');
  const byId = Object.fromEntries(items.map((it) => [it.id, it.label]));

  return (
    <div>
      <h2 className="text-2xl font-black text-white leading-tight text-center mb-1">
        {question.text || 'Put these in order'}
      </h2>
      <p className="text-center text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">
        Earliest at the top
      </p>

      {!revealed ? (
        <>
          <div className="space-y-2 mb-5">
            {order.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl bg-white/10 border border-white/20">
                <span className="text-fifa-neon font-black w-5">{idx + 1}</span>
                <span className="flex-grow font-bold text-sm text-white">{item.label}</span>
                <button onClick={() => move(idx, -1)} disabled={locked || idx === 0} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => move(idx, 1)} disabled={locked || idx === order.length - 1} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors">
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => submit(order.map((it) => it.id).join(','))}
            disabled={locked}
            className="w-full py-4 rounded-2xl bg-fifa-neon text-black font-black text-lg uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Lock in this order
          </button>
        </>
      ) : (
        <div className="space-y-2">
          {correctOrder.map((id, idx) => {
            const playerHadHere = submittedIds[idx] === id;
            return (
              <div
                key={id}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 ${overturned || playerHadHere ? 'bg-green-500/15 border-green-500' : 'bg-red-500/10 border-red-500/50'}`}
              >
                <span className="text-fifa-neon font-black w-5">{idx + 1}</span>
                <span className="flex-grow font-bold text-sm text-white">{byId[id] || id}</span>
                <span>{overturned || playerHadHere ? '✅' : '❌'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimelineRound;

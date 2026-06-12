import React, { useMemo } from 'react';

// Shared tappable option list used by every option-based round type.
// `correct` is the revealed correct option (null until the reveal).
const OptionGrid = ({ options, choice, correct, locked, overturned, eliminated = [], onChoose, compact = false }) => {
  // Shuffle once per option set so the layout is stable for the whole round.
  const shuffled = useMemo(() => {
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.join('§')]);

  const getOptionClass = (opt) => {
    if (eliminated.includes(opt)) {
      return 'bg-white/5 border-white/5 opacity-20 pointer-events-none scale-95';
    }
    if (!locked) return 'bg-white/10 hover:bg-white/20 border-white/20';

    // Submitted, waiting for the server to reveal the answer
    if (!correct) {
      if (opt === choice) return 'bg-white/20 border-fifa-neon animate-pulse';
      return 'bg-white/5 border-white/10 opacity-50';
    }

    // After an overturn, the player's pick is the one ruled correct.
    if (overturned) {
      if (opt === choice) return 'bg-green-500 text-white border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.2)]';
      if (opt === correct) return 'bg-white/5 border-fifa-neon/40 opacity-70';
      return 'bg-white/5 border-white/10 opacity-50';
    }

    if (opt === correct) return 'bg-green-500 text-white border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.2)]';
    if (opt === choice && opt !== correct) return 'bg-red-500 text-white border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]';
    return 'bg-white/5 border-white/10 opacity-50';
  };

  return (
    <div className={compact ? 'space-y-2.5 mt-4' : 'space-y-4 mt-6'}>
      {shuffled.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => onChoose(opt)}
          disabled={locked || eliminated.includes(opt)}
          className={`relative w-full ${compact ? 'p-4' : 'p-5'} rounded-2xl border-2 text-left font-bold ${compact ? 'text-base' : 'text-lg'} transition-all duration-300 transform active:scale-[0.98] ${getOptionClass(opt)}`}
        >
          {opt}
          {overturned && opt === choice && (
            <span className="absolute -top-2.5 right-3 bg-sky-400 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded rotate-2 shadow-lg">
              📺 Overturned
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default OptionGrid;

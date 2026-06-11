import React, { useState, useEffect } from 'react';
import { Zap, Clock, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { auth } from '../config/firebase';
import { fetchUserPicks } from '../utils/picksService';
import { formatOdds, potentialWin } from '../utils/picks';

// Dashboard section: the player's wagers. Pending picks (awaiting the match)
// show the stake and potential swing; settled picks show the FP result. Renders
// nothing for players who've never made a pick, so it stays out of the way.
const MatchDayPicksSection = () => {
  const [picks, setPicks] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const uid = auth.currentUser?.uid;
    if (!uid) { setPicks([]); return; }
    fetchUserPicks(uid)
      .then((p) => { if (!cancelled) setPicks(p); })
      .catch((e) => { console.error('Failed to load picks:', e); if (!cancelled) setPicks([]); });
    return () => { cancelled = true; };
  }, []);

  if (!picks || picks.length === 0) return null;

  const pending = picks.filter((p) => !p.settlement);
  const settled = picks.filter((p) => p.settlement).slice(0, 5);

  return (
    <div className="w-full glass-panel p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-fifa-neon" />
        <h3 className="font-black uppercase tracking-wider text-sm">Match Day Picks</h3>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2 mb-3">
          {pending.map((p) => (
            <div key={p.questionId} className="p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{p.fixture || p.text}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-fifa-neon uppercase shrink-0 ml-2">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{p.choice}</span>
                <span className="text-xs font-bold text-gray-300 tabular-nums">{p.stake} FP @ {formatOdds(p.odds)}</span>
              </div>
              <p className="text-[11px] text-fifa-green font-bold mt-1">To win +{potentialWin(p.stake, p.odds)} FP</p>
            </div>
          ))}
        </div>
      )}

      {settled.length > 0 && (
        <div className="space-y-2">
          {pending.length > 0 && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pt-1">Settled</p>}
          {settled.map((p) => {
            const s = p.settlement;
            const isVoid = s.void;
            const delta = s.rpDelta || 0;
            const color = isVoid ? 'text-gray-400' : (s.won ? 'text-fifa-green' : 'text-red-400');
            return (
              <div key={p.questionId} className="p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate">{p.fixture || p.text}</span>
                  <span className={`flex items-center gap-1 text-[11px] font-black shrink-0 ml-2 ${color}`}>
                    {isVoid ? (
                      <><RotateCcw className="w-3.5 h-3.5" /> Void</>
                    ) : s.won ? (
                      <><TrendingUp className="w-3.5 h-3.5" /> +{delta} FP</>
                    ) : (
                      <><TrendingDown className="w-3.5 h-3.5" /> {delta} FP</>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300">You picked: <span className="text-white">{p.choice}</span></span>
                  {!isVoid && <span className="text-gray-500">Winner: {s.result}</span>}
                  {isVoid && <span className="text-gray-500">Stake refunded</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchDayPicksSection;

import React from 'react';
import { X, Trophy } from 'lucide-react';
import { RANK_THRESHOLDS } from '../utils/ranking';

const HelpModal = ({ onClose }) => {
  const ranks = Object.values(RANK_THRESHOLDS).sort((a, b) => a.min - b.min);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-fifa-dark w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Help & How it Works</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Rank Tiers</h3>
            <div className="space-y-3">
              {ranks.map((rank) => (
                <div key={rank.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center space-x-3">
                    <Trophy className={`w-5 h-5 ${rank.color}`} />
                    <span className={`font-bold uppercase tracking-wider ${rank.color}`}>{rank.name}</span>
                  </div>
                  <span className="text-sm font-black text-white tabular-nums">
                    {rank.min}{rank.max !== Infinity ? ` - ${rank.max}` : '+'} FP
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Daily Match Logic</h3>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Every day, you play a 10-question match. Your score strictly dictates how many Football Points (FP) you gain or lose. You cannot drop below 0 FP.
              Captain’s Club members earn <span className="text-yellow-300 font-bold">+50%</span> on positive results.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm font-bold">
              <div className="bg-white/5 text-gold-glow p-2 rounded-lg text-center font-bold border border-white/10">10/10: +50 FP</div>
              <div className="bg-white/5 text-gold-glow p-2 rounded-lg text-center font-bold border border-white/10">9/10: +40 FP</div>
              <div className="bg-white/5 text-gold-glow p-2 rounded-lg text-center font-bold border border-white/10">8/10: +30 FP</div>
              <div className="bg-white/5 text-gold-glow p-2 rounded-lg text-center font-bold border border-white/10">7/10: +20 FP</div>
              <div className="bg-white/5 text-gold-glow p-2 rounded-lg text-center font-bold border border-white/10">6/10: +10 FP</div>
              <div className="bg-white/10 text-gray-300 p-2 rounded-lg text-center">5/10: 0 FP</div>
              <div className="bg-red-500/10 text-red-400 p-2 rounded-lg text-center">4/10: -10 FP</div>
              <div className="bg-red-500/10 text-red-400 p-2 rounded-lg text-center">3/10: -20 FP</div>
              <div className="bg-red-500/10 text-red-400 p-2 rounded-lg text-center">2/10: -30 FP</div>
              <div className="bg-red-500/10 text-red-400 p-2 rounded-lg text-center">1/10: -40 FP</div>
              <div className="bg-red-500/20 border border-red-500/20 text-red-500 p-2 rounded-lg text-center col-span-2">0/10: -50 FP</div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">🔥 Daily Streaks</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Play every day to grow your streak. Milestone days (3, 7, 14, 21, 30…) pay out bonus FP,
              CupCoins and sticker packs. Miss a day and the streak resets — unless a
              <span className="text-sky-300 font-bold"> 🛡️ Streak Shield</span> from the store saves it automatically.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">📔 Legends Album & Packs</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Collect all 64 stickers across 6 pages. Every completed Daily Match earns a free
              <span className="text-amber-400 font-bold"> 📦 Bronze Pack</span>; Gold and Legendary packs come from the store.
              Duplicates convert to FP automatically, completed pages pay CupCoins, and a Legendary is
              guaranteed at least every 10 packs.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">📺 VAR Review</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Holding a VAR Token? When you get an answer wrong, the referee checks the monitor —
              spend one token to overturn the call and keep your point. Once per match.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">🪙 CupCoins & Captain’s Club</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              CupCoins are the premium currency: earn a trickle from daily matches and album pages, or
              grab bundles in the store. The <span className="text-yellow-300 font-bold">⭐ Captain’s Club</span> season pass
              adds a claimable Gold Pack every day, +50% FP on wins, 2× duplicate value and gold flair on the leaderboard.
            </p>
          </section>

        </div>

        <div className="p-6 border-t border-white/10">
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-wider hover:bg-gray-200 transition-colors"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};

export default HelpModal;

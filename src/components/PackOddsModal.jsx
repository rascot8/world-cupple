import React from 'react';
import { X, Info } from 'lucide-react';

const PackOddsModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-fifa-dark border border-white/20 rounded-3xl p-6 shadow-2xl animate-float-up max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
          <Info className="w-6 h-6 text-fifa-neon" /> Pack Odds
        </h2>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <p>
            Each sticker has a hardcoded rarity field. When you open a pack, the system determines the rarity per slot via a weighted random draw:
          </p>

          <div className="space-y-3">
            {/* Matchday */}
            <div className="bg-black/20 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <span className="text-white font-black uppercase tracking-wider text-sm">Matchday Pack</span>
                <span className="text-[10px] uppercase text-gray-500 font-bold bg-white/5 px-2 py-1 rounded">No Guarantee</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 tabular-nums font-bold text-xs">
                <div className="flex items-center justify-between"><span>Base:</span> <span className="text-gray-300">70%</span></div>
                <div className="flex items-center justify-between"><span>Pro:</span> <span className="text-sky-300">24%</span></div>
                <div className="flex items-center justify-between"><span>W. Class:</span> <span className="text-fuchsia-300">5%</span></div>
                <div className="flex items-center justify-between"><span>Icon:</span> <span className="text-yellow-300">1%</span></div>
              </div>
            </div>

            {/* World Class */}
            <div className="bg-black/20 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <span className="text-white font-black uppercase tracking-wider text-sm">World Class Pack</span>
                <span className="text-[10px] uppercase text-sky-300 font-bold bg-sky-400/10 px-2 py-1 rounded">Slot 1 = Pro+</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 tabular-nums font-bold text-xs">
                <div className="flex items-center justify-between"><span>Base:</span> <span className="text-gray-300">42%</span></div>
                <div className="flex items-center justify-between"><span>Pro:</span> <span className="text-sky-300">40%</span></div>
                <div className="flex items-center justify-between"><span>W. Class:</span> <span className="text-fuchsia-300">14%</span></div>
                <div className="flex items-center justify-between"><span>Icon:</span> <span className="text-yellow-300">4%</span></div>
              </div>
            </div>

            {/* Icon */}
            <div className="bg-black/20 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <span className="text-white font-black uppercase tracking-wider text-sm">Icon Pack</span>
                <span className="text-[10px] uppercase text-fuchsia-300 font-bold bg-fuchsia-400/10 px-2 py-1 rounded">Slot 1 = W.Class+</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 tabular-nums font-bold text-xs">
                <div className="flex items-center justify-between"><span>Base:</span> <span className="text-gray-300">25%</span></div>
                <div className="flex items-center justify-between"><span>Pro:</span> <span className="text-sky-300">40%</span></div>
                <div className="flex items-center justify-between"><span>W. Class:</span> <span className="text-fuchsia-300">23%</span></div>
                <div className="flex items-center justify-between"><span>Icon:</span> <span className="text-yellow-300">12%</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-white uppercase tracking-wider">Override Rules</h3>
            
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="font-bold text-fifa-neon mb-1 uppercase tracking-widest text-xs">Pack Guarantee</h4>
              <p className="text-xs">
                The first slot filters the weight table to only rarities at or above the pack's minimum, then re-normalizes. So a World Class Pack can never open with a base card in slot 1.
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="font-bold text-yellow-300 mb-1 uppercase tracking-widest text-xs">Pity Counter</h4>
              <p className="text-xs">
                If <span className="font-mono text-gray-400">packsSinceLegendary + 1 &gt;= 10</span>, the last slot is forced to an Icon card regardless of the roll. The counter resets to 0 on any Icon hit and is stored on your profile.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 font-bold p-3 bg-black/40 rounded-xl border border-dashed border-white/20">
            Within a chosen rarity, the specific sticker is picked with a <span className="text-fifa-neon">65% bias toward cards you don't own yet</span>. Results are sorted ascending so the best card flips last in the ceremony!
          </p>

        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-6 py-4 rounded-xl font-black text-lg text-fifa-black uppercase tracking-wider bg-white hover:bg-gray-200 transition-colors"
        >
          Got it
        </button>

      </div>
    </div>
  );
};

export default PackOddsModal;

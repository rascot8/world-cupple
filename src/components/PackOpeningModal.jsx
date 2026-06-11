import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Coins } from 'lucide-react';
import { PACKS, RARITIES } from '../utils/stickers';
import { useAudio } from '../contexts/AudioContext';
import StickerCard from './StickerCard';

/**
 * The pack-opening ceremony: tap to rip → flip each card → summary.
 * Big pulls fire a confetti burst (handled by DancingBackground) and the
 * gain sound. This is the most important 8 seconds in the whole app.
 */
const PackOpeningModal = ({ packId, result, remainingPacks = 0, onOpenAnother, onClose }) => {
  const { playCorrect, playGain, playKickoffSfx } = useAudio();
  const pack = PACKS[packId];
  const [phase, setPhase] = useState('pack'); // pack → reveal → summary
  const [flipped, setFlipped] = useState([]);

  useEffect(() => {
    setPhase('pack');
    setFlipped([]);
  }, [result]);

  const celebrate = useCallback((rarity) => {
    if (rarity === 'legendary') {
      playGain();
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 140, gold: true } }));
    } else if (rarity === 'epic') {
      playGain();
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 60 } }));
    } else {
      playCorrect();
    }
  }, [playCorrect, playGain]);

  const ripOpen = () => {
    playKickoffSfx();
    setPhase('reveal');
  };

  const flipCard = (idx) => {
    if (flipped.includes(idx)) return;
    setFlipped((prev) => [...prev, idx]);
    celebrate(result.stickers[idx].rarity);
  };

  const flipAll = () => {
    const remaining = result.stickers.map((_, i) => i).filter((i) => !flipped.includes(i));
    remaining.forEach((idx, j) => {
      setTimeout(() => {
        setFlipped((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
        celebrate(result.stickers[idx].rarity);
      }, j * 450);
    });
  };

  const allFlipped = flipped.length === result.stickers.length;
  const newCount = result.stickers.filter((s) => s.isNew).length;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* ——— Phase 1: the unopened pack ——— */}
      {phase === 'pack' && (
        <div className="flex flex-col items-center animate-float-up">
          <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-xs mb-6">You got a</p>
          <button
            onClick={ripOpen}
            className={`relative w-56 h-72 rounded-3xl border-4 ${pack.ring} bg-gradient-to-br ${pack.gradient} animate-pack-wiggle shadow-2xl flex flex-col items-center justify-center gap-3 cursor-pointer`}
          >
            <div className="absolute inset-x-0 top-0 h-10 bg-black/20 rounded-t-[1.25rem] border-b-2 border-dashed border-white/30" />
            <span className="text-7xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">{pack.icon}</span>
            <span className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-lg">{pack.name}</span>
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{pack.size} stickers inside</span>
          </button>
          <p className="mt-8 text-fifa-neon font-black uppercase tracking-[0.25em] animate-pulse">⚡ Tap to rip it open</p>
        </div>
      )}

      {/* ——— Phase 2: card flips ——— */}
      {phase === 'reveal' && (
        <div className="flex flex-col items-center w-full max-w-3xl animate-float-up">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest mb-1">Tap each card</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-6">The best is saved for last…</p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
            {result.stickers.map((sticker, idx) => {
              const isFlipped = flipped.includes(idx);
              return (
                <div key={`${sticker.id}-${idx}`} className="perspective-1000">
                  <div
                    onClick={() => flipCard(idx)}
                    className={`relative preserve-3d transition-transform duration-700 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                  >
                    {/* Back of card (visible first) */}
                    <div className="backface-hidden">
                      <div className="w-40 sm:w-44 aspect-[3/4] rounded-2xl border-2 border-white/20 bg-gradient-to-br from-fifa-dark to-black flex flex-col items-center justify-center gap-2 hover:border-fifa-neon/60 transition-colors">
                        <span className="text-4xl">⚽</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">World Cupple</span>
                      </div>
                    </div>
                    {/* Front of card */}
                    <div className="absolute inset-0 rotate-y-180 backface-hidden">
                      <div className="relative">
                        {sticker.rarity === 'legendary' && isFlipped && (
                          <div className="absolute -inset-8 pointer-events-none animate-legendary-rays bg-[conic-gradient(from_0deg,transparent_0deg,rgba(250,204,21,0.35)_20deg,transparent_40deg,rgba(250,204,21,0.35)_60deg,transparent_80deg,rgba(250,204,21,0.35)_100deg,transparent_120deg,rgba(250,204,21,0.35)_140deg,transparent_160deg,rgba(250,204,21,0.35)_180deg,transparent_200deg,rgba(250,204,21,0.35)_220deg,transparent_240deg,rgba(250,204,21,0.35)_260deg,transparent_280deg,rgba(250,204,21,0.35)_300deg,transparent_320deg,rgba(250,204,21,0.35)_340deg,transparent_360deg)] rounded-full" />
                        )}
                        <StickerCard sticker={sticker} size="lg" highlightNew={sticker.isNew} count={0} />
                        {!sticker.isNew && isFlipped && (
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 border border-white/20 rounded-full px-2 py-0.5 text-[10px] font-black text-gold-glow whitespace-nowrap">
                            DUPE → +{sticker.dupeFP} FP
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!allFlipped ? (
            <button onClick={flipAll} className="text-gray-400 font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
              Flip all ✨
            </button>
          ) : (
            <button
              onClick={() => setPhase('summary')}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-lg uppercase tracking-wider hover:scale-[1.03] active:scale-95 transition-transform animate-float-up"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {/* ——— Phase 3: summary ——— */}
      {phase === 'summary' && (
        <div className="flex flex-col items-center w-full max-w-md animate-float-up">
          {result.legendaryHit ? (
            <h2 className="text-3xl font-black uppercase tracking-wider mb-2 foil-shimmer-text">LEGENDARY PULL!</h2>
          ) : (
            <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-2">Pack opened!</h2>
          )}
          <p className="text-gray-400 text-sm font-bold mb-6">
            {newCount > 0 ? `${newCount} new sticker${newCount === 1 ? '' : 's'} for your album` : 'All duplicates — converted to FP'}
          </p>

          <div className="glass-panel w-full p-5 mb-6 space-y-3">
            {result.stickers.map((s, i) => (
              <div key={`${s.id}-${i}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <span className={`font-bold truncate ${RARITIES[s.rarity].text}`}>{s.name}</span>
                </div>
                {s.isNew ? (
                  <span className="text-[10px] font-black uppercase bg-fifa-neon/15 text-fifa-neon border border-fifa-neon/40 rounded px-2 py-0.5 shrink-0">NEW</span>
                ) : (
                  <span className="text-[11px] font-black text-gold-glow shrink-0">+{s.dupeFP} FP</span>
                )}
              </div>
            ))}
            {result.dupeFP > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> Duplicate value
                </span>
                <span className="font-black text-gold-glow">+{result.dupeFP} FP</span>
              </div>
            )}
          </div>

          {remainingPacks > 0 && onOpenAnother ? (
            <button
              onClick={onOpenAnother}
              className="w-full py-4 mb-3 rounded-2xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-lg uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Open another ({remainingPacks} left)
            </button>
          ) : null}
          <button
            onClick={onClose}
            className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-95 ${remainingPacks > 0 ? 'bg-white/10 border border-white/20 text-white' : 'bg-white text-fifa-black'}`}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default PackOpeningModal;

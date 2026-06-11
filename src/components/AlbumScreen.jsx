import React, { useState } from 'react';
import { ArrowLeft, Gift, Coins, X, Sparkles } from 'lucide-react';
import { auth } from '../config/firebase';
import BrandHeader from './BrandHeader';
import StickerCard from './StickerCard';
import { STICKERS, PAGES, PACKS, RARITIES, albumProgress, PAGE_REWARD_COINS } from '../utils/stickers';
import { claimPageReward, redeemWildcardOn } from '../utils/economyService';
import { useAudio } from '../contexts/AudioContext';

/**
 * The Legends Album — the collection hub. Page tabs, sticker grid, page
 * completion rewards, the pack shelf, and Golden Wildcard redemption on any
 * missing sticker. Designed so there is always a visible "next thing".
 */
const AlbumScreen = ({ userData, onBack, onUpdateUser, onOpenPack, onGoStore }) => {
  const { playGain } = useAudio();
  const uid = auth.currentUser?.uid;
  const [activePage, setActivePage] = useState(PAGES[0].id);
  const [detail, setDetail] = useState(null); // sticker detail modal
  const [error, setError] = useState('');

  const owned = userData?.stickers || {};
  const progress = albumProgress(owned);
  const claimedPages = userData?.claimedPages || [];
  const wildcards = userData?.wildcards || 0;

  const packInventory = [
    { id: 'bronze', count: userData?.packBronze || 0 },
    { id: 'gold', count: userData?.packGold || 0 },
    { id: 'legendary', count: userData?.packLegendary || 0 }
  ];
  const totalPacks = packInventory.reduce((s, p) => s + p.count, 0);

  const handleClaimPage = async (pageId) => {
    setError('');
    try {
      const partial = await claimPageReward(uid, userData, pageId);
      onUpdateUser(partial);
      playGain();
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 80, gold: true } }));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleWildcard = async (sticker) => {
    setError('');
    try {
      const partial = await redeemWildcardOn(uid, userData, sticker.id);
      onUpdateUser(partial);
      playGain();
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 100, gold: sticker.rarity === 'legendary' } }));
      setDetail(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const pageInfo = PAGES.find((p) => p.id === activePage);
  const pageStickers = STICKERS.filter((s) => s.page === activePage);
  const pageProgress = progress.byPage[activePage];

  return (
    <div className="min-h-screen flex flex-col p-6 relative">
      <BrandHeader isHero={false} />
      <button onClick={onBack} className="absolute top-6 right-6 z-50 text-white hover:text-fifa-neon flex items-center font-bold uppercase tracking-wider text-sm">
        Back <ArrowLeft className="w-5 h-5 ml-2 transform rotate-180" />
      </button>

      <div className="w-full max-w-md mx-auto z-10 pt-16 pb-10 flex-grow flex flex-col">
        {/* Header: completion */}
        <div className="glass-panel p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Legends Album</h2>
            <span className="font-black text-fifa-neon tabular-nums">{progress.owned}/{progress.total}</span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-fifa-green to-fifa-neon rounded-full transition-all duration-700"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>{progress.percent}% complete</span>
            <span className="text-yellow-300">✨ {progress.legendariesOwned}/6 legendary</span>
          </div>
          {progress.complete && (
            <p className="mt-2 text-center text-xs font-black foil-shimmer-text uppercase tracking-widest">ALBUM COMPLETE — THE COLLECTOR 💎</p>
          )}
        </div>

        {/* Pack shelf */}
        <div className="glass-panel p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-fifa-neon" /> Your packs
            </span>
            {wildcards > 0 && (
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">🃏 {wildcards} wildcard{wildcards === 1 ? '' : 's'} — tap a missing sticker</span>
            )}
          </div>
          {totalPacks === 0 ? (
            <button onClick={onGoStore} className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-gray-400 text-sm font-bold uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors">
              No packs — visit the store 🛒
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {packInventory.map(({ id, count }) => (
                <button
                  key={id}
                  onClick={() => count > 0 && onOpenPack(id)}
                  disabled={count === 0}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${count > 0 ? `bg-gradient-to-b ${PACKS[id].gradient} ${PACKS[id].ring} hover:scale-[1.04] active:scale-95 cursor-pointer` : 'bg-white/5 border-white/10 opacity-40'}`}
                >
                  <span className="text-2xl">{PACKS[id].icon}</span>
                  <span className="text-[9px] font-black text-white uppercase tracking-wide mt-1">×{count}</span>
                  {count > 0 && <span className="text-[8px] font-black text-white/90 uppercase">OPEN</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-center text-sm text-red-400 font-bold mb-3">{error}</p>}

        {/* Page tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
          {PAGES.map((p) => {
            const pp = progress.byPage[p.id];
            return (
              <button
                key={p.id}
                onClick={() => setActivePage(p.id)}
                className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-wide transition-colors flex items-center gap-1.5
                  ${activePage === p.id ? 'bg-fifa-neon/15 border-fifa-neon text-fifa-neon' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
              >
                <span>{p.icon}</span>
                <span className="tabular-nums">{pp.owned}/{pp.total}</span>
                {pp.complete && <span className="text-yellow-300">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Page header + claim */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-black text-white uppercase tracking-wider">{pageInfo.icon} {pageInfo.name}</h3>
            <p className="text-[10px] text-gray-400 font-bold">{pageInfo.blurb}</p>
          </div>
          {pageProgress.complete && !claimedPages.includes(activePage) && (
            <button
              onClick={() => handleClaimPage(activePage)}
              className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-500 text-black text-xs font-black uppercase tracking-wide animate-pulse-gold flex items-center gap-1"
            >
              <Coins className="w-3.5 h-3.5" /> Claim 🪙{PAGE_REWARD_COINS}
            </button>
          )}
          {pageProgress.complete && claimedPages.includes(activePage) && (
            <span className="text-[10px] font-black text-yellow-300 uppercase tracking-wider">Complete ✓</span>
          )}
        </div>

        {/* Sticker grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {pageStickers.map((sticker) => (
            <StickerCard
              key={sticker.id}
              sticker={sticker}
              owned={owned[sticker.id] > 0}
              count={owned[sticker.id] || 0}
              size="sm"
              onClick={() => setDetail(sticker)}
            />
          ))}
        </div>
      </div>

      {/* Sticker detail modal */}
      {detail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="w-full max-w-xs flex flex-col items-center animate-float-up" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetail(null)} className="self-end mb-3 text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="w-48">
              <StickerCard sticker={detail} owned={owned[detail.id] > 0} count={owned[detail.id] || 0} size="lg" />
            </div>
            <p className={`mt-4 text-center text-sm font-bold ${owned[detail.id] > 0 ? 'text-gray-300' : 'text-gray-500'} italic leading-snug`}>
              {owned[detail.id] > 0 ? `“${detail.flavor}”` : 'Find this sticker in packs to reveal its story.'}
            </p>
            <p className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Duplicate value: {RARITIES[detail.rarity].dupeFP} FP
            </p>
            {!(owned[detail.id] > 0) && wildcards > 0 && (
              <button
                onClick={() => handleWildcard(detail)}
                className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-500 text-black font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Use Golden Wildcard ({wildcards})
              </button>
            )}
            {!(owned[detail.id] > 0) && wildcards === 0 && (
              <button
                onClick={() => { setDetail(null); onGoStore(); }}
                className="mt-4 text-xs font-bold text-amber-300 uppercase tracking-wider hover:text-amber-200"
              >
                🃏 Get a Golden Wildcard in the store →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumScreen;

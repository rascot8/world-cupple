import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Coins, X, Sparkles } from 'lucide-react';
import { auth } from '../config/firebase';
import BrandHeader from './BrandHeader';
import StickerCard from './StickerCard';
import PackVisual from './PackVisual';
import { STICKERS, PAGES, PACKS, RARITIES, albumProgress, PAGE_REWARD_COINS, PACK_FIELDS } from '../utils/stickers';
import { claimPageReward, sellDuplicateSticker } from '../utils/economyService';
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
  const [sellAnim, setSellAnim] = useState(null);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [error, setError] = useState('');

  const owned = userData?.stickers || {};
  const progress = albumProgress(owned);
  const claimedPages = userData?.claimedPages || [];
  const wildcards = userData?.wildcards || 0;

  const packInventory = Object.keys(PACKS).map(id => ({
    id,
    count: userData?.[PACK_FIELDS[id]] || 0
  }));
  const totalPacks = packInventory.reduce((s, p) => s + p.count, 0);

  // Animate coins counting up
  useEffect(() => {
    if (sellAnim && sellAnim.phase === 'counting') {
      let startTime = null;
      const duration = 1200;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayCoins(Math.floor(sellAnim.oldCoins + (sellAnim.amount * easeOut)));
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    }
  }, [sellAnim]);

  const handleClaimPage = async (pageId) => {
    setError('');
    try {
      const partial = await claimPageReward(uid, userData, pageId);
      onUpdateUser(partial);
      playGain();
      new Audio('/audio/sell.mp3').play().catch(e => console.error('Audio play failed', e));
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 80, gold: true } }));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSellDuplicate = async (stickerId) => {
    setError('');
    try {
      const amount = RARITIES[detail.rarity].dupeCP;
      const oldCoins = userData?.coins || 0;
      
      const partial = await sellDuplicateSticker(uid, userData, stickerId);
      onUpdateUser(partial);
      new Audio('/audio/sell.mp3').play().catch(e => console.error('Audio play failed', e));
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 40, gold: true } }));
      
      // Start sequence
      setSellAnim({ phase: 'enlarge', amount, oldCoins });
      
      setTimeout(() => {
        setSellAnim(prev => prev ? { ...prev, phase: 'crash' } : null);
      }, 500); // 0.5s to enlarge and fade out

      setTimeout(() => {
        setSellAnim(prev => prev ? { ...prev, phase: 'counting' } : null);
      }, 1100); // Wait for crash drop-in to finish, then count
      
      setTimeout(() => {
        setSellAnim(null);
        // Optional: auto-close if no dupes left, but let's just let them see the new coin balance 
        // or let them manually close.
      }, 3500);
      
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
          </div>
          {totalPacks === 0 ? (
            <button onClick={onGoStore} className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-gray-400 text-sm font-bold uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors">
              No packs — visit the store 🛒
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2 pb-2">
              {packInventory.map(({ id, count }) => (
                <button
                  key={id}
                  onClick={() => count > 0 && onOpenPack(id)}
                  disabled={count === 0}
                  className={`relative transition-all w-full ${count > 0 ? 'hover:scale-[1.04] active:scale-95 cursor-pointer' : 'opacity-40 grayscale cursor-not-allowed'}`}
                >
                  <PackVisual pack={PACKS[id]} count={count} showCount={true} />
                  {count > 0 && (
                    <div className="absolute -bottom-2 inset-x-0 mx-auto w-11/12 py-0.5 rounded bg-black/80 border border-white/20 text-center text-[8px] font-black text-white/90 uppercase tracking-widest z-20">
                      OPEN
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-center text-sm text-red-400 font-bold mb-3">{error}</p>}

        {/* Page tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
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
          {pageProgress.complete && !claimedPages.includes(activePage) ? (
            <button
              onClick={() => handleClaimPage(activePage)}
              className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-500 text-black text-xs font-black uppercase tracking-wide animate-pulse-gold flex items-center gap-1"
            >
              <Coins className="w-3.5 h-3.5" /> Claim 🪙{PAGE_REWARD_COINS}
            </button>
          ) : pageProgress.complete && claimedPages.includes(activePage) ? (
            <span className="text-[10px] font-black text-yellow-300 uppercase tracking-wider">Complete ✓</span>
          ) : (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400/50" /> Reward: 🪙{PAGE_REWARD_COINS}
            </span>
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm" onClick={() => !sellAnim && setDetail(null)}>
          <div className="w-full max-w-xs flex flex-col items-center relative" onClick={(e) => e.stopPropagation()}>
            
            {/* The CupCoins crash and counting sequence */}
            {sellAnim && sellAnim.phase !== 'enlarge' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-drop-in pointer-events-none">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">CupCoins</p>
                <div className="flex items-center gap-2">
                  <Coins className="w-10 h-10 text-amber-400" />
                  <p className="text-5xl font-black text-amber-300 tabular-nums drop-shadow-lg">
                    {sellAnim.phase === 'counting' ? displayCoins : sellAnim.oldCoins}
                  </p>
                </div>
                <p className={`text-2xl font-black text-fifa-neon mt-4 transition-opacity duration-500 ${sellAnim.phase === 'counting' ? 'opacity-100 scale-125' : 'opacity-0 scale-50'}`}>
                  +{sellAnim.amount}
                </p>
              </div>
            )}

            {/* The regular modal content. Fades out and scales up if sellAnim is active */}
            <div className={`w-full flex flex-col items-center transition-all duration-500 ${sellAnim ? 'opacity-0 scale-125 pointer-events-none' : 'opacity-100 animate-float-up'}`}>
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
                Duplicate value: {RARITIES[detail.rarity].dupeCP} CupCoins
              </p>
              {(owned[detail.id] || 0) > 1 && !sellAnim && (
                <button
                  onClick={() => handleSellDuplicate(detail.id)}
                  className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-white font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" /> Sell Duplicate (+{RARITIES[detail.rarity].dupeCP})
                </button>
              )}
              {!(owned[detail.id] > 0) && !sellAnim && (
                <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                  Keep opening packs to find this legend.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumScreen;

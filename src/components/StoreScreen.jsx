import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Star, Flame, Tv, Shield, Sparkles, Check } from 'lucide-react';
import { auth } from '../config/firebase';
import BrandHeader from './BrandHeader';
import CheckoutModal from './CheckoutModal';
import PackVisual from './PackVisual';
import { useAudio } from '../contexts/AudioContext';
import {
  COIN_BUNDLES, STORE_ITEMS, VIP, getDailyDeal, msUntilUtcMidnight, formatCountdown
} from '../utils/economy';
import { PACKS, PITY_THRESHOLD, PACK_FIELDS } from '../utils/stickers';
import { purchaseCoins, purchaseItem, purchaseVip, purchasePack } from '../utils/economyService';
import { getTodayUTCString } from '../utils/dailySeed';



/**
 * The Megastore: CupCoin bundles up top (the real-money funnel), then the
 * Daily Deal (FOMO timer), Captain’s Club (the season VIP), and the item
 * shelf. Every price is in coins except Bronze Packs, which soak up FP.
 */
const StoreScreen = ({ userData, onBack, onUpdateUser, onOpenPack }) => {
  const { playGain, playPurchase, playBattlePass } = useAudio();
  const uid = auth.currentUser?.uid;
  const [checkout, setCheckout] = useState(null); // bundle being bought
  const [busy, setBusy] = useState(null); // item id mid-purchase
  const [justBought, setJustBought] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(msUntilUtcMidnight());

  const today = getTodayUTCString();
  const deal = getDailyDeal(today);
  const coins = userData?.coins || 0;
  const purchased = userData?.purchasedBundles || [];

  useEffect(() => {
    const t = setInterval(() => setCountdown(msUntilUtcMidnight()), 1000);
    return () => clearInterval(t);
  }, []);

  const flashBought = (id) => {
    setJustBought(id);
    if (id !== 'vip') {
      setTimeout(() => setJustBought(null), 1800);
    }
  };

  const buyItem = async (item, dealPrice = null) => {
    setError('');
    setBusy(item.id);
    playPurchase();
    try {
      const partial = await purchaseItem(uid, userData, item.id, dealPrice);
      onUpdateUser(partial);
      flashBought(dealPrice !== null ? `deal_${item.id}` : item.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const buyVipNow = async () => {
    setError('');
    setBusy('vip');
    playBattlePass();
    try {
      const partial = await purchaseVip(uid, userData);
      onUpdateUser(partial);
      flashBought('vip');
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 120, gold: true } }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const buyPackNow = async (packId, currency) => {
    setError('');
    setBusy(`${packId}_${currency}`);
    playPurchase();
    try {
      const partial = await purchasePack(uid, userData, packId, currency);
      onUpdateUser(partial);
      flashBought(`${packId}_${currency}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const ownedOfItem = (item) => userData?.[item.field] || 0;
  const pity = userData?.packsSinceLegendary || 0;

  return (
    <div className="min-h-screen flex flex-col p-6 relative">
      <BrandHeader isHero={false} />
      <button onClick={onBack} className="absolute top-6 right-6 z-50 text-white hover:text-fifa-neon flex items-center font-bold uppercase tracking-wider text-sm">
        Back <ArrowLeft className="w-5 h-5 ml-2 transform rotate-180" />
      </button>

      <div className="w-full max-w-md mx-auto z-10 pt-16 pb-10 space-y-6">
        {/* Wallet */}
        <div className="glass-panel p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your wallet</p>
            <p className="text-3xl font-black text-amber-300 tabular-nums flex items-center gap-2">
              <Coins className="w-7 h-7" /> {coins.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Football Points</p>
            <p className="text-xl font-black text-gold-glow tabular-nums">{(userData?.fp || 0).toLocaleString()} FP</p>
          </div>
        </div>

        {error && <p className="text-center text-sm text-red-400 font-bold">{error}</p>}

        {/* ——— CupCoin bundles ——— */}
        <section>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-300" /> Get CupCoins
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {COIN_BUNDLES.map((b) => {
              const firstBuy = !purchased.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => setCheckout(b)}
                  className={`relative glass-panel p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors ${b.tag === 'MOST POPULAR' ? 'border-fifa-neon/50 animate-pulse-glow-green' : ''} ${b.tag === 'BEST VALUE' ? 'border-amber-400/50 animate-pulse-gold' : ''}`}
                >
                  {b.tag && (
                    <span className={`absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${b.tag === 'MOST POPULAR' ? 'bg-fifa-neon text-fifa-black' : 'bg-amber-400 text-black'}`}>
                      {b.tag}
                    </span>
                  )}
                  <span className="text-3xl mb-1">{b.icon}</span>
                  <span className="font-black text-amber-300 tabular-nums">{b.coins.toLocaleString()}</span>
                  {firstBuy && (
                    <span className="text-[9px] font-black text-fifa-neon uppercase tracking-wide">×2 first buy!</span>
                  )}
                  <span className="mt-2 w-full py-1.5 rounded-lg bg-white text-fifa-black font-black text-sm tabular-nums">${b.price}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ——— Daily deal ——— */}
        <section className="glass-panel p-4 border-red-400/40 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/20 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-red-400 font-black text-xs uppercase tracking-widest">
              <Flame className="w-4 h-4" /> Today’s Deal — {deal.percentOff}% off
            </span>
            <span className="text-xs font-black text-white tabular-nums bg-black/40 rounded-md px-2 py-1">{formatCountdown(countdown)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl shrink-0">{deal.item.icon}</span>
              <div className="min-w-0">
                <p className="font-black text-white truncate">{deal.item.name}</p>
                <p className="text-[10px] text-gray-400 font-bold truncate">{deal.item.blurb}</p>
              </div>
            </div>
            <button
              onClick={() => buyItem(deal.item, deal.dealCoins)}
              disabled={busy === deal.item.id || coins < deal.dealCoins}
              className="shrink-0 ml-3 px-4 py-2 rounded-xl bg-red-500 text-white font-black text-sm hover:bg-red-400 transition-colors disabled:opacity-40 flex flex-col items-center leading-tight"
            >
              {justBought === `deal_${deal.item.id}` ? <Check className="w-5 h-5" /> : (
                <>
                  <span className="line-through text-[9px] text-red-200 tabular-nums">🪙{deal.item.coins}</span>
                  <span className="tabular-nums">🪙{deal.dealCoins}</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* ——— Captain’s Club ——— */}
        <section className={`glass-panel p-5 relative overflow-hidden ${userData?.vip ? 'border-yellow-400/60' : 'border-yellow-400/40 animate-pulse-gold'}`}>
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-yellow-400/15 rounded-full blur-3xl" />
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-300" fill="currentColor" />
            <h3 className="font-black text-white uppercase tracking-widest">Captain’s Club</h3>
            {userData?.vip && (
              <span className="ml-auto text-[10px] font-black uppercase bg-yellow-400 text-black rounded-full px-2 py-0.5">Active ⭐</span>
            )}
          </div>
          <ul className="space-y-1.5 mb-4">
            {VIP.perks.map((perk) => (
              <li key={perk} className="text-xs font-bold text-gray-300">{perk}</li>
            ))}
          </ul>
          {!userData?.vip && (
            <button
              onClick={buyVipNow}
              disabled={busy === 'vip' || coins < VIP.priceCoins}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white shadow-[0_0_15px_rgba(192,38,211,0.6)] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100"
            >
              {justBought === 'vip' ? 'WELCOME, CAPTAIN! ⭐' : `Join for 🪙 ${VIP.priceCoins.toLocaleString()} — all season`}
            </button>
          )}
          {!userData?.vip && coins < VIP.priceCoins && (
            <p className="text-center text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-wider">Grab the Fan Stash above to unlock instantly</p>
          )}
        </section>

        {/* ——— Item shelf ——— */}
        <section>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fifa-neon" /> Matchday Gear
          </h3>
          <div className="space-y-3 mt-3">
            {STORE_ITEMS.map((item) => {
              const owned = ownedOfItem(item);
              return (
                <div key={item.id} className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="font-black text-white flex items-center gap-2">
                        {item.name}
                        {owned > 0 && <span className="text-[9px] font-black bg-white/10 rounded px-1.5 py-0.5 text-gray-300">×{owned}</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold leading-snug">{item.blurb}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => buyItem(item)}
                    disabled={busy === item.id || coins < item.coins}
                    className="shrink-0 ml-3 px-4 py-2.5 rounded-xl bg-amber-400/15 border border-amber-300/40 text-amber-300 font-black text-sm tabular-nums hover:bg-amber-400/25 transition-colors disabled:opacity-40"
                  >
                    {justBought === item.id ? <Check className="w-5 h-5" /> : <>🪙 {item.coins}</>}
                  </button>
                </div>
              );
            })}

            {/* Sticker Packs */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {Object.values(PACKS).map(pack => (
                <div key={pack.id} className="glass-panel p-3 flex flex-col items-center text-center relative overflow-hidden group">
                  <PackVisual pack={pack} className="w-16 sm:w-20 mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <div className="flex-1 flex flex-col items-center w-full">
                    <p className="text-[9px] text-gray-400 font-bold leading-snug mb-3 line-clamp-2 min-h-[28px]">{pack.blurb}</p>
                    <div className="flex flex-col gap-1.5 w-full mt-auto">
                      <button
                        onClick={() => buyPackNow(pack.id, 'fp')}
                        disabled={busy === `${pack.id}_fp` || (userData?.fp || 0) < pack.costFP}
                        className="w-full py-2 rounded-lg bg-white/10 border border-white/20 text-gold-glow font-black text-[10px] sm:text-xs tabular-nums hover:bg-white/15 transition-colors disabled:opacity-40"
                      >
                        {justBought === `${pack.id}_fp` ? <Check className="w-3 h-3 mx-auto" /> : <>⭐ {pack.costFP}</>}
                      </button>
                      <button
                        onClick={() => buyPackNow(pack.id, 'coins')}
                        disabled={busy === `${pack.id}_coins` || coins < pack.costCoins}
                        className="w-full py-2 rounded-lg bg-amber-400/15 border border-amber-300/40 text-amber-300 font-black text-[10px] sm:text-xs tabular-nums hover:bg-amber-400/25 transition-colors disabled:opacity-40"
                      >
                        {justBought === `${pack.id}_coins` ? <Check className="w-3 h-3 mx-auto" /> : <>🪙 {pack.costCoins}</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open-now shortcut when packs are sitting in the inventory */}
        {(() => {
          const firstOwnedPack = Object.keys(PACKS).find(id => (userData?.[PACK_FIELDS[id]] || 0) > 0);
          if (!firstOwnedPack) return null;
          return (
            <button
              onClick={() => onOpenPack(firstOwnedPack)}
              className="w-full py-4 mt-6 rounded-2xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-lg uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform"
            >
              🎁 You have unopened packs — rip one now!
            </button>
          );
        })()}
      </div>

      {justBought === 'vip' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          {/* Animated LED Border Wrapper */}
          <div className="relative p-1 rounded-2xl overflow-hidden animate-vip-epic-pop animate-rainbow-glow w-full max-w-sm mx-auto">
            {/* Spinning conic gradient */}
            <div className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] pointer-events-none" />
            
            {/* Inner Content Panel */}
            <div className="relative bg-gray-900 rounded-[14px] p-8 text-center h-full border border-gray-800">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20 blur-xl pointer-events-none" />
              <Star className="w-24 h-24 text-yellow-300 mx-auto mb-6 relative z-10 animate-pulse-gold" fill="currentColor" />
              <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-3 relative z-10 drop-shadow-lg">Captain's Club</h2>
              <p className="text-xl text-yellow-400 font-black uppercase tracking-wider relative z-10">Welcome, Captain! ⭐</p>
              
              {/* Close Button */}
              <button 
                onClick={() => setJustBought(null)} 
                className="mt-8 w-full py-3.5 rounded-xl bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform relative z-10"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {checkout && (
        <CheckoutModal
          bundle={checkout}
          firstBuy={!purchased.includes(checkout.id)}
          uid={uid}
          onConfirm={async () => {
            const res = await purchaseCoins(uid, userData, checkout);
            onUpdateUser(res);
            return res;
          }}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
};

export default StoreScreen;

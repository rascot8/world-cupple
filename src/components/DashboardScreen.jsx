import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTodayUTCString } from '../utils/dailySeed';
import { getRankForFP } from '../utils/ranking';
import { auth, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Trophy, BarChart2, Share2, Target, Award, Shield, Coins, Flame, BookOpen, ShoppingBag, Star, Gift } from 'lucide-react';
import { COUNTRIES } from '../utils/countries';
import HelpModal from './HelpModal';
import SettingsModal from './SettingsModal';
import TrophyCabinetModal from './TrophyCabinetModal';
import ProfileDropdown from './ProfileDropdown';
import ProfileModal from './ProfileModal';
import WelcomeModal from './WelcomeModal';
import BrandHeader from './BrandHeader';
import MatchDayPicksSection from './MatchDayPicksSection';
import { getDailyDeal, formatCountdown, msUntilUtcMidnight } from '../utils/economy';
import { weekDots, getNextMilestone } from '../utils/streaks';
import { albumProgress } from '../utils/stickers';
import { getTournamentStatus } from '../utils/liveFeed';
import { claimVipDailyPack } from '../utils/economyService';

const DashboardScreen = ({ onPlay, onPractice, onLeaderboard, onStore, onAlbum, onOpenPack, onUpdateUser, userData }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTrophyCabinet, setShowTrophyCabinet] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [copied, setCopied] = useState(false);
  const [claimingVip, setClaimingVip] = useState(false);

  const today = getTodayUTCString();
  const hasPlayedToday = userData?.lastPlayedDate === today;
  const rank = getRankForFP(userData?.fp || 0);
  const streak = userData?.playStreak || 0;
  const dots = weekDots(userData, today);
  const nextMilestone = getNextMilestone(streak);
  const deal = getDailyDeal(today);
  const tournament = getTournamentStatus(today);
  const album = albumProgress(userData?.stickers || {});
  const unopenedPacks = (userData?.packBronze || 0) + (userData?.packGold || 0) + (userData?.packLegendary || 0);
  const vipClaimAvailable = userData?.vip && userData?.vipClaimedDate !== today;

  useEffect(() => {
    if (userData && !userData.country) {
      setShowCountrySelect(true);
    } else {
      setShowCountrySelect(false);
    }
  }, [userData]);

  useEffect(() => {
    if (hasPlayedToday) {
      const interval = setInterval(() => {
        setTimeLeft(formatCountdown(msUntilUtcMidnight()));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [hasPlayedToday]);

  const saveCountry = async (code) => {
    const selected = code || selectedCountry || 'NONE';
    if (auth.currentUser && db) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        country: selected
      });
      window.location.reload();
    }
  };

  const handleCopyInvite = () => {
    if (auth.currentUser) {
      const link = `${window.location.origin}${import.meta.env.BASE_URL}?invite=${auth.currentUser.uid}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimVip = async () => {
    if (claimingVip) return;
    setClaimingVip(true);
    try {
      const partial = await claimVipDailyPack(auth.currentUser.uid, userData);
      onUpdateUser(partial);
      // State hasn't flushed yet — hand the ceremony the post-claim snapshot.
      onOpenPack('gold', { ...userData, ...partial });
    } catch (e) {
      console.error('VIP claim failed:', e);
    } finally {
      setClaimingVip(false);
    }
  };

  const handleLogout = () => {
    if (auth) auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-20 relative overflow-hidden">
      <WelcomeModal onClose={() => setShowWelcomeModal(false)} forceShow={showWelcomeModal} />

      <div className="absolute top-6 right-6 z-50 flex items-center space-x-4">
        {userData?.isAdmin && (
          <button onClick={() => { window.location.href = `${import.meta.env.BASE_URL}admin`; }} title="Quiz Admin" className="text-fifa-neon hover:text-white transition-colors">
            <Shield className="w-6 h-6" />
          </button>
        )}
        <button onClick={() => setShowTrophyCabinet(true)} className="text-white hover:text-fifa-neon transition-colors">
          <Award className="w-6 h-6" />
        </button>
        <button onClick={onLeaderboard} className="text-white hover:text-fifa-neon transition-colors">
          <BarChart2 className="w-6 h-6" />
        </button>
        <ProfileDropdown
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenRank={() => setShowHelpModal(true)}
          onOpenTutorial={() => setShowWelcomeModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onLogout={handleLogout}
        />
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center pt-10">
        <BrandHeader isHero={true} />

        {/* Tournament pulse */}
        <div className="mb-5 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
          <span>{tournament.icon}</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-300">
            World Cup 2026 · <span className="text-fifa-neon">{tournament.label}</span>
          </span>
        </div>

        {/* Rank + wallets */}
        <div className="w-full flex items-stretch gap-3 mb-4">
          <div className="glass-panel flex-1 p-4 flex flex-col items-center justify-center">
            <Trophy className={`w-8 h-8 ${rank.color} mb-1`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${rank.color} flex items-center gap-1`}>
              {rank.name}
              {userData?.vip && <Star className="w-3 h-3 text-yellow-300" fill="currentColor" />}
            </span>
          </div>
          <div className="glass-panel flex-[1.4] p-4 text-center">
            <p className="text-gray-400 uppercase tracking-widest text-[9px] font-bold mb-1">{t('Football Points')}</p>
            <h2 className="text-3xl font-black text-gold-glow tabular-nums">{(userData?.fp || 0).toLocaleString()}</h2>
          </div>
          <button onClick={onStore} className="glass-panel flex-1 p-4 text-center hover:bg-white/10 transition-colors group">
            <p className="text-gray-400 uppercase tracking-widest text-[9px] font-bold mb-1">CupCoins</p>
            <h2 className="text-2xl font-black text-amber-300 tabular-nums flex items-center justify-center gap-1">
              <Coins className="w-4 h-4" /> {(userData?.coins || 0).toLocaleString()}
            </h2>
            <span className="text-[9px] font-black text-fifa-neon uppercase opacity-0 group-hover:opacity-100 transition-opacity">+ Get more</span>
          </button>
        </div>

        {/* Streak flame + week dots */}
        <div className="glass-panel w-full p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-3xl ${streak > 0 ? 'animate-flame-flicker' : 'grayscale opacity-40'}`}>🔥</span>
            <div>
              <p className="font-black text-white leading-none">
                {streak > 0 ? `${streak}-day streak` : 'Start your streak!'}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                {streak > 0 ? `Reward at day ${nextMilestone}` : 'Play today to ignite it'}
                {(userData?.streakFreezes || 0) > 0 && <span className="text-sky-300 ml-1.5">🛡️×{userData.streakFreezes}</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {dots.map((d) => (
              <div
                key={d.day}
                title={d.day}
                className={`w-3.5 h-3.5 rounded-full border ${d.played ? 'bg-fifa-neon border-fifa-neon shadow-[0_0_6px_rgba(57,255,20,0.5)]' : d.isToday ? 'border-fifa-neon/60 border-dashed bg-transparent animate-pulse' : 'border-white/15 bg-white/5'}`}
              />
            ))}
          </div>
        </div>

        {/* VIP daily claim — a reason to open the app even after playing */}
        {userData?.vip && (
          <button
            onClick={vipClaimAvailable ? handleClaimVip : undefined}
            disabled={!vipClaimAvailable || claimingVip}
            className={`w-full p-4 mb-4 rounded-2xl border flex items-center justify-between transition-transform ${vipClaimAvailable ? 'bg-gradient-to-r from-yellow-300/15 to-amber-500/15 border-yellow-400/50 animate-pulse-gold hover:scale-[1.01] active:scale-[0.99]' : 'bg-white/5 border-white/10 opacity-70'}`}
          >
            <div className="flex items-center gap-3 text-left">
              <Star className="w-6 h-6 text-yellow-300" fill="currentColor" />
              <div>
                <p className="font-black text-white text-sm uppercase tracking-wide">Captain’s Club</p>
                <p className="text-[10px] font-bold text-gray-300">
                  {vipClaimAvailable ? 'Your daily Gold Pack is ready!' : 'Claimed — next pack at midnight UTC'}
                </p>
              </div>
            </div>
            {vipClaimAvailable && (
              <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-500 text-black text-xs font-black uppercase">
                {claimingVip ? '…' : 'Claim 🥇'}
              </span>
            )}
          </button>
        )}

        {/* Play / countdown */}
        {hasPlayedToday ? (
          <div className="w-full py-6 rounded-2xl bg-white/5 border border-white/10 text-center mb-4">
            <p className="text-gray-400 uppercase font-bold tracking-wider mb-2 text-xs">{t('Next Match in')}</p>
            <p className="text-4xl font-black text-white tabular-nums tracking-wider mb-3">{timeLeft}</p>
            <p className="text-[11px] font-bold text-fifa-neon uppercase tracking-widest">
              ⚽ Tomorrow: {tournament.live ? 'new questions + fresh Match Day Picks' : 'a brand new match'}
            </p>
          </div>
        ) : (
          <button
            onClick={onPlay}
            className="w-full py-5 mb-4 rounded-2xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-2xl uppercase tracking-wider transform transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_16px_rgba(57,255,20,0.12)]"
          >
            {t('Play Daily Match')}
          </button>
        )}

        {/* Unopened packs nudge */}
        {unopenedPacks > 0 && (
          <button
            onClick={() => onOpenPack((userData?.packLegendary || 0) > 0 ? 'legendary' : (userData?.packGold || 0) > 0 ? 'gold' : 'bronze')}
            className="w-full p-3.5 mb-4 rounded-2xl bg-fifa-neon/10 border border-fifa-neon/40 flex items-center justify-center gap-2 font-black text-fifa-neon uppercase tracking-wider text-sm hover:bg-fifa-neon/20 transition-colors"
          >
            <Gift className="w-5 h-5 animate-pack-wiggle" />
            {unopenedPacks} unopened pack{unopenedPacks === 1 ? '' : 's'} — rip now!
          </button>
        )}

        {/* Album + Store */}
        <div className="w-full grid grid-cols-2 gap-3 mb-4">
          <button onClick={onAlbum} className="glass-panel p-4 text-left hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-fifa-neon" />
              <span className="font-black text-white text-sm uppercase tracking-wide">Album</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-fifa-green to-fifa-neon rounded-full" style={{ width: `${album.percent}%` }} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 tabular-nums">{album.owned}/{album.total} stickers</span>
          </button>
          <button onClick={onStore} className="glass-panel p-4 text-left hover:bg-white/10 transition-colors relative overflow-hidden">
            <div className="absolute -right-3 -top-3 w-14 h-14 bg-red-500/20 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              <span className="font-black text-white text-sm uppercase tracking-wide">Store</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-red-400 uppercase tracking-wide">
              <Flame className="w-3 h-3" /> Deal: {deal.item.name} −{deal.percentOff}%
            </span>
          </button>
        </div>

        <button
          onClick={onPractice}
          className="w-full py-3.5 mb-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-base uppercase tracking-wider hover:bg-blue-500/20 transition-colors flex items-center justify-center"
        >
          <Target className="w-5 h-5 mr-2" />
          Practice Arena
        </button>

        <MatchDayPicksSection />
        <button
          onClick={handleCopyInvite}
          className="flex items-center justify-center text-sm font-bold text-gray-400 hover:text-fifa-neon transition-colors"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {copied ? "Link Copied!" : "Invite Friends"}
        </button>

      </div>

      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} userData={userData} />}
      {showTrophyCabinet && <TrophyCabinetModal onClose={() => setShowTrophyCabinet(false)} userData={userData} />}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} userData={userData} />}

      {showCountrySelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-fifa-dark w-full max-w-sm rounded-3xl border border-white/10 p-8 flex flex-col items-center">
            <h2 className="text-2xl font-black text-white mb-2 text-center uppercase">Choose Your Nation</h2>
            <p className="text-gray-400 text-sm text-center mb-8">Before you can play, you can optionally select the country you represent.</p>

            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full p-4 mb-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-fifa-green appearance-none"
            >
              <option value="" disabled className="text-gray-500">Select Country (Optional)</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code} className="text-black">
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => saveCountry(selectedCountry)}
              disabled={!selectedCountry}
              className={`w-full py-4 mb-3 rounded-xl font-black uppercase tracking-wider transition-colors ${selectedCountry ? 'bg-fifa-green text-black hover:bg-green-400' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            >
              Confirm
            </button>

            <button
              onClick={() => saveCountry('NONE')}
              className="w-full py-3 rounded-xl bg-transparent border border-white/10 text-gray-400 font-bold uppercase tracking-wider hover:bg-white/5 transition-colors"
            >
              No thanks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;

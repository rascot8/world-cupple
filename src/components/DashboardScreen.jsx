import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTodayUTCString } from '../utils/dailySeed';
import { getRankForFP } from '../utils/ranking';
import { auth, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Trophy, Settings, BarChart2, Info, Share2, Target, Award, Shield } from 'lucide-react';
import { COUNTRIES, getFlagForCountry } from '../utils/countries';
import RankModal from './RankModal';
import SettingsModal from './SettingsModal';
import TrophyCabinetModal from './TrophyCabinetModal';
import { useAudio } from '../contexts/AudioContext';
import BrandHeader from './BrandHeader';
import { seedFakeUsers } from '../utils/seedFakeUsers';

const DashboardScreen = ({ onPlay, onPractice, onLeaderboard, userData }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState('');
  const [showRankModal, setShowRankModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTrophyCabinet, setShowTrophyCabinet] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [copied, setCopied] = useState(false);

  // Temporarily disabled for testing
  const hasPlayedToday = false; // userData?.lastPlayedDate === getTodayUTCString();
  const rank = getRankForFP(userData?.fp || 0);

  useEffect(() => {
    if (userData && !userData.country) {
      setShowCountrySelect(true);
    } else {
      setShowCountrySelect(false);
    }
  }, [userData]);

  useEffect(() => {
    if (!localStorage.getItem('hasSeededFakeUsers')) {
      seedFakeUsers();
    }
  }, []);

  useEffect(() => {
    if (hasPlayedToday) {
      const interval = setInterval(() => {
        const now = new Date();
        const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const diff = tomorrow - now;

        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);

        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
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
      const link = `${window.location.origin}/?invite=${auth.currentUser.uid}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">

      
      <div className="absolute top-6 right-6 flex space-x-4">
        {userData?.isAdmin && (
          <button onClick={() => { window.location.href = '/admin'; }} title="Quiz Admin" className="text-fifa-neon hover:text-white transition-colors">
            <Shield className="w-6 h-6" />
          </button>
        )}
        <button onClick={() => setShowTrophyCabinet(true)} className="text-white hover:text-fifa-neon transition-colors">
          <Award className="w-6 h-6" />
        </button>
        <button onClick={() => setShowRankModal(true)} className="text-gray-400 hover:text-white transition-colors">
          <Info className="w-6 h-6" />
        </button>
        <button onClick={onLeaderboard} className="text-white hover:text-fifa-neon transition-colors">
          <BarChart2 className="w-6 h-6" />
        </button>
        <button onClick={() => setShowSettingsModal(true)} className="text-gray-400 hover:text-white transition-colors">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <BrandHeader isHero={true} />
        
        {userData?.country && userData.country !== 'NONE' && (
          <div className="mb-4 flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="text-xl">{getFlagForCountry(userData.country)}</span>
            <span className="text-sm font-bold text-gray-300">{userData.username || userData.email?.split('@')[0]}</span>
          </div>
        )}

        <div className="w-32 h-32 bg-white/5 rounded-full flex flex-col items-center justify-center mb-6 shadow-xl border border-white/10">
          <Trophy className={`w-12 h-12 ${rank.color} mb-2`} />
          <span className={`text-sm font-bold uppercase tracking-widest ${rank.color}`}>
            {rank.name}
          </span>
        </div>

        <div className="glass-panel p-8 w-full text-center mb-6">
          <p className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-1">{t('Football Points')}</p>
          <h2 className="text-6xl font-black text-gold-glow">
            {userData?.fp || 0}
          </h2>
        </div>

        <button 
          onClick={handleCopyInvite}
          className="mb-8 flex items-center justify-center text-sm font-bold text-gray-400 hover:text-fifa-neon transition-colors"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {copied ? "Link Copied!" : "Invite Friends"}
        </button>

        {hasPlayedToday ? (
          <div className="w-full py-8 rounded-2xl bg-white/5 border border-white/10 text-center mb-4">
            <p className="text-gray-400 uppercase font-bold tracking-wider mb-4">{t('Next Match in')}</p>
            <p className="text-4xl font-black text-white tabular-nums tracking-wider">{timeLeft}</p>
          </div>
        ) : (
          <button 
            onClick={onPlay}
            className="w-full py-5 mb-4 rounded-2xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-2xl uppercase tracking-wider transform transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(57,255,20,0.3)]"
          >
            {t('Play Daily Match')}
          </button>
        )}

        <button 
          onClick={onPractice}
          className="w-full py-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-lg uppercase tracking-wider hover:bg-blue-500/20 transition-colors flex items-center justify-center"
        >
          <Target className="w-5 h-5 mr-2" />
          Practice Arena
        </button>

      </div>

      {showRankModal && <RankModal onClose={() => setShowRankModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} userData={userData} />}
      {showTrophyCabinet && <TrophyCabinetModal onClose={() => setShowTrophyCabinet(false)} userData={userData} />}

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

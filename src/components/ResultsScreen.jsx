import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateDailyFPChange, getRankForFP } from '../utils/ranking';
import { Trophy, Info } from 'lucide-react';
import { getFlagForCountry } from '../utils/countries';
import RankModal from './RankModal';
import { useAudio } from '../contexts/AudioContext';
import BrandHeader from './BrandHeader';

const ResultsScreen = ({ score, total, totalFP, userData, onRestart }) => {
  const { t } = useTranslation();
  const { playGain, playLoss } = useAudio();
  const [showRankModal, setShowRankModal] = useState(false);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [showFloatingText, setShowFloatingText] = useState(false);
  const fpChange = calculateDailyFPChange(score);
  const newRank = getRankForFP(totalFP);
  const previousFP = totalFP - fpChange;
  
  const [animatedDailyFP, setAnimatedDailyFP] = useState(0);
  const [animatedTotalFP, setAnimatedTotalFP] = useState(previousFP);
  
  const minFP = newRank.min;
  const maxFP = newRank.max === Infinity ? newRank.min + 1000 : newRank.max;
  const range = maxFP - minFP;
  
  const clamp = (val) => Math.min(Math.max(val, 0), 100);
  const prevPercent = clamp(((previousFP - minFP) / range) * 100);
  const newPercent = clamp(((totalFP - minFP) / range) * 100);

  React.useEffect(() => {
    setAnimatedWidth(prevPercent);
    
    const timer = setTimeout(() => {
      setAnimatedWidth(newPercent);
      setShowFloatingText(true);
      if (fpChange > 0) {
        playGain();
      } else {
        playLoss();
      }

      let startTimestamp = null;
      const duration = 1500;
      
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setAnimatedDailyFP(Math.round(fpChange * easeOut));
        setAnimatedTotalFP(Math.round(previousFP + (fpChange * easeOut)));
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setAnimatedDailyFP(fpChange);
          setAnimatedTotalFP(totalFP);
        }
      };
      
      window.requestAnimationFrame(step);

    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMessage = () => {
    const percentage = score / total;
    if (percentage >= 0.9) return "World Class! 🏆";
    if (percentage >= 0.6) return "Solid Performance! ⚽";
    if (percentage >= 0.4) return "Average Match 🏃";
    return "Subbed off early... 🔄";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">


      <BrandHeader isHero={false} />

      <button onClick={() => setShowRankModal(true)} className="absolute top-6 right-6 z-10 text-gray-400 hover:text-white transition-colors">
        <Info className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md z-10 flex flex-col items-center text-center">
        {userData?.country && userData.country !== 'NONE' && (
          <div className="mb-4 flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="text-xl">{getFlagForCountry(userData.country)}</span>
            <span className="text-sm font-bold text-gray-300">{userData.email?.split('@')[0]}</span>
          </div>
        )}

        <div className="w-32 h-32 bg-white/5 rounded-full flex flex-col items-center justify-center mb-6 shadow-xl border border-white/10">
          <Trophy className={`w-12 h-12 ${newRank.color} mb-2`} />
          <span className={`text-sm font-bold uppercase tracking-widest ${newRank.color}`}>
            {newRank.name}
          </span>
        </div>

        <div className="w-full mt-4 mb-8 relative px-4">
          <div className="flex flex-col items-center justify-center mb-4">
            <span className="text-6xl font-black text-gold-glow tabular-nums">{animatedTotalFP}</span>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 relative z-10">
            <div 
              className={`h-full transition-all duration-[1500ms] ease-out rounded-full ${fpChange > 0 ? 'bg-gradient-to-r from-fifa-green to-fifa-neon animate-pulse-glow-green' : 'bg-red-500 animate-pulse-glow-red'}`}
              style={{ width: `${animatedWidth}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold tracking-widest uppercase relative">
            <span>{minFP} FP</span>
            <span>{maxFP === Infinity ? 'MAX' : `${maxFP} FP`}</span>
            
            <div className={`absolute top-1 left-1/2 -translate-x-1/2 font-black text-2xl z-20 transition-all duration-1000 ease-out pointer-events-none ${showFloatingText ? `translate-y-0 opacity-100 ${fpChange > 0 ? 'text-gold-glow' : 'text-red-500'}` : 'translate-y-[40px] opacity-0'}`}>
              {fpChange > 0 ? '+' : ''}{fpChange} FP
            </div>
          </div>
        </div>

        <h1 className="text-5xl font-black text-white mb-2 uppercase tracking-tight mt-4">
          {getMessage()}
        </h1>
        
        <div className="glass-panel px-8 py-6 my-6 w-full flex flex-col gap-4">
          <div>
            <p className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-1">{t('Score')}</p>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {score} <span className="text-2xl text-gray-500">/ {total}</span>
            </div>
          </div>

          <div className="h-px w-full bg-white/10"></div>

          <div className="flex justify-between items-center px-4">
            <div className="text-left">
              <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold mb-1">Daily +/-</p>
              <p className={`text-2xl font-black ${animatedDailyFP >= 0 ? 'text-gold-glow' : 'text-red-500'}`}>
                {animatedDailyFP > 0 ? '+' : ''}{animatedDailyFP} FP
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold mb-1">Rank</p>
              <p className={`text-xl font-black uppercase tracking-wider ${newRank.color}`}>
                {newRank.name}
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={onRestart}
          className="w-full py-5 rounded-2xl bg-white text-fifa-black font-black text-2xl uppercase tracking-wider transform transition-transform hover:scale-[1.02] active:scale-95"
        >
          {t('Back')}
        </button>
      </div>

      {showRankModal && <RankModal onClose={() => setShowRankModal(false)} />}
    </div>
  );
};

export default ResultsScreen;

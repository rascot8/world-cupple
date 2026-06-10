import React, { useState } from 'react';
import { X, Share2, Lock } from 'lucide-react';
import { BADGES, TIERS } from '../utils/achievements';

const BadgeDetailModal = ({ badge, isUnlocked, onClose }) => {
  const handleShare = async () => {
    const text = `I just unlocked the "${badge.name}" badge in TRIVIA WORLD CUP 2026! Can you beat my rank? Play here: ${window.location.origin}${import.meta.env.BASE_URL}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Trivia World Cup 2026',
          text: text,
          url: `${window.location.origin}${import.meta.env.BASE_URL}`,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      // Fallback to Twitter
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const tierInfo = TIERS[badge.tier];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-fifa-dark w-full max-w-sm rounded-3xl border border-white/10 p-8 flex flex-col items-center relative animate-float-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 relative
          ${isUnlocked ? `bg-gradient-to-br ${tierInfo.color} ${tierInfo.shadow} shadow-[0_0_40px_rgba(255,255,255,0.2)]` : 'bg-gray-800 border-2 border-gray-600'}
        `}>
          {!isUnlocked && <Lock className="w-12 h-12 text-gray-500" />}
          {isUnlocked && <div className="absolute inset-1 rounded-full border-2 border-white/30" />}
        </div>

        <h2 className="text-2xl font-black text-white mb-2 text-center uppercase tracking-wider">{badge.name}</h2>
        <p className={`text-xs font-bold uppercase tracking-widest mb-6 ${isUnlocked ? 'text-fifa-neon' : 'text-gray-500'}`}>
          {isUnlocked ? `${tierInfo.name} Tier` : 'Locked'}
        </p>
        
        <p className="text-gray-300 text-center text-sm leading-relaxed mb-8">
          {badge.description}
        </p>

        {isUnlocked ? (
          <button 
            onClick={handleShare}
            className="w-full py-4 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] font-bold uppercase tracking-wider hover:bg-[#1DA1F2]/20 transition-colors flex items-center justify-center"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Achievement
          </button>
        ) : (
          <div className="w-full py-4 rounded-xl bg-white/5 text-gray-500 font-bold uppercase tracking-wider text-center text-sm">
            Keep playing to unlock
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeDetailModal;

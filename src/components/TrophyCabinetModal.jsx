import React, { useState } from 'react';
import { X, Award, Check, Loader2, Coins } from 'lucide-react';
import { BADGES, TIERS, getBadgeProgress } from '../utils/achievements';
import { claimBadgeReward } from '../utils/economyService';
import { auth } from '../config/firebase';

const TrophyCabinetModal = ({ onClose, userData, onUpdateUser }) => {
  const [claimingId, setClaimingId] = useState(null);
  
  const unlockedBadges = userData?.badges || [];
  const claimedBadges = userData?.claimedBadges || [];

  const handleClaim = async (badgeId) => {
    if (!auth.currentUser) return;
    setClaimingId(badgeId);
    try {
      const partial = await claimBadgeReward(auth.currentUser.uid, userData, badgeId);
      onUpdateUser(partial);
      new Audio('/audio/purchase.mp3').play().catch(() => {});
    } catch (e) {
      console.error(e);
      alert('Failed to claim reward. Try again later.');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-fifa-dark w-full max-w-2xl h-[85vh] rounded-3xl border border-white/10 flex flex-col relative overflow-hidden animate-float-up">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-fifa-neon" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Quests & Achievements</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="mb-6 flex justify-between items-center px-2">
            <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Progress</span>
            <span className="text-fifa-neon font-black text-xl">{unlockedBadges.length} / {BADGES.length}</span>
          </div>

          <div className="space-y-4">
            {BADGES.map(badge => {
              const tierInfo = TIERS[badge.tier];
              const progress = getBadgeProgress(userData, badge.id);
              const isClaimed = claimedBadges.includes(badge.id);
              const canClaim = progress.isComplete && !isClaimed;
              const percent = Math.min(100, Math.round((progress.current / progress.max) * 100));

              return (
                <div key={badge.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  
                  {/* Icon */}
                  <div className={`shrink-0 w-16 h-16 rounded-full flex items-center justify-center
                    ${progress.isComplete 
                      ? `bg-gradient-to-br ${tierInfo.color} ${tierInfo.shadow} shadow-[0_0_10px_rgba(255,255,255,0.05)] border border-white/20` 
                      : 'bg-gray-800 border border-gray-600 grayscale opacity-50'}
                  `}>
                    <Award className={`w-8 h-8 ${progress.isComplete ? 'text-white' : 'text-gray-500'}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-lg font-black uppercase tracking-wider truncate ${progress.isComplete ? 'text-white' : 'text-gray-400'}`}>
                        {badge.name}
                      </h3>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider
                        ${progress.isComplete ? 'border-fifa-neon/30 text-fifa-neon bg-fifa-neon/10' : 'border-gray-500/30 text-gray-400 bg-gray-500/10'}`}>
                        {tierInfo.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold mb-3">{badge.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-black/50 rounded-full h-2 mb-1 overflow-hidden border border-white/5 relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${progress.isComplete ? `bg-gradient-to-r ${tierInfo.color}` : 'bg-fifa-green'}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <span>{progress.current} / {progress.max}</span>
                      <span>{percent}%</span>
                    </div>
                  </div>

                  {/* Reward Action */}
                  <div className="shrink-0 flex flex-col items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-none border-white/10">
                    <div className="flex items-center gap-1 mb-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-black text-amber-400">{tierInfo.rewardCP}</span>
                    </div>
                    
                    {isClaimed ? (
                      <div className="flex items-center gap-1 text-fifa-green bg-fifa-green/10 px-3 py-1.5 rounded-lg border border-fifa-green/30">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider">Completed</span>
                      </div>
                    ) : canClaim ? (
                      <button
                        onClick={() => handleClaim(badge.id)}
                        disabled={claimingId === badge.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-fifa-neon text-black font-black text-xs uppercase tracking-wider hover:bg-fifa-green hover:shadow-[0_0_15px_rgba(224,242,50,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {claimingId === badge.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim Reward'}
                      </button>
                    ) : (
                      <button disabled className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white/5 text-gray-500 font-black text-xs uppercase tracking-wider border border-white/10 cursor-not-allowed">
                        Locked
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrophyCabinetModal;

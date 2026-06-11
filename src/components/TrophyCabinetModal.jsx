import React, { useState } from 'react';
import { X, Lock, Award } from 'lucide-react';
import { BADGES, TIERS } from '../utils/achievements';
import BadgeDetailModal from './BadgeDetailModal';

const TrophyCabinetModal = ({ onClose, userData }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const unlockedBadges = userData?.badges || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-fifa-dark w-full max-w-2xl h-[80vh] rounded-3xl border border-white/10 flex flex-col relative overflow-hidden animate-float-up">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-fifa-neon" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Trophy Cabinet</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="mb-6 flex justify-between items-center px-2">
            <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Progress</span>
            <span className="text-fifa-neon font-black text-xl">{unlockedBadges.length} / {BADGES.length}</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {BADGES.map(badge => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              const tierInfo = TIERS[badge.tier];

              return (
                <div 
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all duration-300 transform group-hover:scale-110
                    ${isUnlocked 
                      ? `bg-gradient-to-br ${tierInfo.color} ${tierInfo.shadow} shadow-[0_0_6px_rgba(255,255,255,0.04)] border border-white/20` 
                      : 'bg-gray-800 border-2 border-gray-600 grayscale opacity-70'}
                  `}>
                    {!isUnlocked && <Lock className="w-6 h-6 text-gray-500" />}
                    {isUnlocked && <div className="absolute inset-1 rounded-full border border-white/30" />}
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight uppercase tracking-wider ${isUnlocked ? 'text-gray-200' : 'text-gray-600'}`}>
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedBadge && (
        <BadgeDetailModal 
          badge={selectedBadge} 
          isUnlocked={unlockedBadges.includes(selectedBadge.id)} 
          onClose={() => setSelectedBadge(null)} 
        />
      )}
    </div>
  );
};

export default TrophyCabinetModal;

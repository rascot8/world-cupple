import React, { useState, useEffect } from 'react';
import { X, Globe2, Trophy, Flame } from 'lucide-react';

const WelcomeModal = ({ onClose, forceShow = false }) => {
  const [isVisible, setIsVisible] = useState(forceShow);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
    } else if (localStorage.getItem('hasSeenWelcome') !== 'true') {
      setIsVisible(true);
    }
  }, [forceShow]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleDoNotShowAgain = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-fifa-dark w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-float-up max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-gradient-to-r from-fifa-green/20 to-transparent">
          <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center">
            <Globe2 className="w-6 h-6 mr-3 text-fifa-neon" />
            Welcome to World Cupple!
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-gray-300 font-medium leading-relaxed">
            Welcome to <strong className="text-white">World Cupple</strong> — the ultimate daily trivia game for football fans around the globe!
          </p>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-lg mr-4 mt-1">
                <Flame className="w-5 h-5 text-gold-glow" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-1">One Match A Day</h3>
                <p className="text-sm text-gray-400">You get 10 questions every 24 hours. Make them count!</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-lg mr-4 mt-1">
                <Trophy className="w-5 h-5 text-fifa-neon" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-1">Climb the Ranks</h3>
                <p className="text-sm text-gray-400">Scoring high earns Football Points (FP) to rank up, while scoring low loses FP.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-lg mr-4 mt-1">
                <span className="text-lg leading-none">📔</span>
              </div>
              <div>
                <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-1">Fill the Legends Album</h3>
                <p className="text-sm text-gray-400">Every match earns a free sticker pack. Collect all 64 legends, moments and stars of ’26.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-lg mr-4 mt-1">
                <Globe2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-1">Build Your Legacy</h3>
                <p className="text-sm text-gray-400">Dominate global leaderboards, unlock exclusive badges, and keep your daily streak alive.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-300/10 to-amber-500/10 border border-yellow-400/40 text-center">
            <p className="text-sm font-black text-yellow-300 uppercase tracking-wider mb-1">🎁 Welcome Gift</p>
            <p className="text-xs text-gray-300 font-bold">100 CupCoins + 1 Bronze Pack are waiting in your account!</p>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 space-y-3">
          <button 
            onClick={handleClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Let’s Kick Off!
          </button>
          <button 
            onClick={handleDoNotShowAgain}
            className="w-full py-3 rounded-xl bg-transparent border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-wider hover:bg-white/5 transition-colors"
          >
            Do not show again
          </button>
        </div>

      </div>
    </div>
  );
};

export default WelcomeModal;

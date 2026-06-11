import React, { useState } from 'react';
import { Share2, X, Heart } from 'lucide-react';

const SharePromptModal = ({ onClose, score, total }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `I just scored ${score}/${total} in WORLD CUPPLE! Can you beat my score? Play here: ${window.location.origin}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'World Cupple',
          text: text,
          url: window.location.origin,
        });
        onClose();
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback for desktop/unsupported browsers
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-fifa-dark w-full max-w-sm rounded-3xl border border-white/10 p-6 relative shadow-2xl flex flex-col items-center text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
          <Heart className="w-8 h-8 text-red-500" fill="currentColor" />
        </div>

        <h2 className="text-2xl font-black text-white mb-2 uppercase">Enjoying the Game?</h2>
        <p className="text-gray-400 text-sm mb-6">
          Challenge your friends to beat your score of <span className="font-bold text-white">{score}/{total}</span>!
        </p>

        <button 
          onClick={handleShare}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center mb-3 shadow-[0_0_8px_rgba(57,255,20,0.08)]"
        >
          <Share2 className="w-5 h-5 mr-2" />
          {copied ? "Link Copied!" : "Share with Friends"}
        </button>
        
        <button 
          onClick={onClose}
          className="text-gray-500 text-xs uppercase font-bold tracking-widest hover:text-white transition-colors py-2"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default SharePromptModal;

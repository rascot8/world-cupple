import React, { useEffect, useRef, useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import BrandHeader from './BrandHeader';

const KickoffScreen = ({ onFinish, theme }) => {
  const [countdown, setCountdown] = useState(10);
  const { playWhistle } = useAudio();
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  useEffect(() => {
    // We already play the audio via AudioContext when gameState becomes 'kickoff_*'
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 2) {
          playWhistle();
        }
        if (prev <= 1) {
          clearInterval(timer);
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <BrandHeader isHero={true} />

      <div className="flex flex-col items-center justify-center z-10 animate-float-up">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fifa-green to-fifa-neon uppercase tracking-widest mb-8 drop-shadow-[0_0_6px_rgba(57,255,20,0.2)]">
          Get Ready!
        </h1>

        <div className="w-32 h-32 rounded-full border-4 border-fifa-neon flex items-center justify-center bg-black/80 shadow-[0_0_12px_rgba(57,255,20,0.16)]">
          <span className="text-6xl font-black text-white">{countdown}</span>
        </div>

        <p className="mt-8 text-xl font-bold text-gray-300 uppercase tracking-widest animate-pulse">
          Match Starting...
        </p>

        {theme && (
          <p className="mt-3 max-w-xs text-center text-sm font-bold text-fifa-neon/90">
            🏟️ Today’s theme: {theme}
          </p>
        )}

        <button
          onClick={() => { playWhistle(); finish(); }}
          className="mt-6 text-gray-500 font-bold text-sm uppercase tracking-widest hover:text-white transition-colors"
        >
          Skip →
        </button>
      </div>
    </div>
  );
};

export default KickoffScreen;

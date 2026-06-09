import React, { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import BrandHeader from './BrandHeader';
import { X } from 'lucide-react';
import QuitModal from './QuitModal';

const GameScreen = ({ question, currentIndex, total, onAnswer, onForfeit, t }) => {
  const { playCorrect, playWrong } = useAudio();
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showQuitModal, setShowQuitModal] = useState(false);

  useEffect(() => {
    // Randomize options
    const rawOptions = [
      question['Option A'],
      question['Option B'],
      question['Option C']
    ];
    // Fisher-Yates shuffle
    for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
    }
    setOptions(rawOptions);
    setSelectedOption(null);
    setTimeLeft(15);
    setIsPaused(false);
  }, [question]);

  useEffect(() => {
    if (timeLeft > 0 && !isPaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isPaused) {
      handleTimeOut();
    }
  }, [timeLeft, isPaused]);

  const handleTimeOut = () => {
    setIsPaused(true);
    setTimeout(() => {
      onAnswer(false);
    }, 2000);
  };

  const handleOptionClick = (opt) => {
    if (isPaused) return; // Prevent multiple clicks
    
    setIsPaused(true);
    setSelectedOption(opt);
    
    const isCorrect = opt === question['Correct Answer'];
    
    if (isCorrect) {
      playCorrect();
      setStreak(prev => prev + 1);
    } else {
      playWrong();
      setStreak(0);
    }
    
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 2000);
  };

  const getOptionClass = (opt) => {
    if (!isPaused) return 'bg-white/10 hover:bg-white/20 border-white/20';
    
    if (opt === question['Correct Answer']) {
      return 'bg-green-500 text-white border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]';
    }
    
    if (opt === selectedOption && opt !== question['Correct Answer']) {
      return 'bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    }

    return 'bg-white/5 border-white/10 opacity-50';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow removed, handled by DancingBackground globally */}

      <BrandHeader isHero={false} />
      
      <button 
        onClick={() => { setIsPaused(true); setShowQuitModal(true); }}
        className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors p-2"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md z-10 flex flex-col h-full pt-16">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8 pt-4">
          <div className="flex space-x-2">
            <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md flex items-center">
              <span className="text-gray-300 font-bold text-sm uppercase tracking-wider">
                {t('Question')} {currentIndex + 1} {t('of')} {total}
              </span>
            </div>
            {streak > 0 && (
              <div className={`px-4 py-2 rounded-full font-black flex items-center ${streak >= 3 ? 'bg-orange-500 text-white animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 'bg-white/10 text-orange-400'}`}>
                🔥 Streak: {streak}
              </div>
            )}
          </div>
          <div className="text-fifa-neon font-black text-2xl">
            {timeLeft}s
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-2 bg-white/10 rounded-full mb-10 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-fifa-green to-fifa-neon transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          ></div>
        </div>

        {/* Question Area */}
        <div className="flex-grow flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-white leading-tight">
              {question.Question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-4 mt-8">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(opt)}
                disabled={isPaused}
                className={`w-full p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all duration-300 transform active:scale-[0.98] ${getOptionClass(opt)}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showQuitModal && (
        <QuitModal 
          onConfirm={onForfeit}
          onCancel={() => { setShowQuitModal(false); setIsPaused(false); }}
        />
      )}
    </div>
  );
};

export default GameScreen;

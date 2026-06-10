import React, { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import BrandHeader from './BrandHeader';
import { X } from 'lucide-react';
import QuitModal from './QuitModal';

// question: { id, text, options } — the correct answer is NOT in this object.
// It only becomes known via onSubmitAnswer, after the pick is locked in server-side.
const GameScreen = ({ question, currentIndex, total, onSubmitAnswer, onAnswer, onForfeit, t }) => {
  const { playCorrect, playWrong } = useAudio();
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showQuitModal, setShowQuitModal] = useState(false);

  useEffect(() => {
    // Randomize options
    const rawOptions = [...(question.options || [])];
    // Fisher-Yates shuffle
    for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
    }
    setOptions(rawOptions);
    setSelectedOption(null);
    setCorrectAnswer(null);
    setTimeLeft(15);
    setIsPaused(false);
  }, [question]);

  useEffect(() => {
    if (timeLeft > 0 && !isPaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isPaused) {
      submitAndReveal(null);
    }
  }, [timeLeft, isPaused]);

  // Lock in the choice (null on timeout), then reveal the answer the server sends back
  const submitAndReveal = async (choice) => {
    if (isPaused) return;

    setIsPaused(true);
    setSelectedOption(choice);

    let correct = null;
    try {
      correct = await onSubmitAnswer(question.id, choice);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
    setCorrectAnswer(correct);

    const isCorrect = choice !== null && choice === correct;

    if (isCorrect) {
      playCorrect();
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak >= 7) {
          window.dispatchEvent(new CustomEvent('streak-fire', { detail: { streak: newStreak } }));
        }
        return newStreak;
      });
    } else {
      playWrong();
      setStreak(0);
    }

    setTimeout(() => {
      onAnswer(isCorrect, { fastAnswer: timeLeft >= 12 });
    }, 2000);
  };

  const getOptionClass = (opt) => {
    if (!isPaused) return 'bg-white/10 hover:bg-white/20 border-white/20';

    // Submitted, waiting for the server to reveal the answer
    if (!correctAnswer) {
      if (opt === selectedOption) {
        return 'bg-white/20 border-fifa-neon animate-pulse';
      }
      return 'bg-white/5 border-white/10 opacity-50';
    }

    if (opt === correctAnswer) {
      return 'bg-green-500 text-white border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]';
    }

    if (opt === selectedOption && opt !== correctAnswer) {
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
              <div 
                className={`px-4 py-2 rounded-full font-black flex items-center transition-all duration-300 ${
                  streak >= 7 
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white animate-shake-fire scale-125 shadow-[0_0_30px_rgba(239,68,68,0.8)] ml-4 border-2 border-yellow-300' 
                    : streak >= 3 
                      ? 'bg-orange-500 text-white animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.6)]' 
                      : 'bg-white/10 text-orange-400'
                }`}
              >
                🔥 {streak >= 7 ? 'ON FIRE!' : 'Streak:'} {streak}
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
              {question.text}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-4 mt-8">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => submitAndReveal(opt)}
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

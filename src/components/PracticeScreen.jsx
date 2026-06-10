import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { loadTriviaData } from '../utils/csvParser';
import { ArrowLeft, X } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import BrandHeader from './BrandHeader';
import QuitModal from './QuitModal';

const PracticeScreen = ({ onExit }) => {
  const { t } = useTranslation();
  const { playCorrect, playWrong } = useAudio();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);

  const [practiceStreak, setPracticeStreak] = useState(0);

  useEffect(() => {
    const initData = async () => {
      const data = await loadTriviaData();
      const validQs = data.filter(q => q.Question && q['Correct Answer']);
      setQuestions(validQs);
      pickRandomQuestion(validQs);
    };
    initData();
  }, []);

  const pickRandomQuestion = (qArray) => {
    if (qArray.length === 0) return;
    const randomIndex = Math.floor(Math.random() * qArray.length);
    const q = qArray[randomIndex];
    setCurrentQuestion(q);

    // Randomize options
    const rawOptions = [q['Option A'], q['Option B'], q['Option C']];
    for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
    }
    setOptions(rawOptions);
    setSelectedOption(null);
    setIsPaused(false);
  };

  const handleOptionClick = (opt) => {
    if (isPaused) return;
    
    setIsPaused(true);
    setSelectedOption(opt);
    
    const isCorrect = opt === currentQuestion['Correct Answer'];
    
    if (isCorrect) {
      playCorrect();
      setPracticeStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak >= 7) {
          window.dispatchEvent(new CustomEvent('streak-fire', { detail: { streak: newStreak } }));
        }
        return newStreak;
      });
    } else {
      playWrong();
      setPracticeStreak(0);
    }

    setTimeout(() => {
      pickRandomQuestion(questions);
    }, 1500);
  };

  const getOptionClass = (opt) => {
    if (!isPaused) return 'bg-white/10 hover:bg-white/20 border-white/20';
    
    if (opt === currentQuestion['Correct Answer']) {
      return 'bg-green-500 text-white border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]';
    }
    
    if (opt === selectedOption && opt !== currentQuestion['Correct Answer']) {
      return 'bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    }

    return 'bg-white/5 border-white/10 opacity-50';
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center text-fifa-neon font-bold">
        Warming up...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">


      <BrandHeader isHero={false} />

      <div className="absolute top-16 left-6 z-10 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-500/30">
        Practice Mode - Unranked
      </div>

      <button 
        onClick={() => setShowQuitModal(true)} 
        className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors p-2"
      >
        <X className="w-6 h-6" /> 
      </button>

      <div className="w-full max-w-md z-10 flex flex-col h-full mt-20">
        
        <div className="flex justify-between items-center mb-8">
          <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
             <span className="text-gray-300 font-bold text-sm uppercase tracking-wider">
              {currentQuestion.Category}
            </span>
          </div>
          
          {practiceStreak > 0 && (
             <div 
               className={`px-4 py-2 rounded-full font-black flex items-center transition-all duration-300 ${
                 practiceStreak >= 7 
                   ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white animate-shake-fire scale-125 shadow-[0_0_30px_rgba(239,68,68,0.8)] ml-4 border-2 border-yellow-300' 
                   : practiceStreak >= 5 
                     ? 'bg-orange-500 text-white animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.6)]' 
                     : 'bg-white/10 text-orange-400'
               }`}
             >
               🔥 {practiceStreak >= 7 ? 'ON FIRE!' : 'Streak:'} {practiceStreak}
             </div>
          )}
        </div>

        <div className="flex-grow flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-white leading-tight">
              {currentQuestion.Question}
            </h2>
          </div>

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
          isPractice={true}
          onConfirm={onExit}
          onCancel={() => setShowQuitModal(false)}
        />
      )}
    </div>
  );
};

export default PracticeScreen;

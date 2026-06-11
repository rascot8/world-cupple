import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../contexts/AudioContext';
import BrandHeader from './BrandHeader';
import { X, Tv } from 'lucide-react';
import QuitModal from './QuitModal';

// question: { id, text, options } — the correct answer is NOT in this object.
// It only becomes known via onSubmitAnswer, after the pick is locked in server-side.
//
// VAR Review: after a wrong answer, a player holding a VAR token may overturn
// the call (once per match) — the answer then counts as correct. Tokens come
// from the store; this is the mid-match monetization hook.
const VAR_DECISION_SECONDS = 7;

const GameScreen = ({ question, currentIndex, total, onSubmitAnswer, onAnswer, onForfeit, varTokens = 0, varUsed = false, onUseVar, t, currentStreak = 0 }) => {
  const { playCorrect, playWrong, playGain } = useAudio();
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(currentStreak);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [varPrompt, setVarPrompt] = useState(false);
  const [varCountdown, setVarCountdown] = useState(VAR_DECISION_SECONDS);
  const [overturned, setOverturned] = useState(false);
  const varDecidedRef = useRef(false);
  const submittedRef = useRef(false); // one submission per question, ever

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
    setVarPrompt(false);
    setOverturned(false);
    varDecidedRef.current = false;
    submittedRef.current = false;
    setStreak(currentStreak);
  }, [question, currentStreak]);

  useEffect(() => {
    if (timeLeft > 0 && !isPaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isPaused) {
      submitAndReveal(null);
    }
  }, [timeLeft, isPaused]);

  // VAR decision window: accept the call automatically when it expires.
  useEffect(() => {
    if (!varPrompt) return;
    setVarCountdown(VAR_DECISION_SECONDS);
    const tick = setInterval(() => {
      setVarCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          acceptCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varPrompt]);

  const advance = (isCorrect, fastAnswer, delay = 2000) => {
    setTimeout(() => {
      onAnswer(isCorrect, { fastAnswer });
    }, delay);
  };

  // Lock in the choice (null on timeout), then reveal the answer the server sends back
  const submitAndReveal = async (choice) => {
    if (isPaused || submittedRef.current) return;

    submittedRef.current = true;
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
    const fastAnswer = timeLeft >= 12;

    if (isCorrect) {
      playCorrect();
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak >= 7) {
          window.dispatchEvent(new CustomEvent('streak-fire', { detail: { streak: newStreak } }));
        }
        return newStreak;
      });
      advance(true, fastAnswer);
      return;
    }

    playWrong();
    setStreak(0);

    // Wrong call — offer the VAR review if the player can afford the drama.
    if (choice !== null && !varUsed && varTokens > 0 && onUseVar) {
      setTimeout(() => setVarPrompt(true), 900);
    } else {
      advance(false, false);
    }
  };

  const acceptCall = () => {
    if (varDecidedRef.current) return;
    varDecidedRef.current = true;
    setVarPrompt(false);
    advance(false, false, 800);
  };

  const overturnCall = async () => {
    if (varDecidedRef.current) return;
    varDecidedRef.current = true;
    try {
      await onUseVar(question.id);
      setVarPrompt(false);
      setOverturned(true);
      playGain();
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak >= 7) {
          window.dispatchEvent(new CustomEvent('streak-fire', { detail: { streak: newStreak } }));
        }
        return newStreak;
      });
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 50 } }));
      advance(true, false, 1800);
    } catch (error) {
      console.error('VAR failed:', error);
      varDecidedRef.current = false;
      acceptCall();
    }
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

    // After an overturn, the player's pick is the one ruled correct.
    if (overturned) {
      if (opt === selectedOption) {
        return 'bg-green-500 text-white border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.2)]';
      }
      if (opt === correctAnswer) {
        return 'bg-white/5 border-fifa-neon/40 opacity-70';
      }
      return 'bg-white/5 border-white/10 opacity-50';
    }

    if (opt === correctAnswer) {
      return 'bg-green-500 text-white border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.2)]';
    }

    if (opt === selectedOption && opt !== correctAnswer) {
      return 'bg-red-500 text-white border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]';
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
            {varTokens > 0 && !varUsed && (
              <div className="px-3 py-2 rounded-full bg-sky-500/15 border border-sky-400/40 flex items-center gap-1.5" title="VAR Review available">
                <Tv className="w-4 h-4 text-sky-300" />
                <span className="text-sky-300 font-black text-xs tabular-nums">×{varTokens}</span>
              </div>
            )}
            {streak > 0 && (
              <div
                className={`px-4 py-2 rounded-full font-black flex items-center transition-all duration-300 ${
                  streak >= 7
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white animate-shake-fire scale-125 shadow-[0_0_12px_rgba(239,68,68,0.32)] ml-4 border-2 border-yellow-300'
                    : streak >= 3
                      ? 'bg-orange-500 text-white animate-pulse shadow-[0_0_6px_rgba(249,115,22,0.24)]'
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
                className={`relative w-full p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all duration-300 transform active:scale-[0.98] ${getOptionClass(opt)}`}
              >
                {opt}
                {overturned && opt === selectedOption && (
                  <span className="absolute -top-2.5 right-3 bg-sky-400 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded rotate-2 shadow-lg">
                    📺 Overturned
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ——— VAR Review overlay ——— */}
      {varPrompt && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel border-sky-400/50 p-7 text-center animate-float-up">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400" />
              </span>
              <p className="text-sky-300 font-black uppercase tracking-[0.3em] text-xs">VAR Review</p>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-2">Checking the call…</h3>
            <p className="text-sm text-gray-300 font-medium mb-5">
              The referee is at the monitor. Spend <span className="text-sky-300 font-black">1 VAR Token</span> to
              overturn the decision and keep your point?
            </p>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-sky-400 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(varCountdown / VAR_DECISION_SECONDS) * 100}%` }}
              />
            </div>
            <button
              onClick={overturnCall}
              className="w-full py-4 mb-3 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-300 text-black font-black text-lg uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Tv className="w-5 h-5" /> Overturn it! (×{varTokens})
            </button>
            <button onClick={acceptCall} className="w-full py-3 text-gray-400 font-bold uppercase tracking-wider text-sm hover:text-white transition-colors">
              Accept the call ({varCountdown}s)
            </button>
          </div>
        </div>
      )}

      {showQuitModal && (
        <QuitModal
          onConfirm={onForfeit}
          onCancel={() => { setShowQuitModal(false); if (!submittedRef.current) setIsPaused(false); }}
        />
      )}
    </div>
  );
};

export default GameScreen;

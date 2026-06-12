import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import BrandHeader from '../BrandHeader';
import QuitModal from '../QuitModal';
import { fetchCorrectAnswer } from '../../utils/quizService';
import { gradeRound } from '../../utils/grading';
import { getRoundType, roundTimerSeconds } from '../../utils/roundTypes';
import { X, Tv, Search, Clock, Zap } from 'lucide-react';

// Shared chrome + state machine for every timed round type. The per-type
// component (rendered via the `children` render prop) owns only the question
// area and how a choice is built; locking, reveal, grading, the timer, VAR
// and consumables all live here so each new round type stays tiny.
//
// children({ question, locked, answer, choice, score, overturned, submit,
//            timeLeft, eliminated })
//   - submit(choiceString) locks the round (null = timeout)
//   - answer is the revealed questionAnswers doc (null until revealed)
//   - score is the graded 0..1 result for the reveal UI
const VAR_DECISION_SECONDS = 7;

const RoundShell = ({ question, currentIndex, total, onSubmitAnswer, onAnswer, onForfeit, varTokens = 0, varUsed = false, onUseVar, hints = 0, extraTime = 0, freeKicks = 0, onUseConsumable, t, currentStreak = 0, children }) => {
  const { playCorrect, playWrong, playGain } = useAudio();
  const roundType = getRoundType(question.type);
  const duration = roundTimerSeconds(question);

  const [choice, setChoice] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [score, setScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(currentStreak);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [varPrompt, setVarPrompt] = useState(false);
  const [varCountdown, setVarCountdown] = useState(VAR_DECISION_SECONDS);
  const [overturned, setOverturned] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [eliminated, setEliminated] = useState([]);
  const [extraTimeUsed, setExtraTimeUsed] = useState(false);
  const [freeKickUsed, setFreeKickUsed] = useState(false);
  const varDecidedRef = useRef(false);
  const submittedRef = useRef(false); // one submission per round, ever
  const freeKickRef = useRef(false);

  useEffect(() => {
    setChoice(null);
    setAnswer(null);
    setScore(null);
    setTimeLeft(roundTimerSeconds(question));
    setIsPaused(false);
    setVarPrompt(false);
    setOverturned(false);
    varDecidedRef.current = false;
    submittedRef.current = false;
    freeKickRef.current = false;
    setHintUsed(false);
    setEliminated([]);
    setExtraTimeUsed(false);
    setFreeKickUsed(false);
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

  const advance = (roundScore, fastAnswer, delay = 2200) => {
    setTimeout(() => {
      onAnswer(roundScore, { fastAnswer });
    }, delay);
  };

  // Lock in the choice (null on timeout), reveal the answer doc, grade it.
  const submitAndReveal = async (rawChoice) => {
    if (isPaused || submittedRef.current) return;

    submittedRef.current = true;
    setIsPaused(true);
    setChoice(rawChoice);

    let answerDoc = null;
    try {
      answerDoc = await onSubmitAnswer(question.id, rawChoice);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
    setAnswer(answerDoc);

    // A Free Kick wins the round outright, whatever was (not) answered.
    const roundScore = freeKickRef.current
      ? 1
      : gradeRound(question.type, rawChoice ?? '', answerDoc);
    setScore(roundScore);

    const isCorrect = roundScore >= 0.5;
    const fastAnswer = timeLeft >= duration - 3;

    if (isCorrect) {
      playCorrect();
      setStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak >= 7) {
          window.dispatchEvent(new CustomEvent('streak-fire', { detail: { streak: newStreak } }));
        }
        return newStreak;
      });
      advance(roundScore, fastAnswer);
      return;
    }

    playWrong();
    setStreak(0);

    // Wrong call — offer the VAR review if the player can afford the drama.
    if (rawChoice !== null && !varUsed && varTokens > 0 && onUseVar) {
      setTimeout(() => setVarPrompt(true), 900);
    } else {
      advance(roundScore, false);
    }
  };

  const acceptCall = () => {
    if (varDecidedRef.current) return;
    varDecidedRef.current = true;
    setVarPrompt(false);
    advance(score ?? 0, false, 800);
  };

  const overturnCall = async () => {
    if (varDecidedRef.current) return;
    varDecidedRef.current = true;
    try {
      await onUseVar(question.id);
      setVarPrompt(false);
      setOverturned(true);
      setScore(1);
      playGain();
      setStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak >= 7) {
          window.dispatchEvent(new CustomEvent('streak-fire', { detail: { streak: newStreak } }));
        }
        return newStreak;
      });
      window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 50 } }));
      advance(1, false, 1800);
    } catch (error) {
      console.error('VAR failed:', error);
      varDecidedRef.current = false;
      acceptCall();
    }
  };

  // Scout: eliminate one wrong option. Seeded/admin content carries a
  // known-wrong option in payload.eliminate; legacy standard questions fall
  // back to peeking at the answer (practice-pool questions only, per rules).
  const hintApplies = roundType.optionBased;
  const handleHint = async () => {
    if (hints > 0 && !hintUsed && !isPaused && onUseConsumable && hintApplies) {
      try {
        await onUseConsumable('hints');
        setHintUsed(true);
        playGain();
        window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 20 } }));

        let toElim = question.payload?.eliminate;
        if (!toElim) {
          const correct = await fetchCorrectAnswer(question.id);
          const options = roundType.optionsOf(question) || [];
          const incorrects = options.filter((o) => o !== correct && !eliminated.includes(o));
          toElim = incorrects[Math.floor(Math.random() * incorrects.length)];
        }
        if (toElim) setEliminated((prev) => [...prev, toElim]);
      } catch (error) {
        console.error('Hint failed:', error);
      }
    }
  };

  const handleExtraTime = async () => {
    if (extraTime > 0 && !extraTimeUsed && !isPaused && onUseConsumable) {
      try {
        await onUseConsumable('extraTime');
        setExtraTimeUsed(true);
        setTimeLeft((prev) => prev + 10);
        playGain();
        window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 20 } }));
      } catch (error) {
        console.error('Extra time failed:', error);
      }
    }
  };

  // Free Kick: the round is ruled in the player's favour — no peeking at the
  // answer needed, so it works for every round type.
  const handleFreeKick = async () => {
    if (freeKicks > 0 && !freeKickUsed && !isPaused && onUseConsumable) {
      try {
        await onUseConsumable('freeKicks');
        setFreeKickUsed(true);
        freeKickRef.current = true;
        playGain();
        window.dispatchEvent(new CustomEvent('confetti-burst', { detail: { count: 40 } }));
        submitAndReveal(null);
      } catch (error) {
        console.error('Free Kick failed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <BrandHeader isHero={false} />

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <span className="text-3xl font-black text-white tracking-widest drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
          {currentIndex + 1} / {total}
        </span>
      </div>

      <button
        onClick={() => { setIsPaused(true); setShowQuitModal(true); }}
        className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors p-2"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md z-10 flex flex-col h-full pt-16">
        {/* Round type badge — the "surprise" reveal of what game this is */}
        <div className="flex justify-center mb-2">
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-black uppercase tracking-[0.2em] text-fifa-neon">
            {roundType.icon} {roundType.label}
          </span>
        </div>

        {streak > 0 && (
          <div className="flex justify-center mb-4">
            <div
              className={`px-4 py-2 rounded-full font-black flex items-center transition-all duration-300 ${
                streak >= 7
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white animate-shake-fire scale-125 shadow-[0_0_12px_rgba(239,68,68,0.32)] border-2 border-yellow-300'
                  : streak >= 3
                    ? 'bg-orange-500 text-white animate-pulse shadow-[0_0_6px_rgba(249,115,22,0.24)]'
                    : 'bg-white/10 text-orange-400'
              }`}
            >
              🔥 {streak >= 7 ? 'ON FIRE!' : 'Streak:'} {streak}
            </div>
          </div>
        )}

        {/* Centered Timer */}
        <div className={`flex justify-center mb-3 ${streak === 0 ? 'pt-2' : ''}`}>
          <div className={`font-black text-3xl transition-colors duration-500 ${timeLeft <= 3 ? 'text-red-500 animate-fast-pulse' : timeLeft <= 7 ? 'text-yellow-400' : 'text-fifa-neon'}`}>
            {timeLeft}s
          </div>
        </div>

        {/* Timer Bar */}
        <div className={`w-4/5 max-w-xs mx-auto h-3 bg-white/10 rounded-full mb-6 overflow-hidden ${timeLeft <= 3 ? 'animate-fast-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]' : ''}`}>
          <div
            className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : timeLeft <= 7 ? 'bg-yellow-400' : 'bg-gradient-to-r from-fifa-green to-fifa-neon'}`}
            style={{ width: `${(timeLeft / duration) * 100}%` }}
          ></div>
        </div>

        <div className="flex-grow flex flex-col justify-center">
          {/* Consumables Bar */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center items-center">
            {varTokens > 0 && !varUsed && (
              <div className="px-3 py-2 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center gap-1.5" title="VAR Review available">
                <Tv className="w-4 h-4 text-sky-300" />
                <span className="text-sky-300 font-black text-xs tabular-nums">×{varTokens}</span>
              </div>
            )}

            {hintApplies && (
              <button
                onClick={handleHint}
                disabled={hints < 1 || hintUsed || isPaused}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-black text-xs transition-colors ${
                  hints > 0 && !hintUsed && !isPaused
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 hover:bg-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                    : 'bg-white/5 border-white/10 text-gray-500 opacity-50 cursor-not-allowed'
                }`}
              >
                <Search className="w-4 h-4" /> Scout (×{hints})
              </button>
            )}
            <button
              onClick={handleExtraTime}
              disabled={extraTime < 1 || extraTimeUsed || isPaused}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-black text-xs transition-colors ${
                extraTime > 0 && !extraTimeUsed && !isPaused
                  ? 'bg-blue-400/20 border-blue-400 text-blue-300 hover:bg-blue-400/30 shadow-[0_0_10px_rgba(96,165,250,0.2)]'
                  : 'bg-white/5 border-white/10 text-gray-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <Clock className="w-4 h-4" /> +10s (×{extraTime})
            </button>
            <button
              onClick={handleFreeKick}
              disabled={freeKicks < 1 || freeKickUsed || isPaused}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-black text-xs transition-colors ${
                freeKicks > 0 && !freeKickUsed && !isPaused
                  ? 'bg-purple-400/20 border-purple-400 text-purple-300 hover:bg-purple-400/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'bg-white/5 border-white/10 text-gray-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4" /> Free Kick (×{freeKicks})
            </button>
          </div>

          {children({
            question,
            locked: isPaused,
            answer,
            choice,
            score,
            overturned,
            submit: submitAndReveal,
            timeLeft,
            duration,
            eliminated
          })}
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

export default RoundShell;

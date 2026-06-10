import React, { useState } from 'react';
import { Zap, X, TrendingUp, TrendingDown, Lock, Trophy } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import BrandHeader from './BrandHeader';
import QuitModal from './QuitModal';
import { formatOdds, potentialWin, isBettingClosed } from '../utils/picks';

// A Match Day Pick inside the daily quiz: no known answer, no timer. The player
// wagers RP on an outcome and checks back after the match. Placing the wager
// goes through the placePick Cloud Function (escrow + odds snapshot server-side).
const QUICK_STAKES = [25, 50, 100];

const MatchDayPickScreen = ({ question, balance, onPlacePick, onDone, onForfeit, currentIndex, total, t }) => {
  const { playGain } = useAudio();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [stake, setStake] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(null); // { stake, odds }
  const [error, setError] = useState('');
  const [showQuitModal, setShowQuitModal] = useState(false);

  const options = question.options || [];
  const odds = question.odds || [];
  const closed = isBettingClosed(question.locksAt);
  const broke = balance <= 0;
  const selectedOdds = selectedIndex !== null ? Number(odds[selectedIndex]) : 0;
  const win = potentialWin(stake, selectedOdds);
  const canLock = selectedIndex !== null && stake >= 1 && stake <= balance && !submitting;

  const setStakeClamped = (value) => {
    const n = Math.floor(Number(value) || 0);
    setStake(Math.max(0, Math.min(n, balance)));
  };

  const handleLock = async () => {
    if (!canLock) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await onPlacePick(question.id, options[selectedIndex], stake);
      playGain();
      setPlaced({ stake: res?.stake ?? stake, odds: res?.odds ?? selectedOdds, choice: options[selectedIndex] });
    } catch (e) {
      console.error('Failed to place pick:', e);
      // Cloud Function HttpsError messages come through clean on e.message.
      setError(e?.message || 'Could not lock your pick. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Confirmation after a successful wager ---
  if (placed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <BrandHeader isHero={false} />
        <div className="w-full max-w-md z-10 flex flex-col items-center text-center pt-16">
          <div className="w-24 h-24 rounded-full bg-fifa-neon/10 border border-fifa-neon/40 flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-fifa-neon" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Pick Locked!</h2>
          <p className="text-gray-400 mb-6">Check back after <span className="text-white font-bold">{question.fixture || 'the match'}</span> to see your RP.</p>

          <div className="glass-panel p-6 w-full mb-8">
            <p className="text-sm text-gray-400 mb-3">{question.text}</p>
            <p className="text-xl font-black text-fifa-neon mb-4">{placed.choice}</p>
            <div className="flex justify-between text-sm border-t border-white/10 pt-4">
              <span className="text-gray-400 font-bold">Staked</span>
              <span className="text-white font-black tabular-nums">{placed.stake} RP @ {formatOdds(placed.odds)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400 font-bold">To win</span>
              <span className="text-fifa-green font-black tabular-nums">+{potentialWin(placed.stake, placed.odds)} RP</span>
            </div>
          </div>

          <button
            onClick={onDone}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-xl uppercase tracking-wider transform transition-transform hover:scale-[1.02] active:scale-95"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <BrandHeader isHero={false} />

      <button
        onClick={() => setShowQuitModal(true)}
        className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors p-2"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md z-10 flex flex-col pt-16">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
            <span className="text-gray-300 font-bold text-sm uppercase tracking-wider">
              {t ? t('Question') : 'Question'} {currentIndex + 1} {t ? t('of') : 'of'} {total}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-fifa-neon/15 border border-fifa-neon/40">
            <Zap className="w-4 h-4 text-fifa-neon" />
            <span className="text-fifa-neon font-black text-xs uppercase tracking-wider">Match Day Pick</span>
          </div>
        </div>

        {/* Fixture + question */}
        {question.fixture && (
          <p className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{question.fixture}</p>
        )}
        <h2 className="text-3xl font-black text-white leading-tight text-center mb-3">{question.text}</h2>
        <div className="flex items-center justify-center gap-2 mb-6">
          <Trophy className="w-4 h-4 text-gold-glow" />
          <span className="text-sm font-bold text-gold-glow tabular-nums">{balance} RP available</span>
        </div>

        {closed ? (
          <div className="glass-panel p-6 text-center">
            <p className="text-gray-300 font-bold mb-6">Betting has closed for this match.</p>
            <button onClick={onDone} className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 font-black uppercase tracking-wider hover:bg-white/20 transition-colors">
              Continue
            </button>
          </div>
        ) : (
          <>
            {/* Outcomes with odds */}
            <div className="space-y-3 mb-6">
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-200 active:scale-[0.98]
                    ${selectedIndex === idx
                      ? 'bg-fifa-neon/15 border-fifa-neon shadow-[0_0_20px_rgba(57,255,20,0.25)]'
                      : 'bg-white/10 border-white/20 hover:bg-white/15'}`}
                >
                  <span className="font-bold text-lg text-left">{opt}</span>
                  <span className={`font-black tabular-nums ${selectedIndex === idx ? 'text-fifa-neon' : 'text-gray-300'}`}>
                    {formatOdds(odds[idx])}
                  </span>
                </button>
              ))}
            </div>

            {/* Stake control */}
            {broke ? (
              <p className="text-center text-sm text-gray-400 font-bold mb-4">You have no RP to wager right now.</p>
            ) : (
              <div className="glass-panel p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Your stake</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={balance}
                      value={stake || ''}
                      onChange={(e) => setStakeClamped(e.target.value)}
                      placeholder="0"
                      className="w-24 p-2 rounded-lg bg-black/40 border border-white/15 text-white text-right font-black tabular-nums focus:outline-none focus:border-fifa-neon"
                    />
                    <span className="text-xs font-bold text-gray-400">RP</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {QUICK_STAKES.filter((s) => s <= balance).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStakeClamped(s)}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setStakeClamped(balance)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                  >
                    Max
                  </button>
                </div>

                {/* Live potential swing */}
                {selectedIndex !== null && stake > 0 && (
                  <div className="flex justify-between mt-4 pt-3 border-t border-white/10 text-sm">
                    <span className="flex items-center gap-1.5 text-fifa-green font-bold">
                      <TrendingUp className="w-4 h-4" /> Win +{win}
                    </span>
                    <span className="flex items-center gap-1.5 text-red-400 font-bold">
                      <TrendingDown className="w-4 h-4" /> Lose −{stake}
                    </span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-center text-sm text-red-400 font-bold mb-3">{error}</p>
            )}

            <button
              onClick={handleLock}
              disabled={!canLock}
              className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider transition-transform flex items-center justify-center
                ${canLock
                  ? 'bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(57,255,20,0.3)]'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
            >
              {submitting ? 'Locking…' : (
                <><Lock className="w-5 h-5 mr-2" /> Lock Pick</>
              )}
            </button>
            <button
              onClick={onDone}
              disabled={submitting}
              className="w-full py-3 mt-3 text-gray-400 font-bold uppercase tracking-wider text-sm hover:text-white transition-colors disabled:opacity-50"
            >
              Skip — no wager
            </button>
          </>
        )}
      </div>

      {showQuitModal && (
        <QuitModal
          onConfirm={onForfeit}
          onCancel={() => setShowQuitModal(false)}
        />
      )}
    </div>
  );
};

export default MatchDayPickScreen;

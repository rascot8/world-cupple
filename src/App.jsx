import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

import AuthScreen from './components/AuthScreen';
import DashboardScreen from './components/DashboardScreen';
import GameScreen from './components/GameScreen';
import MatchDayPickScreen from './components/MatchDayPickScreen';
import ResultsScreen from './components/ResultsScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import PracticeScreen from './components/PracticeScreen';
import VolumeControl from './components/VolumeControl';
import DancingBackground from './components/DancingBackground';
import KickoffScreen from './components/KickoffScreen';
import AdminScreen from './components/AdminScreen';
import StoreScreen from './components/StoreScreen';
import AlbumScreen from './components/AlbumScreen';
import PackOpeningModal from './components/PackOpeningModal';
import LiveTicker from './components/LiveTicker';

import { AudioProvider } from './contexts/AudioContext';

import { getTodayUTCString } from './utils/dailySeed';
import { fetchTodayQuiz, fetchQuestion, fetchCorrectAnswer, fetchTodaySubmissions, submitDailyAnswer } from './utils/quizService';
import { placePick } from './utils/picksService';
import { calculateDailyFPChange, getRankForFP } from './utils/ranking';
import { evaluateAchievements } from './utils/achievements';
import { applyVipFp, DAILY_MATCH_COINS, WELCOME_COINS } from './utils/economy';
import { computeStreakUpdate, getMilestoneReward } from './utils/streaks';
import { consumeVarToken, openOwnedPack } from './utils/economyService';
import { PACK_FIELDS } from './utils/stickers';

const App = () => {
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [gameState, setGameState] = useState('auth'); // auth, dashboard, playing, results, leaderboard, practice, store, album
  const [dailyQuiz, setDailyQuiz] = useState(null); // { date, questionIds }
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [matchStats, setMatchStats] = useState({ maxStreak: 0, currentStreak: 0, fastAnswers: 0 });
  const [matchRewards, setMatchRewards] = useState(null); // results-screen payload
  const [varUsedThisMatch, setVarUsedThisMatch] = useState(false);
  const [packCeremony, setPackCeremony] = useState(null); // { packId, result }

  // Simple path-based admin route. Players never reach it; access is also
  // enforced server-side (only userData.isAdmin can read/write quiz content).
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const isAdminRoute = window.location.pathname.replace(/\/$/, '') === `${basePath}/admin`;

  // Merge a partial user-doc update into local state (Firestore write already
  // done by the economy service that produced it).
  const mergeUserData = (partial) => setUserData((prev) => ({ ...prev, ...partial }));

  useEffect(() => {
    // Initialize Theme
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-theme');
    }

    // Parse invite code from URL if present
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('invite');
    if (inviteId) {
      localStorage.setItem('pendingInvite', inviteId);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          if (db) {
            const userRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userRef);
            let finalUserData;

            if (docSnap.exists()) {
              finalUserData = docSnap.data();
            } else {
              // Read pending country and username from sign up
              const pendingCountry = localStorage.getItem('pendingCountry') || '';
              const pendingUsername = localStorage.getItem('pendingUsername') || '';
              const newUserData = {
                email: user.email,
                username: pendingUsername,
                fp: 0,
                lastPlayedDate: null,
                country: pendingCountry,
                friends: [],
                // Welcome gift: a taste of the premium economy on day one.
                coins: WELCOME_COINS,
                packBronze: 1,
                playStreak: 0,
                stickers: {}
              };
              await setDoc(userRef, newUserData);
              finalUserData = newUserData;
              localStorage.removeItem('pendingCountry');
              localStorage.removeItem('pendingUsername');
            }

            // Check for pending invite
            const pendingInvite = localStorage.getItem('pendingInvite');
            if (pendingInvite && pendingInvite !== user.uid) {
              // Add two-way friend relationship
              await updateDoc(userRef, {
                friends: arrayUnion(pendingInvite)
              });
              const inviterRef = doc(db, 'users', pendingInvite);
              await updateDoc(inviterRef, {
                friends: arrayUnion(user.uid)
              });
              localStorage.removeItem('pendingInvite');
              // Reload local data
              const updatedSnap = await getDoc(userRef);
              finalUserData = updatedSnap.data();
            }

            // --- TAYDOE OVERRIDES ---
            if (finalUserData && finalUserData.username === 'Taydoe') {
              finalUserData.isAdmin = true;
              if (!finalUserData.taydoeBonusGranted) {
                finalUserData.coins = (finalUserData.coins || 0) + 2000;
                finalUserData.taydoeBonusGranted = true;
                updateDoc(userRef, { 
                  coins: finalUserData.coins,
                  taydoeBonusGranted: true
                }).catch(console.error);
              }
            }
            // ------------------------

            setUserData(finalUserData);
          }
          setGameState('dashboard');
        } catch (error) {
          console.error("Firestore Error during login:", error);
          alert("Login successful, but failed to connect to Firestore Database. Have you enabled Firestore and set 'Start in test mode'?");
          setCurrentUser(null);
          setUserData(null);
          setGameState('auth');
          auth.signOut();
        } finally {
          setAuthLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setGameState('auth');
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load the current question whenever the quiz position changes.
  // Starts during the kickoff screen so the first question is prefetched.
  useEffect(() => {
    if (!dailyQuiz) return;
    let cancelled = false;
    setCurrentQuestion(null);
    fetchQuestion(dailyQuiz.questionIds[currentQuestionIndex]).then((q) => {
      if (!cancelled) setCurrentQuestion(q);
    });
    return () => { cancelled = true; };
  }, [dailyQuiz, currentQuestionIndex]);

  const handleForfeit = async () => {
    await finishQuiz('forfeit', dailyQuiz);
  };

  const finishQuiz = async (finalScore, quiz, stats = { maxStreak: 0, fastAnswers: 0 }) => {
    const isForfeit = finalScore === 'forfeit';
    const actualScore = isForfeit ? 0 : finalScore;
    
    setScore(actualScore);
    const today = getTodayUTCString();

    // Don't award FP twice if the quiz was already completed today
    if (userData?.lastPlayedDate !== today) {
      const isVip = !!userData?.vip;
      const baseFpChange = isForfeit ? -50 : calculateDailyFPChange(actualScore);
      const fpChange = isForfeit ? -50 : applyVipFp(baseFpChange, isVip); // Captain's Club: +50% on wins

      // Consecutive-day streak (Streak Shields bridge one missed day)
      const { newStreak, usedFreeze } = isForfeit 
        ? { newStreak: Math.max(0, userData?.playStreak || 0), usedFreeze: false }
        : computeStreakUpdate(userData, today);
      const milestone = isForfeit ? null : getMilestoneReward(newStreak);

      const coinsEarned = isForfeit ? 0 : (DAILY_MATCH_COINS + (milestone?.coins || 0));
      const newTotalFP = Math.max(0, (userData?.fp || 0) + fpChange + (milestone?.fp || 0));

      // Every completed match earns a free Bronze Pack; milestones add more.
      const packGrants = milestone?.packs ? { ...milestone.packs } : { bronze: 0 };
      if (!isForfeit) {
        packGrants.bronze = (packGrants.bronze || 0) + 1;
      }

      const consumableGrants = { hints: 0, extraTime: 0, freeKicks: 0 };
      if (milestone?.consumables) {
        for (const [type, n] of Object.entries(milestone.consumables)) consumableGrants[type] += n;
      }

      let newUserData = {
        ...userData,
        fp: newTotalFP,
        coins: (userData?.coins || 0) + coinsEarned,
        lastPlayedDate: today,
        playStreak: newStreak,
        bestStreak: Math.max(userData?.bestStreak || 0, newStreak),
        streakFreezes: Math.max(0, (userData?.streakFreezes || 0) - (usedFreeze ? 1 : 0)),
        packBronze: (userData?.packBronze || 0) + packGrants.bronze,
        hints: (userData?.hints || 0) + consumableGrants.hints,
        extraTime: (userData?.extraTime || 0) + consumableGrants.extraTime,
        freeKicks: (userData?.freeKicks || 0) + consumableGrants.freeKicks
      };

      if (finalScore === 10) {
        newUserData.perfectMatchesCount = (userData?.perfectMatchesCount || 0) + 1;
      }

      // Evaluate Achievements
      const newlyUnlocked = evaluateAchievements(newUserData, {
        isDaily: true,
        score: finalScore,
        maxStreak: stats.maxStreak,
        fastAnswers: stats.fastAnswers,
        rankName: getRankForFP(newTotalFP).name
      });

      if (newlyUnlocked.length > 0) {
        newUserData.badges = [...(newUserData.badges || []), ...newlyUnlocked];
      }

      if (db && currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          fp: newTotalFP,
          coins: newUserData.coins,
          lastPlayedDate: today,
          playStreak: newStreak,
          bestStreak: newUserData.bestStreak,
          streakFreezes: newUserData.streakFreezes,
          packBronze: newUserData.packBronze,
          hints: newUserData.hints,
          extraTime: newUserData.extraTime,
          freeKicks: newUserData.freeKicks,
          perfectMatchesCount: newUserData.perfectMatchesCount || 0,
          badges: newUserData.badges || []
        });
      }

      setUserData(newUserData);
      setMatchRewards({
        fpChange,
        coins: coinsEarned,
        packEarned: true,
        streak: newStreak,
        usedFreeze,
        milestone,
        vipApplied: isVip && baseFpChange > 0,
        alreadyPlayed: false
      });
    } else {
      // Replay/refresh view of an already-scored match: nothing re-awarded.
      setMatchRewards({
        fpChange: 0,
        coins: 0,
        packEarned: false,
        streak: userData?.playStreak || 0,
        usedFreeze: false,
        milestone: null,
        vipApplied: false,
        alreadyPlayed: true
      });
    }

    setDailyQuiz(quiz);
    setGameState('results');
  };

  const handlePlayDaily = async () => {
    try {
      const quiz = await fetchTodayQuiz();
      if (!quiz) {
        alert("No daily quiz is available today. Please try again later.");
        return;
      }

      // Resume where the player left off (answers are immutable, no replays).
      const submitted = userData?.isAdmin ? {} : await fetchTodaySubmissions(currentUser.uid, quiz.date);
      // A VAR overturn is client-side scoring sugar — restore it on resume.
      const varCredit = localStorage.getItem(`wc_var_${quiz.date}`);
      setVarUsedThisMatch(!!varCredit);

      let startIndex = 0;
      let startScore = 0;
      for (const qid of quiz.questionIds) {
        if (!(qid in submitted)) break;
        // Picks have their own FP economy and never count toward the quiz
        // score — even once settled (which would otherwise leak an answer).
        const q = await fetchQuestion(qid);
        if (q?.type !== 'pick') {
          const correct = await fetchCorrectAnswer(qid);
          if (submitted[qid] === correct || varCredit === qid) startScore++;
        }
        startIndex++;
      }

      if (startIndex >= quiz.questionIds.length) {
        await finishQuiz(startScore, quiz);
        return;
      }

      setDailyQuiz(quiz);
      setCurrentQuestionIndex(startIndex);
      setScore(startScore);
      setMatchStats({ maxStreak: 0, currentStreak: 0, fastAnswers: 0 });
      setGameState('kickoff_daily');
    } catch (error) {
      console.error("Failed to load daily quiz:", error);
      alert("Failed to load the daily quiz. Check your connection and try again.");
    }
  };

  // Lock in the answer in Firestore, then return the now-revealed correct answer
  const handleSubmitAnswer = (questionId, choice) =>
    submitDailyAnswer(currentUser.uid, dailyQuiz.date, questionId, choice);

  // Spend a VAR token to overturn a wrong call (once per match).
  const handleUseVar = async (questionId) => {
    const partial = await consumeVarToken(currentUser.uid, userData);
    mergeUserData(partial);
    setVarUsedThisMatch(true);
    try {
      localStorage.setItem(`wc_var_${dailyQuiz.date}`, questionId);
    } catch { /* private mode — overturn just won't survive a refresh */ }
  };

  // Open one pack from the player's inventory and run the ceremony.
  // `freshUserData` lets callers that just granted a pack in the same tick
  // pass the post-grant state (React state hasn't flushed yet).
  const handleOpenPack = async (packId, freshUserData = null) => {
    try {
      const { result, partial } = await openOwnedPack(currentUser.uid, freshUserData || userData, packId);
      mergeUserData(partial);
      setPackCeremony({ packId, result });
    } catch (e) {
      console.error('Failed to open pack:', e);
      alert(e?.message || 'Could not open the pack.');
    }
  };

  // Lock a Match Day Pick wager (escrow + odds snapshot happen server-side).
  // Reflect the escrowed stake in the local balance right away.
  const handlePlacePick = async (questionId, choice, stake) => {
    const res = await placePick(dailyQuiz.date, questionId, choice, stake);
    setUserData((prev) => ({ ...prev, fp: res.newBalance }));
    return res;
  };

  // Advance past a pick without touching the quiz score — picks have their own
  // FP economy and settle later. Finish the quiz if it was the last question.
  const handlePickDone = async () => {
    if (currentQuestionIndex + 1 < dailyQuiz.questionIds.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      await finishQuiz(score, dailyQuiz, { maxStreak: matchStats.maxStreak, fastAnswers: matchStats.fastAnswers });
    }
  };

  const handleAnswer = async (isCorrect, additionalStats = {}) => {
    const { fastAnswer } = additionalStats;

    const newCurrentStreak = isCorrect ? matchStats.currentStreak + 1 : 0;
    const newMaxStreak = Math.max(matchStats.maxStreak, newCurrentStreak);
    const newFastAnswers = matchStats.fastAnswers + (isCorrect && fastAnswer ? 1 : 0);

    setMatchStats({
      currentStreak: newCurrentStreak,
      maxStreak: newMaxStreak,
      fastAnswers: newFastAnswers
    });

    const newScore = score + (isCorrect ? 1 : 0);

    if (currentQuestionIndex + 1 < dailyQuiz.questionIds.length) {
      setScore(newScore);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      await finishQuiz(newScore, dailyQuiz, { maxStreak: newMaxStreak, fastAnswers: newFastAnswers });
    }
  };
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-fifa-neon font-bold text-xl uppercase tracking-widest">
        LOADING...
      </div>
    );
  }

  // /admin route: must be signed in AND flagged isAdmin (also enforced by
  // firestore.rules, so this is just the UX gate, not the security boundary).
  if (isAdminRoute) {
    const goHome = () => { window.location.href = import.meta.env.BASE_URL; };
    if (!currentUser) {
      return (
        <AudioProvider gameState={gameState}>
          <div className="min-h-screen text-white relative">
            <DancingBackground />
            <AuthScreen />
          </div>
        </AudioProvider>
      );
    }
    if (!userData?.isAdmin) {
      return (
        <AudioProvider gameState={gameState}>
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-3xl font-black uppercase tracking-widest text-red-400 mb-3">Access Denied</h1>
            <p className="text-gray-400 mb-6">Your account is not an administrator.</p>
            <button onClick={goHome} className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 font-bold uppercase tracking-wider hover:bg-white/20 transition-colors">
              Back to app
            </button>
          </div>
        </AudioProvider>
      );
    }
    return (
      <AudioProvider gameState={gameState}>
        <div className="min-h-screen text-white relative">
          <DancingBackground />
          <AdminScreen onExit={goHome} />
        </div>
      </AudioProvider>
    );
  }

  return (
    <AudioProvider gameState={gameState}>
      <div className="min-h-screen text-white relative">
        <DancingBackground />
        <VolumeControl />

        {gameState === 'auth' && <AuthScreen />}

      {gameState === 'dashboard' && (
        <DashboardScreen
          onPlay={handlePlayDaily}
          onPractice={() => setGameState('practice')}
          onLeaderboard={() => setGameState('leaderboard')}
          onStore={() => setGameState('store')}
          onAlbum={() => setGameState('album')}
          onOpenPack={handleOpenPack}
          onUpdateUser={mergeUserData}
          userData={userData}
        />
      )}

      {gameState === 'kickoff_daily' && (
        <KickoffScreen onFinish={() => setGameState('playing')} />
      )}

      {gameState === 'playing' && dailyQuiz && (
        currentQuestion ? (
          currentQuestion.type === 'pick' ? (
            <MatchDayPickScreen
              question={currentQuestion}
              balance={userData?.fp || 0}
              onPlacePick={handlePlacePick}
              onDone={handlePickDone}
              onForfeit={handleForfeit}
              currentIndex={currentQuestionIndex}
              total={dailyQuiz.questionIds.length}
              t={t}
            />
          ) : (
            <GameScreen
              question={currentQuestion}
              currentIndex={currentQuestionIndex}
              total={dailyQuiz.questionIds.length}
              onSubmitAnswer={handleSubmitAnswer}
              onAnswer={handleAnswer}
              onForfeit={handleForfeit}
              varTokens={userData?.varTokens || 0}
              varUsed={varUsedThisMatch}
              onUseVar={handleUseVar}
              hints={userData?.hints || 0}
              extraTime={userData?.extraTime || 0}
              freeKicks={userData?.freeKicks || 0}
              onUseConsumable={async (field) => {
                const { consumeConsumable } = await import('./utils/economyService');
                const partial = await consumeConsumable(currentUser.uid, userData, field);
                mergeUserData(partial);
              }}
              onOverrideAnswer={(qid) => {
                try {
                  localStorage.setItem(`wc_var_${dailyQuiz.date}`, qid);
                } catch {}
              }}
              t={t}
              currentStreak={matchStats.currentStreak}
            />
          )
        ) : (
          <div className="min-h-screen flex items-center justify-center text-fifa-neon font-bold text-xl uppercase tracking-widest">
            LOADING...
          </div>
        )
      )}

      {gameState === 'practice' && (
        <PracticeScreen onExit={() => setGameState('dashboard')} />
      )}

      {gameState === 'results' && (
        <ResultsScreen
          score={score}
          total={dailyQuiz?.questionIds.length || 10}
          totalFP={userData?.fp || 0}
          userData={userData}
          rewards={matchRewards}
          onOpenPack={handleOpenPack}
          onRestart={() => setGameState('dashboard')}
        />
      )}

        {gameState === 'leaderboard' && (
          <LeaderboardScreen onBack={() => setGameState('dashboard')} userData={userData} />
        )}

        {gameState === 'store' && (
          <StoreScreen
            userData={userData}
            onBack={() => setGameState('dashboard')}
            onUpdateUser={mergeUserData}
            onOpenPack={handleOpenPack}
          />
        )}

        {gameState === 'album' && (
          <AlbumScreen
            userData={userData}
            onBack={() => setGameState('dashboard')}
            onUpdateUser={mergeUserData}
            onOpenPack={handleOpenPack}
            onGoStore={() => setGameState('store')}
          />
        )}

        {/* The live ticker keeps the hub feeling inhabited */}
        {(gameState === 'dashboard' || gameState === 'leaderboard') && <LiveTicker />}

        {/* Pack-opening ceremony overlays everything */}
        {packCeremony && (
          <PackOpeningModal
            packId={packCeremony.packId}
            result={packCeremony.result}
            remainingPacks={userData?.[PACK_FIELDS[packCeremony.packId]] || 0}
            onOpenAnother={() => handleOpenPack(packCeremony.packId)}
            onClose={() => setPackCeremony(null)}
          />
        )}
      </div>
    </AudioProvider>
  );
}

export default App;

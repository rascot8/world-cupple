import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

import AuthScreen from './components/AuthScreen';
import DashboardScreen from './components/DashboardScreen';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import PracticeScreen from './components/PracticeScreen';
import VolumeControl from './components/VolumeControl';
import AudioPromptModal from './components/AudioPromptModal';
import DancingBackground from './components/DancingBackground';
import KickoffScreen from './components/KickoffScreen';

import { AudioProvider } from './contexts/AudioContext';

import { getTodayUTCString } from './utils/dailySeed';
import { fetchTodayQuiz, fetchQuestion, fetchCorrectAnswer, fetchTodaySubmissions, submitDailyAnswer } from './utils/quizService';
import { calculateDailyFPChange } from './utils/ranking';
import { evaluateAchievements } from './utils/achievements';

const App = () => {
  const { t } = useTranslation();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [gameState, setGameState] = useState('auth'); // auth, dashboard, playing, results, leaderboard, practice
  const [dailyQuiz, setDailyQuiz] = useState(null); // { date, questionIds }
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [matchStats, setMatchStats] = useState({ maxStreak: 0, currentStreak: 0, fastAnswers: 0 });

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
                friends: [] 
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

  const finishQuiz = async (finalScore, quiz, stats = { maxStreak: 0, fastAnswers: 0 }) => {
    setScore(finalScore);
    const today = getTodayUTCString();

    // Don't award FP twice if the quiz was already completed today
    if (userData?.lastPlayedDate !== today) {
      const fpChange = calculateDailyFPChange(finalScore);
      const newTotalFP = Math.max(0, (userData?.fp || 0) + fpChange);

      let newUserData = {
        ...userData,
        fp: newTotalFP,
        lastPlayedDate: today,
        // simple tracking for streak (ideally we parse dates to check if it's exactly 1 day diff)
        // for now just increment
        playStreak: (userData?.playStreak || 0) + 1
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
        // rankName and globalRankIndex would need real time calculation, using simple fallback for now
        rankName: '',
      });

      if (newlyUnlocked.length > 0) {
        newUserData.badges = [...(newUserData.badges || []), ...newlyUnlocked];
      }

      if (db && currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          fp: newTotalFP,
          lastPlayedDate: today,
          playStreak: newUserData.playStreak || 0,
          perfectMatchesCount: newUserData.perfectMatchesCount || 0,
          badges: newUserData.badges || []
        });
      }

      setUserData(newUserData);
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

      // Resume where the user left off — submitted answers are final, so a
      // refresh can never be used to retry a question.
      const submitted = await fetchTodaySubmissions(currentUser.uid, quiz.date);
      let startIndex = 0;
      let startScore = 0;
      for (const qid of quiz.questionIds) {
        if (!(qid in submitted)) break;
        const correct = await fetchCorrectAnswer(qid);
        if (submitted[qid] === correct) startScore++;
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

  const handleForfeit = async () => {
    await finishQuiz(0, dailyQuiz);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-fifa-neon font-bold text-xl uppercase tracking-widest">
        LOADING...
      </div>
    );
  }

  return (
    <AudioProvider gameState={gameState}>
      <div className="min-h-screen text-white relative">
        <DancingBackground />
        <AudioPromptModal />
        <VolumeControl />
        
        {gameState === 'auth' && <AuthScreen />}
      
      {gameState === 'dashboard' && (
        <DashboardScreen 
          onPlay={handlePlayDaily} 
          onPractice={() => setGameState('practice')}
          onLeaderboard={() => setGameState('leaderboard')}
          userData={userData} 
        />
      )}

      {gameState === 'kickoff_daily' && (
        <KickoffScreen onFinish={() => setGameState('playing')} />
      )}

      {gameState === 'playing' && dailyQuiz && (
        currentQuestion ? (
          <GameScreen
            question={currentQuestion}
            currentIndex={currentQuestionIndex}
            total={dailyQuiz.questionIds.length}
            onSubmitAnswer={handleSubmitAnswer}
            onAnswer={handleAnswer}
            onForfeit={handleForfeit}
            t={t}
          />
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
          onRestart={() => setGameState('dashboard')}
        />
      )}

        {gameState === 'leaderboard' && (
          <LeaderboardScreen onBack={() => setGameState('dashboard')} userData={userData} />
        )}
      </div>
    </AudioProvider>
  );
}

export default App;

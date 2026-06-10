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

import { loadTriviaData } from './utils/csvParser';
import { getDailyQuestions, getTodayUTCString } from './utils/dailySeed';
import { calculateDailyFPChange } from './utils/ranking';
import { evaluateAchievements } from './utils/achievements';

const App = () => {
  const { t } = useTranslation();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [gameState, setGameState] = useState('auth'); // auth, dashboard, playing, results, leaderboard, practice
  const [dailyQuestions, setDailyQuestions] = useState([]);
  
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

  const handlePlayDaily = async () => {
    const data = await loadTriviaData();
    const questions = getDailyQuestions(data);
    
    if (questions.length === 0) {
      alert("Failed to load daily questions.");
      return;
    }
    
    setDailyQuestions(questions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setMatchStats({ maxStreak: 0, currentStreak: 0, fastAnswers: 0 });
    setGameState('kickoff_daily');
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
    
    if (currentQuestionIndex + 1 < dailyQuestions.length) {
      setScore(newScore);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setScore(newScore);
      const fpChange = calculateDailyFPChange(newScore);
      const newTotalFP = Math.max(0, (userData?.fp || 0) + fpChange);
      
      let newUserData = {
        ...userData,
        fp: newTotalFP,
        lastPlayedDate: getTodayUTCString()
      };
      
      // Update playStreak
      const lastPlayed = userData?.lastPlayedDate;
      const today = getTodayUTCString();
      if (lastPlayed !== today) {
        // simple tracking for streak (ideally we parse dates to check if it's exactly 1 day diff)
        // for now just increment
        newUserData.playStreak = (userData?.playStreak || 0) + 1;
      }
      
      if (newScore === 10) {
        newUserData.perfectMatchesCount = (userData?.perfectMatchesCount || 0) + 1;
      }

      // Evaluate Achievements
      const newlyUnlocked = evaluateAchievements(newUserData, {
        isDaily: true,
        score: newScore,
        maxStreak: newMaxStreak,
        fastAnswers: newFastAnswers,
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
      setGameState('results');
    }
  };

  const handleForfeit = async () => {
    const newScore = 0;
    setScore(newScore);
    const fpChange = calculateDailyFPChange(newScore);
    const newTotalFP = Math.max(0, (userData?.fp || 0) + fpChange);
    
    const newUserData = {
      ...userData,
      fp: newTotalFP,
      lastPlayedDate: getTodayUTCString()
    };
    
    if (db && currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        fp: newTotalFP,
        lastPlayedDate: getTodayUTCString()
      });
    }
    
    setUserData(newUserData);
    setGameState('results');
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

      {gameState === 'playing' && dailyQuestions.length > 0 && (
        <GameScreen 
          question={dailyQuestions[currentQuestionIndex]}
          currentIndex={currentQuestionIndex}
          total={dailyQuestions.length}
          onAnswer={handleAnswer}
          onForfeit={handleForfeit}
          t={t}
        />
      )}

      {gameState === 'practice' && (
        <PracticeScreen onExit={() => setGameState('dashboard')} />
      )}

      {gameState === 'results' && (
        <ResultsScreen 
          score={score}
          total={dailyQuestions.length}
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

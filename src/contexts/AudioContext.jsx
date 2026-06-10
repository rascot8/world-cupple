import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children, gameState }) => {
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('globalVolume');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('isMuted') === 'true';
  });

  // Audio refs
  const menuBgmRef = useRef(new Audio('/audio/menu_bgm.mp3'));
  const quizBgmRef = useRef(new Audio('/audio/quiz_bgm.mp3'));
  const correctSfxRef = useRef(new Audio('/audio/correct.mp3'));
  const wrongSfxRef = useRef(new Audio('/audio/wrong.mp3'));
  const gainSfxRef = useRef(new Audio('/audio/gain_fp.mp3'));
  const lossSfxRef = useRef(new Audio('/audio/gain_fp.mp3'));
  const kickoffRef = useRef(new Audio('/audio/kickoff.mp3'));
  const whistleRef = useRef(new Audio('/audio/whistle.mp3'));

  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  
  const getAudioData = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return null;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    return dataArrayRef.current;
  }, []);

  useEffect(() => {
    menuBgmRef.current.crossOrigin = "anonymous";
    quizBgmRef.current.crossOrigin = "anonymous";
    menuBgmRef.current.loop = true;
    quizBgmRef.current.loop = true;
  }, []);

  // Handle volume changes
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    menuBgmRef.current.volume = effectiveVolume * 0.4; // BGM is usually quieter
    quizBgmRef.current.volume = effectiveVolume * 0.4;
    correctSfxRef.current.volume = effectiveVolume;
    wrongSfxRef.current.volume = effectiveVolume;
    gainSfxRef.current.volume = effectiveVolume;
    lossSfxRef.current.volume = effectiveVolume;
    kickoffRef.current.volume = effectiveVolume;
    whistleRef.current.volume = effectiveVolume;

    localStorage.setItem('globalVolume', volume);
    localStorage.setItem('isMuted', isMuted);
  }, [volume, isMuted]);

  // Handle BGM switching based on gamestate
  useEffect(() => {
    const playMenu = ['auth', 'dashboard', 'results', 'leaderboard'].includes(gameState);
    const playQuiz = ['playing', 'practice'].includes(gameState);
    const playKickoffState = ['kickoff_daily', 'kickoff_practice'].includes(gameState);

    // In a real app we'd fade these, but for now we pause/play
    if (playMenu) {
      quizBgmRef.current.pause();
      kickoffRef.current.pause();
      kickoffRef.current.currentTime = 0;
      // Try play (might fail if user hasn't interacted yet)
      menuBgmRef.current.play().catch(() => console.log('Audio autoplay blocked'));
    } else if (playQuiz) {
      menuBgmRef.current.pause();
      kickoffRef.current.pause();
      quizBgmRef.current.play().catch(() => console.log('Audio autoplay blocked'));
    } else if (playKickoffState) {
      menuBgmRef.current.pause();
      // Start both at the same time
      quizBgmRef.current.currentTime = 0;
      quizBgmRef.current.play().catch(() => console.log('Audio autoplay blocked'));
      
      kickoffRef.current.currentTime = 0;
      kickoffRef.current.play().catch(() => console.log('Audio autoplay blocked'));
    }
  }, [gameState]);

  const resumeBgm = (forceVolume = null, forceMute = null) => {
    // Initialize Web Audio API on user interaction if not already done
    if (!analyserRef.current) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128; // 64 frequency bins
        
        const sourceMenu = audioCtx.createMediaElementSource(menuBgmRef.current);
        const sourceQuiz = audioCtx.createMediaElementSource(quizBgmRef.current);
        sourceMenu.connect(analyser);
        sourceQuiz.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      } catch (e) {
        console.warn("Audio visualizer init failed:", e);
      }
    }

    const playMenu = ['auth', 'dashboard', 'results', 'leaderboard'].includes(gameState);
    const audioEl = playMenu ? menuBgmRef.current : quizBgmRef.current;
    
    const activeVolume = forceVolume !== null ? forceVolume : volume;
    const activeMute = forceMute !== null ? forceMute : isMuted;
    
    const targetVolume = (activeMute ? 0 : activeVolume) * 0.4;
    audioEl.volume = 0;
    
    audioEl.play().catch(() => {});
    
    if (targetVolume > 0) {
      let currentVol = 0;
      const steps = 40;
      const volStep = targetVolume / steps;
      
      const fadeInterval = setInterval(() => {
        currentVol += volStep;
        if (currentVol >= targetVolume) {
          audioEl.volume = targetVolume;
          clearInterval(fadeInterval);
        } else {
          audioEl.volume = currentVol;
        }
      }, 50);
    }
  };

  const playCorrect = useCallback(() => {
    correctSfxRef.current.currentTime = 0;
    correctSfxRef.current.play().catch(() => {});
  }, []);

  const playWrong = useCallback(() => {
    wrongSfxRef.current.currentTime = 0;
    wrongSfxRef.current.play().catch(() => {});
  }, []);

  const playGain = useCallback(() => {
    gainSfxRef.current.currentTime = 0;
    gainSfxRef.current.play().catch(() => {});
  }, []);

  const playLoss = useCallback(() => {
    lossSfxRef.current.currentTime = 0;
    lossSfxRef.current.play().catch(() => {});
  }, []);

  const playKickoffSfx = useCallback(() => {
    kickoffRef.current.currentTime = 0;
    kickoffRef.current.play().catch(() => {});
  }, []);

  const playWhistle = useCallback(() => {
    whistleRef.current.currentTime = 0;
    whistleRef.current.play().catch(() => {});
  }, []);

  return (
    <AudioContext.Provider value={{ volume, setVolume, isMuted, setIsMuted, playCorrect, playWrong, playGain, playLoss, playKickoffSfx, playWhistle, resumeBgm, getAudioData }}>
      {children}
    </AudioContext.Provider>
  );
};

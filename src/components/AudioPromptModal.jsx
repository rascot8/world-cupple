import React, { useState } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { Volume2, VolumeX } from 'lucide-react';

const AudioPromptModal = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { setVolume, setIsMuted, resumeBgm } = useAudio();

  const handlePlayWithSound = () => {
    setIsMuted(false);
    setVolume(0.5);
    resumeBgm(0.5, false);
    setIsVisible(false);
  };

  const handlePlayWithoutSound = () => {
    setIsMuted(true);
    setVolume(0);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <div className="glass-panel w-full max-w-md p-8 text-center animate-float-up">
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">
          Turn up the energy!
        </h2>
        
        <p className="text-gray-300 mb-8 font-medium text-sm leading-relaxed">
          For the ultimate World Cup experience, turn on the sound to unlock stadium effects and an immersive audio-reactive visualizer!
        </p>
        <div className="flex flex-col space-y-4">
          <button 
            onClick={handlePlayWithSound}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-xl uppercase tracking-wider transform transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(57,255,20,0.4)] flex items-center justify-center"
          >
            <Volume2 className="w-6 h-6 mr-3" />
            Play with sound
          </button>
          
          <button 
            onClick={handlePlayWithoutSound}
            className="w-full py-3 rounded-2xl bg-white/10 text-gray-300 font-bold text-sm uppercase tracking-wider hover:bg-white/20 hover:text-white transition-colors flex items-center justify-center border border-white/5"
          >
            <VolumeX className="w-4 h-4 mr-2" />
            Play without sound
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPromptModal;

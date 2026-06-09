import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

const VolumeControl = () => {
  const { volume, setVolume, isMuted, setIsMuted } = useAudio();
  const [isHovered, setIsHovered] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex items-center bg-fifa-dark/80 backdrop-blur-md p-3 rounded-full border border-white/10 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: isHovered ? '160px' : '50px' }}
    >
      <button onClick={toggleMute} className="text-fifa-neon hover:text-white transition-colors flex-shrink-0">
        {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 text-gray-400" /> : <Volume2 className="w-6 h-6" />}
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 flex items-center ${isHovered ? 'w-full ml-3 opacity-100' : 'w-0 opacity-0'}`}
      >
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            if (isMuted && e.target.value > 0) setIsMuted(false);
          }}
          className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer touch-action-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full"
          style={{
            backgroundImage: `linear-gradient(to right, #16a34a ${(isMuted ? 0 : volume) * 100}%, #4b5563 ${(isMuted ? 0 : volume) * 100}%)`
          }}
        />
      </div>
    </div>
  );
};

export default VolumeControl;

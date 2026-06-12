import React from 'react';

const PackVisual = ({ pack, count, showCount = false, className = '' }) => {
  return (
    <div className={`relative aspect-[2.5/3.5] rounded-xl border-2 ${pack.ring} bg-gradient-to-br ${pack.gradient} shadow-xl flex flex-col items-center justify-center overflow-hidden ${className}`}>
      
      {/* Foil overlay sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 pointer-events-none mix-blend-overlay" />
      
      {/* Top Crimp */}
      <div className="absolute top-0 inset-x-0 h-[8%] bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(0,0,0,0.25)_4px,rgba(0,0,0,0.25)_8px)] border-b border-black/20" />
      
      {/* Pack content */}
      <div className="flex flex-col items-center justify-center z-10 p-2 text-center w-full mt-2">
        <span className="text-4xl sm:text-5xl drop-shadow-lg mb-2">{pack.icon}</span>
        <span className="font-black text-white uppercase tracking-wider drop-shadow-md text-[10px] sm:text-xs leading-tight">
          {pack.name}
        </span>
      </div>

      {showCount && count > 0 && (
        <div className="absolute top-3 right-2 bg-black/80 border border-white/20 text-white font-black px-1.5 py-0.5 rounded text-[10px] z-20 shadow-md">
          ×{count}
        </div>
      )}

      {/* Bottom Crimp */}
      <div className="absolute bottom-0 inset-x-0 h-[8%] bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(0,0,0,0.25)_4px,rgba(0,0,0,0.25)_8px)] border-t border-black/20" />
      
    </div>
  );
};

export default PackVisual;

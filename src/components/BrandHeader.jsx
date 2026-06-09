import React from 'react';

const BrandHeader = ({ isHero = false }) => {
  const gradientClasses = "text-transparent bg-clip-text bg-gradient-to-r from-[#FF004D] via-[#00F0FF] to-[#FAFF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]";
  
  if (isHero) {
    return (
      <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tight text-center mb-10 ${gradientClasses} z-20`}>
        TRIVIA WORLD CUP 2026
      </h1>
    );
  }

  return (
    <div className="absolute top-6 left-6 z-40 pointer-events-none">
      <h1 className={`text-sm md:text-base font-black uppercase tracking-widest ${gradientClasses}`}>
        TRIVIA WORLD CUP 2026
      </h1>
    </div>
  );
};

export default BrandHeader;

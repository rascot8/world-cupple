import React from 'react';

const BrandHeader = ({ isHero = false }) => {
  const gradientClasses = "text-transparent bg-clip-text bg-gradient-to-b from-[#FFF700] via-[#DAA520] to-[#B8860B] drop-shadow-[0_0_10px_rgba(218,165,32,0.6)]";
  
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

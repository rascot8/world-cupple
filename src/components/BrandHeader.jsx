import React from 'react';
import logo from '../assets/worldcupple.png';

const BrandHeader = ({ isHero = false }) => {
  if (isHero) {
    return (
      <img
        src={logo}
        alt="Trivia World Cup 2026"
        className="w-64 md:w-80 mx-auto mb-10 z-0 pointer-events-none"
      />
    );
  }

  return (
    <div className="absolute top-6 left-6 z-40 pointer-events-none">
      <img
        src={logo}
        alt="Trivia World Cup 2026"
        className="w-24 md:w-32"
      />
    </div>
  );
};

export default BrandHeader;

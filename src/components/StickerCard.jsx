import React from 'react';
import { RARITIES } from '../utils/stickers';

/**
 * One sticker, rendered as a trading card. Pure CSS + emoji art so it works
 * with zero image assets. `owned=false` renders the silhouette slot used in
 * the album grid.
 */
const SIZES = {
  sm: { card: 'w-full aspect-[3/4] p-1.5 rounded-lg border', icon: 'text-2xl', name: 'text-[9px]', sub: 'text-[7px]', flag: 'text-xs', tag: 'text-[6px] px-1' },
  md: { card: 'w-full aspect-[3/4] p-2 rounded-xl border-2', icon: 'text-4xl', name: 'text-[11px]', sub: 'text-[8px]', flag: 'text-sm', tag: 'text-[7px] px-1.5' },
  lg: { card: 'w-40 sm:w-44 aspect-[3/4] p-3 rounded-2xl border-2', icon: 'text-6xl', name: 'text-base', sub: 'text-[10px]', flag: 'text-xl', tag: 'text-[9px] px-2' }
};

const StickerCard = ({ sticker, owned = true, count = 0, size = 'md', onClick, highlightNew = false }) => {
  const s = SIZES[size] || SIZES.md;
  const rarity = RARITIES[sticker.rarity];

  if (!owned) {
    return (
      <button
        onClick={onClick}
        className={`${s.card} border-dashed border-white/15 bg-black/40 flex flex-col items-center justify-center gap-1 hover:border-white/30 transition-colors group`}
      >
        <span className={`${s.icon} grayscale opacity-25 group-hover:opacity-40 transition-opacity`}>{sticker.icon}</span>
        <span className={`${s.name} font-black uppercase tracking-wider text-gray-600`}>???</span>
        <span className={`${s.tag} rounded font-black uppercase tracking-wider ${rarity.text} opacity-60`}>{rarity.label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${s.card} ${rarity.frame} ${rarity.glow} relative flex flex-col items-center justify-between overflow-hidden transition-transform hover:scale-[1.04] active:scale-[0.97]`}
    >
      {sticker.rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.9),transparent_60%)]" />
      )}
      <div className="flex w-full items-start justify-between relative z-10">
        <span className={s.flag}>{sticker.flag}</span>
        {count > 1 && (
          <span className="bg-black/60 text-white font-black rounded-full px-1.5 text-[9px] tabular-nums">×{count}</span>
        )}
        {highlightNew && (
          <span className="bg-fifa-neon text-fifa-black font-black rounded px-1.5 text-[9px] uppercase animate-pulse">NEW</span>
        )}
      </div>
      <span className={`${s.icon} drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] relative z-10`}>{sticker.icon}</span>
      <div className="w-full text-center relative z-10">
        <p className={`${s.name} font-black uppercase tracking-tight leading-tight ${sticker.rarity === 'legendary' ? 'text-yellow-100' : 'text-white'} truncate`}>
          {sticker.name}
        </p>
        <p className={`${s.sub} font-bold ${sticker.rarity === 'legendary' ? 'text-yellow-200/80' : 'text-gray-300/80'} truncate`}>{sticker.sub}</p>
        <span className={`${s.tag} inline-block mt-0.5 rounded font-black uppercase tracking-wider bg-black/40 ${rarity.text}`}>
          {rarity.label}
        </span>
      </div>
    </button>
  );
};

export default StickerCard;

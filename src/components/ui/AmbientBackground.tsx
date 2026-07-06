import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none max-w-full"
      aria-hidden="true"
    >
      {/* Warm Amber / Soft Gold Ambient Glow (Top Right) */}
      <div className="absolute top-[-15%] right-[-10%] w-[60vw] h-[60vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-br from-amber-200/40 via-amber-100/30 to-transparent blur-[130px] opacity-70 sm:opacity-100" />

      {/* Subtle Metallic Silver / Cool Neutral Ambient Glow (Bottom Left) */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[55vw] h-[55vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-tr from-slate-200/50 via-stone-200/40 to-transparent blur-[140px] opacity-60 sm:opacity-90" />

      {/* Soft Ivory / Warm Neutral Central Atmosphere Glow */}
      <div className="absolute top-[35%] left-[20%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full bg-amber-50/60 blur-[150px] opacity-50 sm:opacity-80" />
    </div>
  );
};

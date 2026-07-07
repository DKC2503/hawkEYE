import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCityConfig } from '../config/cityBackgrounds';

// Use the original high-resolution asset instead of the compressed temporary preview
import visakhapatnamSkyToCity from '../assets/hero/visakhapatnam-sky-to-city.jpg';

import eyeLogo from '../assets/logo_cropped.png';
import titleImg from '../assets/Title_clean.png';

const customStyles = `
  @keyframes glassPlateEntrance {
    from { opacity: 0; transform: translateY(-18px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes glassPlateFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  @keyframes eyeEntrance {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes wordmarkEntrance {
    from { opacity: 0; transform: translateX(24px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-plate-entrance {
    animation: 
      glassPlateEntrance 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards,
      glassPlateFloat 6s ease-in-out 900ms infinite forwards;
  }
  .animate-eye-entrance {
    opacity: 0;
    animation: eyeEntrance 800ms cubic-bezier(0.22, 1, 0.36, 1) 250ms forwards;
  }
  .animate-wordmark-entrance {
    opacity: 0;
    animation: wordmarkEntrance 900ms cubic-bezier(0.22, 1, 0.36, 1) 350ms forwards;
  }

  :root {
    --brand-lockup-width: clamp(520px, 48vw, 850px);
    --brand-gap: clamp(16px, 2.5vw, 32px);
    --scroll-bottom: 2rem;
    --loc-top: 2rem;
    --loc-left: 2rem;
    --loc-font: inherit;
  }
  
  @media (max-width: 767px) {
    :root {
      --brand-lockup-width: clamp(300px, 88vw, 520px);
      --brand-gap: clamp(12px, 2vw, 20px);
      --scroll-bottom: max(28px, env(safe-area-inset-bottom));
      --loc-top: 28px;
      --loc-left: 24px;
      --loc-font: clamp(14px, 4vw, 18px);
    }
  }
`;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCityKey] = useState<string>('visakhapatnam');
  const currentCityConfig = useMemo(() => getCityConfig(selectedCityKey), [selectedCityKey]);

  // Root container ref for scroll hijacking (to guarantee one-tick -> one-screen)
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) {
        e.preventDefault();
        return;
      }

      if (e.deltaY > 0 && container.scrollTop < window.innerHeight / 2) {
        e.preventDefault();
        isScrolling = true;
        container.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        setTimeout(() => { isScrolling = false; }, 800);
      }
      else if (e.deltaY < 0 && container.scrollTop > window.innerHeight / 2) {
        e.preventDefault();
        isScrolling = true;
        container.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { isScrolling = false; }, 800);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <>
    <style>{customStyles}</style>
    <div 
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-y-auto overflow-x-hidden font-sans select-none bg-[#020617]"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {/* 
        CONTINUOUS HIGH-RES BACKGROUND IMAGE
        Explicitly 200dvh tall. No scale transforms, no blur filters.
      */}
      <div className="absolute top-0 left-0 w-full h-[200dvh] z-0 pointer-events-none overflow-hidden">
        <img
          src={visakhapatnamSkyToCity}
          alt={currentCityConfig.displayName}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ 
            imageRendering: 'auto',
            filter: 'none'
          }}
        />
        {/* Subtle dark overlay for entire 200dvh to ensure readability without blurring the image */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* SCREEN 1: CITY HERO (UPPER HALF) */}
      <section className="relative w-full h-[100dvh] min-h-[100dvh] z-10 bg-transparent overflow-hidden" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', boxSizing: 'border-box' }}>
        
        {/* CENTER BRAND IDENTITY (Unified Mobile & Desktop) */}
        <div className="absolute top-[48%] md:top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center w-[calc(100%-40px)] md:w-full max-w-[420px] md:max-w-none px-4 md:px-0">
          <div 
            className="flex items-center justify-center w-full animate-plate-entrance mx-auto"
            style={{ width: 'var(--brand-lockup-width)', gap: 'var(--brand-gap)' }}
          >
            {/* EYE SYMBOL */}
            <img 
              src={eyeLogo} 
              alt="hawkEYE icon"
              className="animate-eye-entrance object-contain shrink-0 w-1/4 md:w-[22%]"
              style={{
                height: 'auto',
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 24px rgba(0, 0, 0, 0.4))',
                opacity: 1 // Managed by animation
              }}
            />
            {/* WORDMARK IMAGE */}
            <img 
              src={titleImg}
              alt="hawkEYE Title"
              className="animate-wordmark-entrance object-contain flex-1 shrink-0 min-w-0"
              style={{ 
                height: 'auto',
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.75))',
                opacity: 1 // Managed by animation
              }}
            />
          </div>

          {/* TAGLINE */}
          <div 
            className="animate-wordmark-entrance mt-6 text-white font-medium text-center uppercase"
            style={{ 
              letterSpacing: '0.15em', 
              fontSize: 'clamp(0.85rem, 1.8vw, 1.15rem)',
              textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.6)',
              opacity: 1
            }}
          >
            SEE WHAT MATTERS. CHANGE WHAT FOLLOWS.
          </div>
        </div>

        {/* Top-Left Location */}
        <div 
          className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3"
          style={{ top: 'var(--loc-top)', left: 'var(--loc-left)' }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <h2 
            className="text-white font-bold tracking-widest uppercase drop-shadow-md"
            style={{ fontSize: 'var(--loc-font)' }}
          >
            {currentCityConfig.displayName} LIVE
          </h2>
        </div>

        {/* Top-Right Weather */}
        <div className="absolute top-[28px] right-6 md:top-12 md:right-12 flex items-center gap-1.5 md:gap-2 text-white/90 font-medium bg-black/20 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 text-xs md:text-sm">
          <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="drop-shadow-md">28°C / Clear</span>
        </div>

        {/* Bottom-Center Scroll Indicator */}
        <div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-90 animate-bounce cursor-pointer" 
          onClick={() => containerRef.current?.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          style={{ bottom: 'var(--scroll-bottom)', left: '50%', transform: 'translateX(-50%)', zIndex: 30, whiteSpace: 'nowrap' }}
        >
          <span className="text-white/90 text-xs font-bold tracking-[0.2em] uppercase drop-shadow-md">Scroll to Explore</span>
          <svg className="w-6 h-6 text-white/90 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* SCREEN 2: ACTION DASHBOARD (LOWER HALF / REFLECTION) */}
      <section className="relative w-full h-[100dvh] flex flex-col z-10 bg-transparent" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        
        <div className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-12 relative flex flex-col items-center justify-center">
          
          {/* Top-Left Action */}
          <div className="absolute top-6 left-6 md:top-12 md:left-12">
            <button 
              onClick={() => navigate('/citizen/report')}
              className="px-6 py-3 text-white rounded-full font-bold text-sm transition-colors flex items-center gap-2"
              style={{
                background: 'rgba(5, 15, 28, 0.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 50px rgba(0,0,0,0.22)'
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              REPORT AN ISSUE
            </button>
          </div>

          {/* Center Nearby Issue Card */}
          <div 
            className="w-full max-w-lg rounded-3xl p-8 flex flex-col items-center text-center gap-4"
            style={{
              background: 'rgba(5, 15, 28, 0.45)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 50px rgba(0,0,0,0.22)'
            }}
          >
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-1 border border-white/20">
              <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">NO NEARBY ISSUES REPORTED</h3>
            <p className="text-white/70 text-sm max-w-sm leading-relaxed">
              Your immediate area is currently clear. If you spot a civic problem, you can be the first to report it.
            </p>
            <button 
              onClick={() => navigate('/citizen/report')}
              className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-sm transition-colors border border-white/20"
            >
              REPORT THE FIRST ISSUE
            </button>
          </div>

          {/* Bottom-Center View Map */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <button 
              onClick={() => navigate('/citizen/map')}
              className="px-8 py-3 text-white rounded-full font-bold text-sm transition-colors flex items-center gap-2"
              style={{
                background: 'rgba(5, 15, 28, 0.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 50px rgba(0,0,0,0.22)'
              }}
            >
              <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              VIEW MAP
            </button>
          </div>

        </div>
      </section>

    </div>
    </>
  );
};

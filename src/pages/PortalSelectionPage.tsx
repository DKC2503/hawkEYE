import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo_cropped.png';
import titleImg from '../assets/Title_clean.png';

const FadeIn: React.FC<{ children: React.ReactNode, delay: number, duration?: number, className?: string }> = ({ children, delay, duration = 1000, className = "" }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        filter: visible ? 'blur(0)' : 'blur(10px)',
        transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {children}
    </div>
  );
};

const AnimatedHeading = ({ isFadingOut }: { isFadingOut: boolean }) => {
  const line1 = "SEE WHAT MATTERS.";
  const line2 = "CHANGE WHAT FOLLOWS.";
  const charDelay = 30;
  const initialDelay = 200;

  const renderLine = (line: string, startIndex: number) => {
    const words = line.split(" ");
    let charCounter = startIndex;
    return words.map((word, wordIndex) => {
      const wordNode = (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {word.split("").map((char, charIndex) => {
            const delay = initialDelay + (charCounter * charDelay);
            charCounter++;
            return (
              <span
                key={charIndex}
                className="inline-block opacity-0 animate-[charFadeIn_500ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
                style={{ animationDelay: `${delay}ms` }}
              >
                {char}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && (
            <span
              className="inline-block opacity-0 animate-[charFadeIn_500ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
              style={{ animationDelay: `${initialDelay + (charCounter * charDelay)}ms` }}
            >
              &nbsp;
            </span>
          )}
        </span>
      );
      if (wordIndex < words.length - 1) charCounter++;
      return wordNode;
    });
  };

  return (
    <h1 
      className={`font-normal tracking-[-0.04em] leading-[0.98] sm:leading-[1.05] drop-shadow-2xl transition-all duration-700 ${isFadingOut ? 'opacity-40 -translate-x-4 blur-sm' : 'opacity-100 translate-x-0'}`}
      style={{ fontSize: 'clamp(2.8rem, 4.8vw, 6.5rem)' }}
    >
      <div className="text-white block">
        {renderLine(line1, 0)}
      </div>
      <div className="mt-2 block" style={{ color: '#bae6fd' }}>
        {renderLine(line2, line1.length)}
      </div>
    </h1>
  );
};

export const PortalSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);
  const [clickedPortal, setClickedPortal] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error("Video playback failed on mount:", e));
    }
  }, []);

  const portals = [
    { id: 'citizen', num: '01', role: 'SEE', title: 'CITIZEN', hover: 'Report. Support. Track.', accent: 'bg-[#fbbf24]', path: '/citizen', delay: 1000 },
    { id: 'authority', num: '02', role: 'ACT', title: 'AUTHORITY', hover: 'Verify. Prioritize. Assign.', accent: 'bg-[#22d3ee]', path: '/authority', delay: 1150 },
    { id: 'artisan', num: '03', role: 'FIX', title: 'ARTISAN', hover: 'Accept. Repair. Prove.', accent: 'bg-[#f97316]', path: '/artisan', delay: 1300 },
  ];

  const transitionMessages = {
    citizen: "SEE THE CITY.",
    authority: "ACT ON WHAT MATTERS.",
    artisan: "FIX WHAT FOLLOWS."
  };

  const handlePortalClick = (id: string, path: string) => {
    if (clickedPortal) return; // prevent repeated clicks
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      navigate(path);
      return;
    }

    setClickedPortal(id);
    setTimeout(() => {
      navigate(path);
    }, 750);
  };

  return (
    <div 
      className="relative w-full h-[100dvh] overflow-hidden bg-black text-white flex flex-col"
      style={{
        fontFamily: "'Inter', sans-serif",
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}
    >
      
      {/* Z-INDEX 0: Background Video */}
      <video
        ref={videoRef}
        className={`video-cinematic-motion absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${clickedPortal ? 'scale-110' : ''}`}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => console.log('Video loaded data')}
        onCanPlay={() => console.log('Video can play')}
        onError={(e) => console.error('Video error:', e)}
        style={{ 
          zIndex: 0,
          filter: 'brightness(0.62) contrast(1.12) saturate(0.78) hue-rotate(8deg)',
        }}
      />
      
      {/* Z-INDEX 1: NIGHT COLOR GRADE */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          zIndex: 1,
          background: 'linear-gradient(135deg, rgba(2, 8, 20, 0.42) 0%, rgba(3, 28, 54, 0.24) 45%, rgba(0, 82, 130, 0.10) 100%)',
          mixBlendMode: 'multiply',
          opacity: 0.72
        }} 
      />

      {/* Z-INDEX 2: BLUE-HOUR ATMOSPHERE */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          zIndex: 2,
          background: 'radial-gradient(ellipse at 72% 38%, rgba(60, 160, 220, 0.12), transparent 42%)',
          mixBlendMode: 'screen',
          opacity: 0.65
        }} 
      />

      {/* Z-INDEX 3: VIGNETTE */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          zIndex: 3,
          background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0, 5, 14, 0.22) 75%, rgba(0, 4, 12, 0.46) 100%)'
        }} 
      />

      {/* Z-INDEX 4: OPTIONAL SLOW LIGHT SWEEP */}
      <div 
        className="absolute inset-0 pointer-events-none sweep-animation" 
        style={{
          zIndex: 4,
          background: 'linear-gradient(90deg, transparent 0%, rgba(80,180,255,0.035) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }} 
      />

      {/* Z-INDEX 10: ALL PAGE CONTENT */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-screen-2xl mx-auto p-6 md:p-12 lg:p-16">
        
        {/* Cinematic Dark Glass Brand Island (Compact & Top-Left) */}
        <header className="animate-brand-entrance absolute top-4 left-4 right-4 md:top-[24px] md:left-[24px] md:right-auto md:w-fit lg:top-[32px] lg:left-[48px] xl:left-[64px] z-20 cinematic-brand-island h-[75px] md:h-[90px] lg:h-[110px] py-[8px] px-[16px] md:px-[20px] rounded-[20px] lg:rounded-[24px] flex items-center justify-center overflow-visible">
          
          {/* Soft feathered glow ::after replacement */}
          <div 
            className="absolute -inset-[24px] md:-inset-[32px] lg:-inset-[40px] pointer-events-none"
            style={{
              zIndex: -1,
              background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.42) 0%, rgba(0, 18, 36, 0.22) 48%, transparent 74%)',
              filter: 'blur(22px)'
            }}
          />

          {/* Top Edge Reflection ::before replacement */}
          <div 
            className="absolute top-0 left-[8%] right-[8%] h-[1px] opacity-75"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), rgba(80,180,255,0.28), transparent)'
            }}
          />

          {/* Centered Logo Content */}
          <div className="flex flex-row items-center justify-center gap-[16px] md:gap-[28px] lg:gap-[36px] w-full h-full relative z-10">
            <img 
              src={logoImg} 
              alt="hawkEYE Icon" 
              className="w-[60px] md:w-[95px] lg:w-[115px] max-w-none h-auto object-contain shrink-0"
              style={{
                opacity: 1,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.80)) drop-shadow(0 0 18px rgba(60,170,255,0.12))'
              }}
            />
            <img 
              src={titleImg} 
              alt="hawkEYE Title" 
              className="w-[200px] md:w-[330px] lg:w-[380px] max-w-none h-auto object-contain shrink-0" 
              style={{
                opacity: 1,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.80)) drop-shadow(0 0 18px rgba(60,170,255,0.12))'
              }}
            />
          </div>
        </header>

        {/* Asymmetrical Layout Content */}
        <main className="flex-1 flex flex-col lg:flex-row items-end lg:items-center justify-between w-full h-full gap-12 lg:gap-8 pt-24 pb-12 lg:pb-0 relative z-20 overflow-y-auto lg:overflow-hidden">
          
          {/* LEFT: Main Heading Area */}
          <div className="w-full lg:w-[55%] flex flex-col justify-end lg:justify-center mb-8 lg:mb-0 relative min-h-[160px] lg:min-h-0">
            <div className={`transition-all duration-700 ${clickedPortal ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100 relative'}`}>
              <AnimatedHeading isFadingOut={clickedPortal !== null} />
              <FadeIn delay={900} duration={1000} className="mt-8">
                <p className="text-base md:text-lg lg:text-xl text-white/70 font-light tracking-wide">
                  One city. Three forces. One path from report to resolution.
                </p>
              </FadeIn>
            </div>
            
            {/* Click Transition Message */}
            <div className={`absolute bottom-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 text-2xl md:text-3xl lg:text-4xl font-light tracking-widest text-white/90 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${clickedPortal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
              {clickedPortal && transitionMessages[clickedPortal as keyof typeof transitionMessages]}
            </div>
          </div>

          {/* RIGHT: Portals */}
          <div className="w-full lg:w-[40%] flex flex-col items-center lg:items-end justify-end lg:justify-center gap-4">
            <div className="flex flex-col w-full max-w-sm lg:max-w-md gap-4">
              {portals.map((portal) => {
                const isHovered = hoveredPortal === portal.id;
                const isOtherHovered = hoveredPortal !== null && hoveredPortal !== portal.id;
                const isClicked = clickedPortal === portal.id;
                const isOtherClicked = clickedPortal !== null && clickedPortal !== portal.id;

                return (
                  <FadeIn key={portal.id} delay={portal.delay} duration={800} className="w-full">
                    <div
                      onMouseEnter={() => setHoveredPortal(portal.id)}
                      onMouseLeave={() => setHoveredPortal(null)}
                      onClick={() => handlePortalClick(portal.id, portal.path)}
                      className={`liquid-glass group cursor-pointer relative flex items-center justify-between px-8 py-5 md:py-6 rounded-2xl transition-all duration-500 w-full overflow-hidden
                        ${isClicked ? 'scale-[1.03] opacity-100 bg-white/10' : ''}
                        ${isOtherClicked ? 'opacity-0 scale-95 pointer-events-none' : ''}
                        ${!clickedPortal && isHovered ? 'scale-[1.02] bg-white/5' : ''}
                        ${!clickedPortal && isOtherHovered ? 'opacity-50 scale-[0.98]' : 'opacity-100'}
                      `}
                    >
                      {/* Accent Line */}
                      <div className={`absolute bottom-0 left-0 h-[3px] w-0 lg:group-hover:w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${portal.accent}`} />
                      
                      {/* Left Content */}
                      <div className={`flex flex-col gap-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:group-hover:-translate-y-1`}>
                        <div className="text-white/40 text-[10px] tracking-[0.2em] font-semibold">{portal.num}</div>
                        <div className="text-white text-xl md:text-2xl font-black tracking-widest uppercase lg:group-hover:text-transparent lg:group-hover:bg-clip-text lg:group-hover:bg-gradient-to-r lg:group-hover:from-white lg:group-hover:to-white/70 transition-all">{portal.title}</div>
                        <div className={`text-xs tracking-[0.3em] font-bold uppercase transition-colors duration-300 lg:group-hover:text-white/90 ${isHovered ? 'text-white/80' : 'text-white/40'}`}>{portal.role}</div>
                      </div>

                      {/* Right Hidden Content (Hover Text) */}
                      <div className={`absolute right-8 top-1/2 -translate-y-1/2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col items-end ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 lg:pointer-events-none hidden lg:flex'}`}>
                        <span className="text-white/80 font-medium tracking-[0.15em] text-xs lg:text-sm text-right leading-relaxed max-w-[120px]">
                          {portal.hover.split('. ').map((line, i) => (
                            <React.Fragment key={i}>
                              {line}{i < 2 ? '.\n' : ''}
                              {i < 2 && <br />}
                            </React.Fragment>
                          ))}
                        </span>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </main>

        {/* BOTTOM RIGHT: Workflow Statement */}
        <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 z-20">
          <FadeIn delay={1450} duration={1000}>
            <div className={`liquid-glass px-5 md:px-6 py-3 rounded-full transition-opacity duration-500 ${clickedPortal ? 'opacity-0' : 'opacity-100'}`}>
              <span className="text-xs md:text-sm lg:text-base font-light tracking-[0.3em] text-white/70 uppercase">
                SEEING. ACTING. FIXING.
              </span>
            </div>
          </FadeIn>
        </div>

        {/* BOTTOM LEFT: Demonstration Notice */}
        <div className="absolute bottom-6 md:bottom-[24px] lg:bottom-[32px] left-0 right-0 md:right-auto md:left-[24px] lg:left-[48px] xl:left-[64px] z-20 pointer-events-none px-4 md:px-0">
          <FadeIn delay={1500} duration={1000}>
            <div className={`transition-opacity duration-500 ${clickedPortal ? 'opacity-0' : 'opacity-100'}`}>
              <div 
                className="text-center md:text-left text-[9px] sm:text-[10px] md:text-[11px] font-medium uppercase tracking-[0.14em]"
                style={{ color: 'rgba(255, 255, 255, 0.48)' }}
              >
                — DEMONSTRATION PORTAL · FOR EVALUATION PURPOSES ONLY
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
      
      <style>{`
        @keyframes charFadeIn {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scanSweep {
          0% { background-position: 200% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes cinematicCamera {
          0% { transform: scale(1.00); }
          100% { transform: scale(1.035); }
        }
        .video-cinematic-motion {
          animation: cinematicCamera 20s ease-in-out infinite alternate;
        }
        .sweep-animation {
          animation: scanSweep 15s linear infinite;
        }
        .cinematic-brand-island {
          background: linear-gradient(135deg, rgba(4, 10, 18, 0.78) 0%, rgba(7, 20, 34, 0.60) 52%, rgba(8, 34, 55, 0.46) 100%);
          backdrop-filter: blur(18px) saturate(125%);
          -webkit-backdrop-filter: blur(18px) saturate(125%);
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 22px 70px rgba(0,0,0,0.30);
        }
        .liquid-glass {
          background: rgba(0, 0, 0, 0.30);
          background-blend-mode: luminosity;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12);
          position: relative;
        }
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.34) 0%,
            rgba(255,255,255,0.12) 20%,
            rgba(255,255,255,0) 40%,
            rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.10) 80%,
            rgba(255,255,255,0.28) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

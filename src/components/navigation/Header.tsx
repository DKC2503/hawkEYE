import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HawkEyeBrand } from '../brand/HawkEyeBrand';
import { DesktopNav } from './DesktopNav';
import { GlassDropdown, type GlassDropdownOption } from '../ui/GlassDropdown';

const cityOptions: GlassDropdownOption[] = [
  { value: 'visakhapatnam', label: 'Visakhapatnam', description: 'Smart Port Zone' },
  { value: 'hyderabad', label: 'Hyderabad', description: 'GHMC Zone' },
  { value: 'delhi', label: 'Delhi NCR', description: 'Capital Territory Zone' },
];

interface HeaderProps {
  variant?: 'dark' | 'light';
  selectedCityKey?: string;
  onCityChange?: (city: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  variant,
  selectedCityKey = 'visakhapatnam',
  onCityChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const effectiveVariant = variant || (isHomePage ? 'dark' : 'light');
  const isLight = effectiveVariant === 'light';

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/map?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleCitySelect = (val: string) => {
    if (onCityChange) {
      onCityChange(val);
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full px-4 sm:px-6 md:px-10 py-3 transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between lg:grid lg:grid-cols-[minmax(230px,1fr)_auto_minmax(380px,1fr)] gap-3">
        {/* LEFT: Unified Brand Capsule */}
        <div className="flex-shrink-0">
          <HawkEyeBrand
            variant={effectiveVariant}
            onClick={() => navigate('/')}
          />
        </div>

        {/* CENTER: Main Navigation Links */}
        <div className="hidden lg:flex justify-self-center">
          <DesktopNav variant={effectiveVariant} />
        </div>

        {/* RIGHT: Search + City Selector + Citizen Status */}
        <div className="hidden sm:flex items-center gap-2.5 justify-self-end">
          {/* Search Input Control */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 animate-page-transition">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search area or issue..."
                  autoFocus
                  className={`w-48 sm:w-56 px-3.5 py-2 rounded-full text-xs font-sans border outline-none backdrop-blur-md transition-all ${
                    isLight
                      ? 'bg-white/90 text-slate-900 border-slate-300 focus:border-slate-800'
                      : 'bg-slate-950/80 text-white border-white/20 focus:border-amber-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={`h-11 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-sans transition-all ${
                  isLight ? 'liquid-glass-light text-slate-700' : 'liquid-glass text-slate-300'
                }`}
                title="Search City Reports"
              >
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden md:inline font-medium">Search</span>
              </button>
            )}
          </div>

          {/* City Selector */}
          <div>
            <GlassDropdown
              options={cityOptions}
              value={selectedCityKey}
              onChange={handleCitySelect}
              variant="city"
              ariaLabel="Select City Zone"
              icon={
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </div>

          {/* Citizen Live Session Indicator */}
          <button
            type="button"
            onClick={() => navigate('/issues')}
            className={`h-11 px-4 rounded-full font-sans text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
              isLight
                ? 'bg-slate-900 text-slate-100 hover:bg-slate-800'
                : 'liquid-glass text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Citizen</span>
          </button>
        </div>

        {/* Mobile Hamburger Control */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2.5 rounded-full ${isLight ? 'liquid-glass-light text-slate-900' : 'liquid-glass text-white'}`}
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Panel Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop (z-index 900) */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900]"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Panel (z-index 910) */}
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-[#faf8f5] z-[910] flex flex-col p-6 font-sans animate-page-transition">
            
            {/* Header inside Menu (z-index 920) */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 z-[920]">
              <HawkEyeBrand
                variant="light"
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-full bg-slate-200 text-slate-800"
                aria-label="Close Navigation Menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Navigation Options */}
            <div className="flex-1 py-8 flex flex-col gap-4 overflow-y-auto">
              <button
                onClick={() => { navigate('/map'); setMobileMenuOpen(false); }}
                className={`flex items-center justify-between p-4 rounded-2xl text-left text-sm font-bold transition-all ${
                  location.pathname === '/map' ? 'bg-amber-500/15 text-amber-950 border border-amber-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">🗺️</span>
                  <span>City Map</span>
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => { navigate('/report'); setMobileMenuOpen(false); }}
                className={`flex items-center justify-between p-4 rounded-2xl text-left text-sm font-bold transition-all ${
                  location.pathname === '/report' ? 'bg-amber-500/15 text-amber-950 border border-amber-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">📷</span>
                  <span>Report Issue</span>
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => { navigate('/issues'); setMobileMenuOpen(false); }}
                className={`flex items-center justify-between p-4 rounded-2xl text-left text-sm font-bold transition-all ${
                  location.pathname === '/issues' ? 'bg-amber-500/15 text-amber-950 border border-amber-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">📋</span>
                  <span>My Reports</span>
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => { navigate('/transparency'); setMobileMenuOpen(false); }}
                className={`flex items-center justify-between p-4 rounded-2xl text-left text-sm font-bold transition-all ${
                  location.pathname === '/transparency' ? 'bg-amber-500/15 text-amber-950 border border-amber-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">📊</span>
                  <span>How It Works</span>
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
          </div>
        </>
      )}
    </header>
  );
};

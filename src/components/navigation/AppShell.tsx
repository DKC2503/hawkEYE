import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { AmbientBackground } from '../ui/AmbientBackground';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/citizen' || location.pathname === '/citizen/';

  if (isHomePage) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col relative selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
        <main className="flex-1 w-full z-10 relative">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col relative selection:bg-amber-500/20 selection:text-amber-900 overflow-x-hidden">
      {/* Reusable Fixed Ambient Background Glow Layer */}
      <AmbientBackground />

      {/* Top Navigation Header */}
      <Header />

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-28 md:pb-8 z-10 relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

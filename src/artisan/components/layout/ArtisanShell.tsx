import React from 'react';
import { ArtisanHeader } from './ArtisanHeader';

interface ArtisanShellProps {
  children: React.ReactNode;
}

export const ArtisanShell: React.FC<ArtisanShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#171A1F] font-sans flex flex-col relative overflow-x-hidden selection:bg-[#E8890C]/20 selection:text-[#9C4F08]">
      {/* Background Subtle Gradient overlay if needed, else plain #F4F0E8 */}
      <div className="fixed inset-0 pointer-events-none z-0" />

      {/* Persistent Artisan Header */}
      <ArtisanHeader />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(23,26,31,0.12)] py-4 px-6 text-center text-[11px] font-mono text-[#66645F] relative z-10 bg-[#FFFDF8]/80 backdrop-blur-md">
        Visakhapatnam Municipal Corporation • Official Artisan Field Operations Portal
      </footer>
    </div>
  );
};

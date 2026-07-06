import React, { useState } from 'react';
import { AuthoritySidebar } from './AuthoritySidebar';
import { AuthorityTopBar } from './AuthorityTopBar';
import '../../styles/authority-tokens.css';
import '../../styles/authority-popups.css';

interface AuthorityShellProps {
  children: React.ReactNode;
}

export const AuthorityShell: React.FC<AuthorityShellProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="authority-dark-root min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Subtle Ambient Background Warm Amber Glow */}
      <div className="fixed inset-0 pointer-events-none auth-amber-glow-bg z-0" />

      <div className="flex flex-1 z-10 min-h-screen">
        {/* Isolated Authority Sidebar Navigation */}
        <AuthoritySidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AuthorityTopBar onToggleSidebar={() => setCollapsed(!collapsed)} />

          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import titleImg from '../../assets/Title.png';
import '../styles/authority-tokens.css';

export const AuthorityLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const handlePreparedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Prepared navigation to authority operational command
    navigate('/authority');
  };

  return (
    <div className="authority-dark-root min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none auth-amber-glow-bg z-0" />

      <div className="w-full max-w-md auth-glass-elevated rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 relative z-10 shadow-2xl">
        <div className="text-center space-y-3">
          <img src={logoImg} alt="hawkEYE Logo" className="w-14 h-14 object-contain mx-auto" />
          <img src={titleImg} alt="hawkEYE Title" className="h-6 object-contain brightness-200 invert mx-auto" />
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            Municipal Authority Portal
          </div>
        </div>

        <form onSubmit={handlePreparedLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase text-slate-400 font-bold">
              Official Employee / Worker ID
            </label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. EMP-4019"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-amber-500 transition-colors font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase text-slate-400 font-bold">
              Secure Security Credentials
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              Access Command Center
            </button>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
          Visakhapatnam Municipal Corporation • Restricted Portal
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import titleImg from '../../assets/Title.png';
import { artisanAuthService } from '../../services/artisanAuthService';
import { artisanApiClient } from '../../services/artisanApiClient';

export const ArtisanLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Firebase Email + Password Sign In
      await artisanAuthService.loginWithEmail(email, password);

      // 2. Validate Artisan Profile & UID Binding with Backend
      await artisanApiClient.getProfile();

      // 3. Navigate to Artisan Portal Dashboard
      navigate('/artisan');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate Artisan session. Verify email & password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#171A1F] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none  z-0" />

      <div className="w-full max-w-md bg-[#FFFDF8] rounded-3xl p-6 sm:p-8 space-y-6 border border-[rgba(23,26,31,0.15)] relative z-10 shadow-2xl">
        <div className="text-center space-y-3">
          <img src={logoImg} alt="hawkEYE Logo" className="w-14 h-14 object-contain mx-auto" />
          <img src={titleImg} alt="hawkEYE Title" className="h-6 object-contain brightness-0 mx-auto" />
          <div className="inline-block px-3 py-1 rounded-full bg-[#E8890C]/10 border border-[#E8890C]/30 text-[#9C4F08] text-xs font-mono font-bold">
            Artisan Field Operations Portal
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold space-y-1">
            <div>Authentication Failed</div>
            <div className="text-[11px] font-mono text-red-600">{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase text-[#66645F] font-bold">
              Official Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. karthikdaraworks@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.15)] text-sm text-[#171A1F] placeholder:text-[#66645F] outline-none focus:border-[#E8890C]/50 transition-colors font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase text-[#66645F] font-bold">
              Secure Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.15)] text-sm text-[#171A1F] placeholder:text-[#66645F] outline-none focus:border-[#E8890C]/50 transition-colors"
            />
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#E8890C] hover:bg-[#9C4F08] text-white font-extrabold text-sm transition-all shadow-lg shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Authenticating Artisan...</span>
                </>
              ) : (
                <span>Access Artisan Portal &rarr;</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/artisan')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FFFDF8] hover:bg-[#ECE6DA] text-[#9C4F08] border border-[#E8890C]/40 font-bold text-xs transition-all flex items-center justify-center gap-2 font-mono"
            >
              <span>⚡ Enter Portal Instantly (Dev Bypass)</span>
            </button>
          </div>
        </form>

        <div className="p-3.5 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.15)] text-[11px] font-mono text-[#66645F] space-y-1">
          <div className="text-[#171A1F] font-bold">Active Worker Profiles:</div>
          <div>1. Vignesh: <span className="text-[#9C4F08] font-bold">karthikdaraworks@gmail.com</span></div>
          <div>2. Karthik D: <span className="text-[#9C4F08] font-bold">karthikchaitanya082@gmail.com</span></div>
        </div>

        <div className="text-center text-[11px] text-[#66645F] font-mono pt-2 border-t border-[rgba(23,26,31,0.15)]/80">
          Visakhapatnam Municipal Corporation • Field Specialist Portal
        </div>
      </div>
    </div>
  );
};

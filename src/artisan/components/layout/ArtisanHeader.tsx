import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoImg from '../../../assets/logo_cropped.png';
import titleImg from '../../../assets/Title_cropped.png';
import { artisanApiClient, type ArtisanProfile } from '../../../services/artisanApiClient';
import { artisanAuthService } from '../../../services/artisanAuthService';

export const ArtisanHeader: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await artisanApiClient.getProfile();
        setProfile(data);
      } catch {
        // Silently ignore if unauthenticated or error
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await artisanAuthService.logout();
      navigate('/artisan/login');
    } catch {
      navigate('/artisan/login');
    }
  };

  const navItems = [
    { to: '/artisan', end: true, label: 'Dashboard' },
    { to: '/artisan/assignments', end: false, label: 'My Assignments' },
    { to: '/artisan/history', end: false, label: 'Work History' },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'AP';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-[rgba(255,253,248,0.92)] backdrop-blur-xl border-b border-[rgba(23,26,31,0.12)] px-4 sm:px-8 py-3 select-none min-h-[96px] flex items-center">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <NavLink to="/artisan" className="flex items-center gap-4">
            <img src={logoImg} alt="hawkEYE Logo" className="w-[60px] h-[60px] object-contain shrink-0" />
            <div className="flex flex-col gap-1">
              <img src={titleImg} alt="hawkEYE Title" className="w-[180px] h-auto object-contain" />
              <span className="text-[15px] font-sans font-extrabold tracking-[0.1em] text-[#E8890C] uppercase mt-0.5 whitespace-nowrap">
                ARTISAN FIELD PORTAL
              </span>
            </div>
          </NavLink>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-[#ECE6DA] p-1.5 rounded-xl border border-[rgba(23,26,31,0.12)]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#E8890C] text-white font-bold shadow-sm'
                    : 'text-[#66645F] hover:text-[#171A1F] hover:bg-[#FFFDF8]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Top Right Worker Profile */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.12)] hover:border-[#E8890C]/50 transition-all text-left shadow-sm"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-[#E8890C]/10 border border-[#E8890C]/30 text-[#9C4F08] flex items-center justify-center font-mono font-bold text-sm">
                {getInitials(profile?.fullName)}
              </div>
              <span className="w-3 h-3 rounded-full bg-[#16805B] border-2 border-[#FFFDF8] absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold text-[#171A1F] line-clamp-1">{profile?.fullName || 'Artisan Specialist'}</span>
              <span className="text-xs font-mono text-[#66645F]">{profile?.employeeCode || 'EMP-ACTIVE'}</span>
            </div>

            <svg className="w-4 h-4 text-[#66645F] ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-[#FFFDF8] rounded-2xl border border-[rgba(23,26,31,0.12)] p-2 shadow-xl shadow-black/5 z-50 space-y-1 font-sans text-sm">
              <div className="p-3 border-b border-[rgba(23,26,31,0.08)] space-y-1">
                <p className="font-bold text-[#171A1F]">{profile?.fullName || 'Artisan Worker'}</p>
                <p className="text-xs text-[#66645F] truncate">{profile?.officialEmail}</p>
                <span className="inline-block px-2 py-0.5 rounded bg-[#E8890C]/10 text-[#9C4F08] text-[10px] font-bold uppercase mt-1">
                  {profile?.department || 'Field Operations'}
                </span>
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowProfileModal(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-[#171A1F] hover:bg-[#ECE6DA] transition-colors font-semibold flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-[#9C4F08]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>View Full Profile</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-semibold flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Details Modal */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm font-sans">
          <div className="w-full max-w-md bg-[#FFFDF8] rounded-3xl p-6 space-y-4 border border-[rgba(23,26,31,0.12)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(23,26,31,0.08)] pb-3">
              <h3 className="text-lg font-bold text-[#171A1F] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#E8890C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Official Artisan Profile</span>
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-[#66645F] hover:text-[#171A1F] text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                <span className="text-[10px] text-[#66645F] uppercase block font-bold">Full Name</span>
                <span className="text-[#171A1F] font-bold text-base block">{profile.fullName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                  <span className="text-[10px] text-[#66645F] uppercase block font-bold">Employee Code</span>
                  <span className="text-[#9C4F08] font-bold block">{profile.employeeCode}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                  <span className="text-[10px] text-[#66645F] uppercase block font-bold">Account Status</span>
                  <span className="text-[#16805B] font-bold block">ACTIVE</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                <span className="text-[10px] text-[#66645F] uppercase block font-bold">Official Email</span>
                <span className="text-[#171A1F] block truncate">{profile.officialEmail}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                  <span className="text-[10px] text-[#66645F] uppercase block font-bold">Department</span>
                  <span className="text-[#171A1F] block">{profile.department}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                  <span className="text-[10px] text-[#66645F] uppercase block font-bold">Role Specialization</span>
                  <span className="text-[#171A1F] block">{profile.role}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                <span className="text-[10px] text-[#66645F] uppercase block font-bold">Assigned Shift</span>
                <span className="text-[#171A1F] block">
                  {profile.shift?.name} ({profile.shift?.startTime} - {profile.shift?.endTime})
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[rgba(23,26,31,0.08)]">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#E8890C] text-white hover:bg-[#9C4F08] transition-colors font-bold text-sm shadow-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

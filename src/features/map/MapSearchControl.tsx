import React, { useState } from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';

interface MapSearchControlProps {
  onSearch?: (query: string) => void;
  onLocateMe?: () => void;
  onOpenFilters?: () => void;
}

export const MapSearchControl: React.FC<MapSearchControlProps> = ({
  onSearch,
  onLocateMe,
  onOpenFilters,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  return (
    <div className="w-full max-w-lg space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <GlassSurface
          variant="elevated"
          rounded="2xl"
          className="p-1.5 flex items-center gap-2 border-slate-200/80 shadow-md backdrop-blur-xl bg-white/90"
        >
          <div className="pl-3 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city location, ward, or street..."
            className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400 py-1.5 px-1 font-normal"
          />

          {onOpenFilters && (
            <button
              type="button"
              onClick={onOpenFilters}
              aria-label="Filter options"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-ring"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}

          {onLocateMe && (
            <button
              type="button"
              onClick={onLocateMe}
              aria-label="Locate me"
              className="p-2 rounded-xl bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors focus-ring border border-amber-300/60"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </GlassSurface>
      </form>
    </div>
  );
};

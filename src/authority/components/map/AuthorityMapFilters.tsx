import React from 'react';

export type MapOperationalMode = 'active' | 'completed';

interface AuthorityMapFiltersProps {
  mapMode: MapOperationalMode;
  onSelectMapMode: (mode: MapOperationalMode) => void;
  activeCount: number;
  completedCount: number;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const AuthorityMapFilters: React.FC<AuthorityMapFiltersProps> = ({
  mapMode,
  onSelectMapMode,
  activeCount,
  completedCount,
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = [
    { id: 'all', label: 'All Hazards' },
    { id: 'pothole', label: 'Potholes' },
    { id: 'road_damage', label: 'Road Damage' },
    { id: 'water_leak', label: 'Water Leaks' },
    { id: 'garbage', label: 'Garbage' },
    { id: 'streetlight', label: 'Streetlights' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
      {/* Mode Toggle Tabs */}
      <div className="flex items-center gap-1.5 font-mono text-xs">
        <button
          onClick={() => onSelectMapMode('active')}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            mapMode === 'active'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>⚡ Active Incidents</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">{activeCount}</span>
        </button>

        <button
          onClick={() => onSelectMapMode('completed')}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            mapMode === 'completed'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>✔ Completed / Verified</span>
          <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">{completedCount}</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-xs">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
            className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-slate-800 text-amber-400 border border-amber-500/40 font-bold'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
};

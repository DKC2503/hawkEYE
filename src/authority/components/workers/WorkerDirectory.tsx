import React, { useState } from 'react';
import type { MunicipalWorker } from '../../types/authority';
import { WorkerCard } from './WorkerCard';

interface WorkerDirectoryProps {
  workers: MunicipalWorker[];
}

export const WorkerDirectory: React.FC<WorkerDirectoryProps> = ({ workers }) => {
  const [filterDept, setFilterDept] = useState<string>('all');

  const filteredWorkers = workers.filter((w) =>
    filterDept === 'all' ? true : w.department === filterDept
  );

  const departments = [
    'all',
    'Roads & Asphalt Works',
    'Sanitation & Waste Management',
    'Public Lighting & Electrical',
    'Water Supply & Drainage',
    'Infrastructure Repair',
  ];

  return (
    <div className="space-y-4">
      {/* Department Filter Bar */}
      <div className="auth-glass-surface p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
        <span className="text-xs font-mono text-slate-400 font-bold shrink-0">Filter Department:</span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setFilterDept(d)}
              className={`px-3 py-1.5 text-xs font-mono rounded-xl shrink-0 whitespace-nowrap transition-all ${
                filterDept === d
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {d === 'all' ? 'All Departments' : d}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </div>
    </div>
  );
};

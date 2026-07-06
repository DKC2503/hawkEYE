import React from 'react';

interface WorkerCreditDisplayProps {
  credits: number;
}

export const WorkerCreditDisplay: React.FC<WorkerCreditDisplayProps> = ({ credits }) => {
  let badgeLabel = 'Standard Field Crew';
  let badgeColor = 'text-slate-300 border-slate-700 bg-slate-800';

  if (credits >= 500) {
    badgeLabel = 'Master Dispatch Crew';
    badgeColor = 'text-amber-300 border-amber-500/50 bg-amber-500/10 shadow-sm shadow-amber-500/20';
  } else if (credits >= 350) {
    badgeLabel = 'Senior Responder';
    badgeColor = 'text-cyan-300 border-cyan-500/50 bg-cyan-500/10';
  } else if (credits >= 200) {
    badgeLabel = 'Active Field Specialist';
    badgeColor = 'text-emerald-300 border-emerald-500/50 bg-emerald-500/10';
  }

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono font-bold text-slate-200">{credits} Municipal Credits</span>
      </div>

      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${badgeColor}`}>
        {badgeLabel}
      </span>
    </div>
  );
};

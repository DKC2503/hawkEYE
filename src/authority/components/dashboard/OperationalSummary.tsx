import React from 'react';

interface OperationalSummaryProps {
  pendingCount?: number;
  criticalCount?: number;
  verificationRate?: string;
  activeWorkersCount?: number;
}

export const OperationalSummary: React.FC<OperationalSummaryProps> = ({
  pendingCount = 4,
  criticalCount = 2,
  verificationRate = '94.2%',
  activeWorkersCount = 2,
}) => {
  const metrics = [
    {
      label: 'Pending Triage Queue',
      value: pendingCount,
      subtext: 'Requires municipal verification',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Critical Safety Hazards',
      value: criticalCount,
      subtext: 'High hazard priority',
      color: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: 'AI Neural Confidence Rate',
      value: verificationRate,
      subtext: 'Gemini 2.5 Flash accuracy',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Active Field Crews',
      value: activeWorkersCount,
      subtext: 'On shift dispatch',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5-3.512M9 20H4v-2a3 3 0 015-3.512M12 11a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="auth-glass-surface rounded-2xl p-5 space-y-3 relative overflow-hidden border border-slate-800/80 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">{m.label}</span>
            <div className={`p-2 rounded-xl border ${m.color}`}>{m.icon}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight">{m.value}</div>
            <div className="text-xs text-slate-400 font-medium">{m.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

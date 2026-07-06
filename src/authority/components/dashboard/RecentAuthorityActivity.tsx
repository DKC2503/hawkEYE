import React from 'react';

export const RecentAuthorityActivity: React.FC = () => {
  const auditLogs = [
    {
      id: 'log-1',
      action: 'Work Order Dispatched',
      details: 'Assigned #HE-2026-B4C109 (Water Leak) to Rajesh Kumar (EMP-4019)',
      timestamp: '10 mins ago',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
    {
      id: 'log-2',
      action: 'Neural Assessment Verified',
      details: 'Gemini 2.5 Flash confirmed POTHOLE report #HE-2026-X8F92A (96% confidence)',
      timestamp: '25 mins ago',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    {
      id: 'log-3',
      action: 'Shift Attendance Logged',
      details: 'Anitha Rao (EMP-4031) checked in for Morning Shift (Roads & Asphalt)',
      timestamp: '1 hour ago',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    },
  ];

  return (
    <div className="auth-glass-surface rounded-2xl p-6 space-y-4 border border-slate-800/80">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-slate-100">Municipal Audit Log</h3>
        <span className="text-xs text-slate-400 font-mono">Live Dispatch Feed</span>
      </div>

      <div className="space-y-3">
        {auditLogs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 text-xs">
            <span className={`px-2 py-0.5 rounded border font-mono font-bold shrink-0 ${log.color}`}>
              {log.action}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 font-medium truncate">{log.details}</p>
              <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

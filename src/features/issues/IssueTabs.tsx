import React from 'react';

export type IssueTabFilter = 'all' | 'active' | 'resolved';

interface IssueTabsProps {
  activeTab: IssueTabFilter;
  onTabChange: (tab: IssueTabFilter) => void;
  counts?: { all: number; active: number; resolved: number };
}

export const IssueTabs: React.FC<IssueTabsProps> = ({
  activeTab,
  onTabChange,
  counts = { all: 0, active: 0, resolved: 0 },
}) => {
  const tabs: { id: IssueTabFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Reports', count: counts.all },
    { id: 'active', label: 'In Progress', count: counts.active },
    { id: 'resolved', label: 'Resolved', count: counts.resolved },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-subtle max-w-md bg-white/70">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all focus-ring ${
              isActive
                ? 'glass-elevated text-slate-900 border-slate-300/80 shadow-sm font-bold bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

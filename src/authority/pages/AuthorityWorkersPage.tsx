import React, { useState } from 'react';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import { WorkerDirectory } from '../components/workers/WorkerDirectory';
import { AssignmentPreview } from '../components/workers/AssignmentPreview';
import type { MunicipalWorker, TaskAssignment } from '../types/authority';

export const AuthorityWorkersPage: React.FC = () => {
  const [workers] = useState<MunicipalWorker[]>([]);
  const [assignments] = useState<TaskAssignment[]>([]);

  return (
    <AuthorityShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Municipal Workforce Directory
            </h1>
            <p className="text-xs text-slate-400">
              Shift scheduling, worker credit index, and active field assignments
            </p>
          </div>
        </div>

        {/* Shift Allocations Preview */}
        {assignments.length > 0 ? (
          <AssignmentPreview assignments={assignments} />
        ) : (
          <div className="p-6 text-center auth-glass-surface rounded-2xl border border-slate-800 space-y-1">
            <h4 className="text-sm font-bold text-slate-200">No Active Shift Allocations</h4>
            <p className="text-xs text-slate-400">Task dispatches will be displayed here when workers are assigned to reports.</p>
          </div>
        )}

        {/* Worker Directory Grid */}
        {workers.length > 0 ? (
          <WorkerDirectory workers={workers} />
        ) : (
          <div className="p-8 text-center auth-glass-surface rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-base font-bold text-slate-200">No Registered Municipal Employees</h4>
            <p className="text-xs text-slate-400">
              Municipal workers and department employees registered in the system will appear here.
            </p>
          </div>
        )}
      </div>
    </AuthorityShell>
  );
};

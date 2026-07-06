import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArtisanShell } from '../components/layout/ArtisanShell';
import { artisanApiClient, type ArtisanProfile, type ArtisanDashboardSummary, type ArtisanWorkOrder } from '../../services/artisanApiClient';

export const ArtisanDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [summary, setSummary] = useState<ArtisanDashboardSummary | null>(null);
  const [activeTasks, setActiveTasks] = useState<ArtisanWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profData, sumData, tasksData] = await Promise.all([
          artisanApiClient.getProfile(),
          artisanApiClient.getDashboardSummary(),
          artisanApiClient.getWorkOrders('all'),
        ]);

        setProfile(profData);
        setSummary(sumData);
        setActiveTasks(tasksData);
      } catch (err: any) {
        if (err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('ANONYMOUS')) {
          navigate('/artisan/login');
          return;
        }
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  return (
    <ArtisanShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(23,26,31,0.08)] pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#171A1F] tracking-tight flex items-center gap-2">
              <span>Operational Command Dashboard</span>
            </h1>
            <p className="text-sm text-[#66645F]">
              Welcome back, <strong className="text-[#9C4F08]">{profile?.fullName || 'Artisan'}</strong>. Here is your current field operational status and task queue.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/artisan/assignments"
              className="px-5 py-2.5 bg-[#E8890C] hover:bg-[#9C4F08] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>View My Assignments &rarr;</span>
            </NavLink>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 bg-red-100 hover:bg-red-200 border border-red-300 text-red-800 rounded-lg font-bold text-xs"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Real Summary Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[rgba(23,26,31,0.10)] shadow-[0_8px_28px_rgba(50,40,25,0.06)] space-y-1">
            <span className="text-[10px] font-mono text-[#66645F] font-bold uppercase tracking-wider block">
              Active Assignments
            </span>
            <div className="text-3xl font-extrabold text-[#171A1F]">
              {loading ? '...' : summary ? summary.allAssigned : '—'}
            </div>
            <span className="text-[10px] text-[#66645F] block">Total tasks assigned</span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[rgba(23,26,31,0.10)] shadow-[0_8px_28px_rgba(50,40,25,0.06)] space-y-1">
            <span className="text-[10px] font-mono text-[#E8890C] font-bold uppercase tracking-wider block">
              Pending
            </span>
            <div className="text-3xl font-extrabold text-[#9C4F08]">
              {loading ? '...' : summary ? summary.pending : '—'}
            </div>
            <span className="text-[10px] text-[#66645F] block">Requires action now</span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[rgba(23,26,31,0.10)] shadow-[0_8px_28px_rgba(50,40,25,0.06)] space-y-1">
            <span className="text-[10px] font-mono text-[#276E9E] font-bold uppercase tracking-wider block">
              In Progress
            </span>
            <div className="text-3xl font-extrabold text-[#276E9E]">
              {loading ? '...' : summary ? summary.inProgress : '—'}
            </div>
            <span className="text-[10px] text-[#66645F] block">Work initiated</span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[rgba(23,26,31,0.10)] shadow-[0_8px_28px_rgba(50,40,25,0.06)] space-y-1">
            <span className="text-[10px] font-mono text-[#7652A8] font-bold uppercase tracking-wider block">
              Awaiting Verification
            </span>
            <div className="text-3xl font-extrabold text-[#7652A8]">
              {loading ? '...' : summary ? summary.awaitingVerification : '—'}
            </div>
            <span className="text-[10px] text-[#66645F] block">Evidence submitted</span>
          </div>

          <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[rgba(23,26,31,0.10)] shadow-[0_8px_28px_rgba(50,40,25,0.06)] space-y-1">
            <span className="text-[10px] font-mono text-[#16805B] font-bold uppercase tracking-wider block">
              Completed
            </span>
            <div className="text-3xl font-extrabold text-[#16805B]">
              {loading ? '...' : summary ? summary.completed : '—'}
            </div>
            <span className="text-[10px] text-[#66645F] block">Verified & closed</span>
          </div>
        </div>

        {/* Current Operational Context Card */}
        <div className="p-5 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.10)] space-y-3 font-sans shadow-[0_8px_28px_rgba(50,40,25,0.04)]">
          <div className="flex items-center justify-between border-b border-[rgba(23,26,31,0.08)] pb-3">
            <h3 className="text-sm font-bold text-[#171A1F] flex items-center gap-2">
              <svg className="w-5 h-5 text-[#E8890C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Current Shift & Operational Context</span>
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-[#16805B]/10 text-[#16805B] border border-[#16805B]/20 text-[10px] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16805B] animate-pulse" />
              <span>ON DUTY</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.08)] space-y-1">
              <span className="text-[10px] text-[#66645F] uppercase font-bold block">Assigned Shift</span>
              <span className="text-[#171A1F] font-bold block">{profile?.shift?.name || 'Morning Shift'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.08)] space-y-1">
              <span className="text-[10px] text-[#66645F] uppercase font-bold block">Duty Hours</span>
              <span className="text-[#9C4F08] font-bold block">{profile?.shift?.startTime} – {profile?.shift?.endTime}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.08)] space-y-1">
              <span className="text-[10px] text-[#66645F] uppercase block font-bold">Assigned Department</span>
              <span className="text-[#171A1F] font-semibold block">{profile?.department}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.08)] space-y-1">
              <span className="text-[10px] text-[#66645F] uppercase block font-bold">Zone / Jurisdiction</span>
              <span className="text-[#171A1F] font-semibold block">{profile?.serviceArea || 'Visakhapatnam Zone 1'}</span>
            </div>
          </div>
        </div>

        {/* Assigned Field Work Tasks List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#171A1F] tracking-tight">
              My Active Assigned Tasks
            </h2>
            <NavLink to="/artisan/assignments" className="text-sm font-bold text-[#E8890C] hover:text-[#9C4F08] transition-colors">
              View All &rarr;
            </NavLink>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-[#FFFDF8] rounded-2xl border border-[rgba(23,26,31,0.10)] text-sm text-[#66645F] shadow-[0_8px_28px_rgba(50,40,25,0.04)]">
              Loading active field tasks from Cloud Firestore...
            </div>
          ) : activeTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
              {activeTasks.map((task) => (
                <div
                  key={task.workOrderId}
                  className="bg-[#FFFDF8] rounded-2xl p-4 border border-[rgba(23,26,31,0.10)] shadow-[0_8px_28px_rgba(50,40,25,0.06)] hover:border-[#E8890C]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#9C4F08] bg-[#E8890C]/10 px-2.5 py-1 rounded border border-[#E8890C]/20">
                        {task.ticketId}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${
                          task.status === 'ASSIGNED'
                            ? 'bg-[#E8890C]/10 text-[#9C4F08] border-[#E8890C]/20'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-[#276E9E]/10 text-[#276E9E] border-[#276E9E]/20'
                            : task.status === 'AWAITING_VERIFICATION'
                            ? 'bg-[#7652A8]/10 text-[#7652A8] border-[#7652A8]/20'
                            : 'bg-[#16805B]/10 text-[#16805B] border-[#16805B]/20'
                        }`}
                      >
                        {task.status === 'ASSIGNED' ? 'PENDING' : task.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {task.imageUrl ? (
                      <img src={task.imageUrl} alt="Issue photo" className="w-full h-40 object-cover rounded-xl border border-[rgba(23,26,31,0.08)]" />
                    ) : (
                      <div className="w-full h-40 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] flex items-center justify-center text-sm text-[#66645F]">
                        No Image Provided
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#171A1F] line-clamp-2 leading-tight">{task.issueSummary}</p>
                      <p className="text-xs text-[#66645F]">{task.location.area || task.location.formattedAddress || 'Visakhapatnam Zone'}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] text-xs space-y-1 text-[#66645F]">
                      <div>Work Order: <span className="text-[#9C4F08] font-bold">{task.workOrderNumber}</span></div>
                      <div>Date: <span className="text-[#171A1F] font-semibold">{task.assignmentDate}</span> — Priority: <span className="text-red-600 font-bold">{task.priority}</span></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[rgba(23,26,31,0.08)]">
                    <NavLink
                      to={`/artisan/assignments/${task.workOrderId}`}
                      className="w-full py-2.5 bg-[#FFFDF8] hover:bg-[#ECE6DA] text-[#9C4F08] border border-[#E8890C]/30 rounded-xl font-bold text-sm text-center block transition-colors"
                    >
                      View Work Details &rarr;
                    </NavLink>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#FFFDF8] rounded-2xl border border-[rgba(23,26,31,0.10)] space-y-2 shadow-[0_8px_28px_rgba(50,40,25,0.04)]">
              <p className="text-base font-bold text-[#171A1F]">No active work orders currently assigned</p>
              <p className="text-sm text-[#66645F]">New field work orders dispatched by municipal authority will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </ArtisanShell>
  );
};

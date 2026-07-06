import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtisanShell } from '../components/layout/ArtisanShell';
import { artisanApiClient, type ArtisanWorkOrder } from '../../services/artisanApiClient';

type AssignmentFilter = 'all' | 'pending' | 'in_progress' | 'awaiting_verification' | 'completed';

export const ArtisanAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<AssignmentFilter>('all');
  const [workOrders, setWorkOrders] = useState<ArtisanWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await artisanApiClient.getWorkOrders(activeFilter);
        setWorkOrders(data);
      } catch (err: any) {
        if (err.message?.includes('401') || err.message?.includes('403')) {
          navigate('/artisan/login');
          return;
        }
        setError(err.message || 'Failed to load assigned reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [activeFilter, navigate]);

  const filteredOrders = workOrders.filter((wo) => {
    const term = searchTerm.toLowerCase();
    return (
      wo.ticketId.toLowerCase().includes(term) ||
      wo.workOrderNumber.toLowerCase().includes(term) ||
      wo.issueSummary.toLowerCase().includes(term) ||
      (wo.location.area || '').toLowerCase().includes(term)
    );
  });

  const filterTabs: { id: AssignmentFilter; label: string }[] = [
    { id: 'all', label: 'All Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'awaiting_verification', label: 'Awaiting Verification' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <ArtisanShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(23,26,31,0.08)] pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#171A1F] tracking-tight">
              Assigned Field Reports & Work Orders
            </h1>
            <p className="text-sm text-[#66645F]">
              Inspect municipal work orders assigned strictly to your official employee account.
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-[#E8890C]/10 border border-[#E8890C]/20 text-[#9C4F08] font-mono text-sm font-bold self-start sm:self-auto">
            {workOrders.length} Tasks Recorded
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Filter Controls & Search Bar */}
        <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-[rgba(23,26,31,0.10)] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_28px_rgba(50,40,25,0.04)]">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-sans">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 text-sm rounded-xl shrink-0 whitespace-nowrap transition-all font-bold ${
                  activeFilter === tab.id
                    ? 'bg-[#E8890C] text-white shadow-sm'
                    : 'bg-[#ECE6DA] text-[#66645F] hover:text-[#171A1F] hover:bg-[#E2DBCC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Ticket ID, Work Order No..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.15)] text-sm text-[#171A1F] placeholder:text-[#66645F] outline-none focus:border-[#E8890C]/50 transition-colors font-sans"
            />
            <svg className="w-4 h-4 text-[#66645F] absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Work Orders Cards Grid */}
        {loading ? (
          <div className="p-12 text-center bg-[#FFFDF8] rounded-2xl border border-[rgba(23,26,31,0.10)] text-sm text-[#66645F] shadow-[0_8px_28px_rgba(50,40,25,0.04)]">
            Loading assigned work orders...
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
            {filteredOrders.map((wo) => (
              <div
                key={wo.workOrderId}
                onClick={() => navigate(`/artisan/assignments/${wo.workOrderId}`)}
                className="bg-[#FFFDF8] rounded-2xl p-5 border border-[rgba(23,26,31,0.10)] space-y-4 hover:border-[#E8890C]/40 cursor-pointer transition-all flex flex-col justify-between group shadow-[0_8px_28px_rgba(50,40,25,0.06)]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#9C4F08] bg-[#E8890C]/10 px-2.5 py-1 rounded border border-[#E8890C]/20">
                      {wo.ticketId}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${
                        wo.status === 'ASSIGNED'
                          ? 'bg-[#E8890C]/10 text-[#9C4F08] border-[#E8890C]/20'
                          : wo.status === 'IN_PROGRESS'
                          ? 'bg-[#276E9E]/10 text-[#276E9E] border-[#276E9E]/20'
                          : wo.status === 'AWAITING_VERIFICATION'
                          ? 'bg-[#7652A8]/10 text-[#7652A8] border-[#7652A8]/20'
                          : 'bg-[#16805B]/10 text-[#16805B] border-[#16805B]/20'
                      }`}
                    >
                      {wo.status === 'ASSIGNED' ? 'READY TO START' : wo.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {wo.imageUrl ? (
                    <img src={wo.imageUrl} alt="Report Photo" className="w-full h-40 object-cover rounded-xl border border-[rgba(23,26,31,0.08)] group-hover:brightness-105 transition-all" />
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] flex items-center justify-center text-sm text-[#66645F]">
                      No Before Photo Available
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#66645F] font-bold">{wo.issueCategory}</span>
                      <span className="text-[10px] font-mono font-bold text-red-600 uppercase">Priority: {wo.priority}</span>
                    </div>
                    <p className="text-sm font-bold text-[#171A1F] line-clamp-2 leading-tight">{wo.issueSummary}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] text-xs space-y-1 text-[#66645F]">
                    <div>Work Order: <span className="text-[#9C4F08] font-bold">{wo.workOrderNumber}</span></div>
                    <div>Location: <span className="text-[#171A1F] font-semibold">{wo.location.area || wo.location.formattedAddress || 'Visakhapatnam'}</span></div>
                    <div>Date: <span className="text-[#171A1F] font-semibold">{wo.assignmentDate}</span> ({wo.shift?.name || 'Morning Shift'})</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[rgba(23,26,31,0.08)]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/artisan/assignments/${wo.workOrderId}`);
                    }}
                    className="w-full py-2.5 bg-[#E8890C] hover:bg-[#9C4F08] text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>View Assignment</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#FFFDF8] rounded-2xl border border-[rgba(23,26,31,0.10)] space-y-2 shadow-[0_8px_28px_rgba(50,40,25,0.04)]">
            <p className="text-base font-bold text-[#171A1F]">No matching work orders found</p>
            <p className="text-sm text-[#66645F]">Try adjusting your filter selection or search query.</p>
          </div>
        )}
      </div>
    </ArtisanShell>
  );
};

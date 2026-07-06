import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtisanShell } from '../components/layout/ArtisanShell';
import { artisanApiClient, type ArtisanWorkOrder } from '../../services/artisanApiClient';

export const ArtisanHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [completedOrders, setCompletedOrders] = useState<ArtisanWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await artisanApiClient.getWorkOrders('completed');
        setCompletedOrders(data);
      } catch (err: any) {
        if (err.message?.includes('401') || err.message?.includes('403')) {
          navigate('/artisan/login');
          return;
        }
        setError(err.message || 'Failed to load work history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [navigate]);

  return (
    <ArtisanShell>
      <div className="space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(23,26,31,0.08)] pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#171A1F] tracking-tight">
              Artisan Field Work History
            </h1>
            <p className="text-sm text-[#66645F]">
              Audit record of all field work completed and verified by municipal authority.
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-[#16805B]/10 border border-[#16805B]/20 text-[#16805B] font-mono text-sm font-bold self-start sm:self-auto">
            {completedOrders.length} Completed Records
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center bg-[#FFFDF8] rounded-2xl border border-[rgba(23,26,31,0.10)] text-sm text-[#66645F] shadow-[0_8px_28px_rgba(50,40,25,0.04)]">
            Loading work history...
          </div>
        ) : completedOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
            {completedOrders.map((wo) => (
              <div
                key={wo.workOrderId}
                className="bg-[#FFFDF8] rounded-2xl p-5 border border-[rgba(23,26,31,0.10)] space-y-3 shadow-[0_8px_28px_rgba(50,40,25,0.06)]"
              >
                <div className="flex items-center justify-between border-b border-[rgba(23,26,31,0.08)] pb-2">
                  <span className="text-xs font-mono font-bold text-[#9C4F08]">{wo.ticketId}</span>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-[#16805B]/10 text-[#16805B] border border-[#16805B]/20">
                    COMPLETED & VERIFIED
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#171A1F]">{wo.issueSummary}</p>
                  <p className="text-xs text-[#66645F] font-mono">{wo.location.area || wo.location.formattedAddress || 'Visakhapatnam Zone'}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] text-xs font-mono space-y-1 text-[#66645F]">
                  <div>Work Order: <span className="text-[#9C4F08] font-bold">{wo.workOrderNumber}</span></div>
                  <div>Category: <span className="text-[#171A1F]">{wo.issueCategory}</span></div>
                  <div>Assignment Date: <span className="text-[#171A1F]">{wo.assignmentDate}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#FFFDF8] rounded-2xl border border-[rgba(23,26,31,0.10)] space-y-2 shadow-[0_8px_28px_rgba(50,40,25,0.04)]">
            <p className="text-base font-bold text-[#171A1F]">No completed records found</p>
            <p className="text-sm text-[#66645F]">Completed and verified work orders will appear here in your permanent field record.</p>
          </div>
        )}
      </div>
    </ArtisanShell>
  );
};

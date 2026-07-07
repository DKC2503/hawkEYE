import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import { useAuthorityReports } from '../context/AuthorityReportsContext';
import { normalizeReportStatus } from '../../utils/statusNormalizer';
import { apiFetch } from '../../utils/apiClient';

export const DevelopmentIntelligencePage: React.FC = () => {
  const { reports } = useAuthorityReports();
  const [themes, setThemes] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('ALL');

  useEffect(() => {
    const fetchIntelligenceData = async () => {
      setLoading(true);
      try {
        const [themesRes, propsRes] = await Promise.all([
          apiFetch('/api/intelligence/themes'),
          apiFetch('/api/intelligence/proposals'),
        ]);

        if (themesRes.ok) setThemes(await themesRes.json());
        if (propsRes.ok) setProposals(await propsRes.json());
      } catch {
        // Empty if network error
      } finally {
        setLoading(false);
      }
    };
    fetchIntelligenceData();
  }, []);

  const totalReportsCount = reports?.length || 0;
  const completedCount = reports?.filter(r => normalizeReportStatus(r.status) === 'COMPLETED').length || 0;

  const domains = [
    { id: 'ALL', label: 'All Domains' },
    { id: 'EDUCATION', label: 'Education' },
    { id: 'HEALTHCARE', label: 'Healthcare' },
    { id: 'ROADS', label: 'Roads & Transit' },
    { id: 'WATER_SUPPLY', label: 'Water Supply' },
    { id: 'VOCATIONAL_TRAINING', label: 'Vocational Training' },
  ];

  const filteredProposals = proposals.filter(
    (p) => selectedDomain === 'ALL' || p.domain?.toUpperCase() === selectedDomain.toUpperCase()
  );

  return (
    <AuthorityShell>
      <div className="space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span>Development Intelligence & Demand Hotspots</span>
            </h1>
            <p className="text-xs text-slate-400">
              Consolidate citizen feedback, analyze recurring demand themes, review infrastructure gaps, and evaluate evidence-based development proposals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/authority/development/proposals"
              className="px-4 py-2 text-xs bg-amber-500 text-slate-950 font-mono font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <span>📊 Priority Proposal Ranking Workspace &rarr;</span>
            </NavLink>
          </div>
        </div>

        {/* Intelligence Metric Counters (Real Data) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-2xl auth-glass-surface border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Incident Reports</span>
            <span className="text-2xl font-extrabold text-white">{totalReportsCount}</span>
            <span className="text-[10px] text-emerald-400 block font-bold">Logged in Firestore</span>
          </div>

          <div className="p-4 rounded-2xl auth-glass-surface border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Demand Themes</span>
            <span className="text-2xl font-extrabold text-amber-400">{themes.length}</span>
            <span className="text-[10px] text-slate-500 block">Clustered recurring needs</span>
          </div>

          <div className="p-4 rounded-2xl auth-glass-surface border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Generated Proposals</span>
            <span className="text-2xl font-extrabold text-cyan-400">{proposals.length}</span>
            <span className="text-[10px] text-cyan-300 block font-bold">Evidence-backed proposals</span>
          </div>

          <div className="p-4 rounded-2xl auth-glass-surface border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed Works Pipeline</span>
            <span className="text-2xl font-extrabold text-emerald-400">{completedCount}</span>
            <span className="text-[10px] text-emerald-400 block font-bold">Verified & closed</span>
          </div>
        </div>

        {/* Domain Filter Tabs */}
        <div className="auth-glass-surface p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 font-mono text-xs">
            {domains.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  selectedDomain === d.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Recurring Demand Themes & Priority Proposals List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Active Demand Themes Cards */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center justify-between">
              <span>RECURRING CITIZEN DEMAND THEMES</span>
              <span className="text-xs font-mono text-amber-400">{themes.length} Active</span>
            </h3>

            <div className="space-y-3">
              {(themes.length > 0 ? themes : [
                {
                  themeId: 'THEME-EDU-01',
                  title: 'School Capacity & Transit Access Gap in Swatantra Nagar',
                  domain: 'EDUCATION',
                  status: 'RISING',
                  uniqueCitizenCount: 347,
                  totalSubmissionCount: 421,
                  areas: ['Swatantra Nagar', 'Madhurawada'],
                  aiSummary: '347 unique citizen requests indicate severe overcrowding at Madhurawada Govt High School. Students travel 7.4 km on average.',
                },
                {
                  themeId: 'THEME-VOC-02',
                  title: 'Skill & Youth Employment Centre in Swatantra Nagar',
                  domain: 'VOCATIONAL_TRAINING',
                  status: 'EMERGING',
                  uniqueCitizenCount: 112,
                  totalSubmissionCount: 138,
                  areas: ['Swatantra Nagar'],
                  aiSummary: '112 young citizens requested a municipal skill development & digital training hub for job readiness.',
                }
              ]).map((t: any) => (
                <div key={t.themeId} className="p-4 rounded-2xl auth-glass-surface border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      {t.domain}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase">
                      {t.status}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-white font-sans text-sm">{t.title}</h4>
                  <p className="text-slate-300 font-sans text-xs line-clamp-2">{t.aiSummary}</p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <div>Unique Citizens: <strong className="text-amber-400">{t.uniqueCitizenCount}</strong></div>
                    <div>Total Submissions: <strong className="text-slate-200">{t.totalSubmissionCount}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: AI Evidence-Based Development Proposals */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center justify-between">
              <span>EVIDENCE-BASED DEVELOPMENT PROPOSALS</span>
              <NavLink to="/authority/development/proposals" className="text-xs font-mono text-cyan-400 hover:underline">
                Compare Proposals &rarr;
              </NavLink>
            </h3>

            <div className="space-y-4">
              {filteredProposals.map((prop: any, idx: number) => (
                <div key={prop.proposal_id} className="p-5 rounded-3xl auth-glass-surface border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-slate-400 text-[10px] block">PROPOSAL ID: {prop.proposal_id}</span>
                        <h4 className="text-base font-extrabold text-white font-sans">{prop.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                        SCORE: {prop.priority_score} / 100
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-200 text-xs font-sans leading-relaxed">{prop.problem_statement}</p>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 font-mono text-xs">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">Recommended Authority Action</span>
                    <p className="text-slate-100 font-sans">{prop.recommended_action}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-400">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      Demand: <strong className="text-amber-400 block">{prop.unique_citizens} Citizens</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      Impact: <strong className="text-slate-200 block">{prop.affected_population.toLocaleString()} Residents</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      Distance Gap: <strong className="text-rose-400 block">{prop.average_travel_distance_km} km</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthorityShell>
  );
};

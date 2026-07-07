import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from './components/navigation/AppShell';
import { PortalSelectionPage } from './pages/PortalSelectionPage';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { ReportPage } from './pages/ReportPage';
import { IssuesPage } from './pages/IssuesPage';
import { PublicTransparencyPage } from './pages/PublicTransparencyPage';

// Authority Dashboard Pages (Isolated Dark Command Center)
import { AuthorityDashboardPage } from './authority/pages/AuthorityDashboardPage';
import { ReportsPage } from './authority/pages/ReportsPage';
import { AuthorityMapPage } from './authority/pages/AuthorityMapPage';
import { WorkersPage } from './authority/pages/WorkersPage';
import { AuthorityLoginPage } from './authority/pages/AuthorityLoginPage';
import { DevelopmentIntelligencePage } from './authority/pages/DevelopmentIntelligencePage';
import { PriorityProposalsPage } from './authority/pages/PriorityProposalsPage';

// Artisan Portal Pages (Protected Worker Field Operations)
import { ArtisanLoginPage } from './artisan/pages/ArtisanLoginPage';
import { ArtisanDashboardPage } from './artisan/pages/ArtisanDashboardPage';
import { ArtisanAssignmentsPage } from './artisan/pages/ArtisanAssignmentsPage';
import { ArtisanAssignmentDetailPage } from './artisan/pages/ArtisanAssignmentDetailPage';
import { ArtisanHistoryPage } from './artisan/pages/ArtisanHistoryPage';

import { AuthorityVerificationPage } from './authority/pages/AuthorityVerificationPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { BackendGate } from './components/BackendGate';

// Central Context for Shared Reports State
import { AuthorityReportsProvider } from './authority/context/AuthorityReportsContext';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthorityReportsProvider>
        <Routes>
          {/* Root Gateway — Cinematic 3-Role Portal Selector */}
          <Route path="/" element={<PortalSelectionPage />} />

          {/* Backend-Gated Routes */}
          <Route element={<BackendGate><Outlet /></BackendGate>}>
            {/* Citizen Portal Routes (Backend Dependent) */}
            <Route
              path="/citizen/*"
              element={
                <AppShell>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/issues" element={<IssuesPage />} />
                    <Route path="/transparency" element={<PublicTransparencyPage />} />
                  </Routes>
                </AppShell>
              }
            />
            {/* Legacy Citizen Sub-routes Fallback */}
            <Route path="/map" element={<AppShell><MapPage /></AppShell>} />
            <Route path="/report" element={<AppShell><ReportPage /></AppShell>} />
            <Route path="/issues" element={<AppShell><IssuesPage /></AppShell>} />
            <Route path="/transparency" element={<AppShell><PublicTransparencyPage /></AppShell>} />

            {/* Authority Command Center Routes (Dark Theme Only) */}
            <Route path="/authority" element={<AuthorityDashboardPage />} />
            <Route path="/authority/reports" element={<ReportsPage />} />
            <Route path="/authority/development" element={<DevelopmentIntelligencePage />} />
            <Route path="/authority/development/proposals" element={<PriorityProposalsPage />} />
            <Route path="/authority/verification" element={<AuthorityVerificationPage />} />
            <Route path="/authority/issues" element={<Navigate to="/authority/reports" replace />} />
            <Route path="/authority/map" element={<AuthorityMapPage />} />
            <Route path="/authority/workers" element={<WorkersPage />} />
            <Route path="/authority/employees" element={<WorkersPage />} />

            {/* Artisan Field Portal Routes */}
            <Route path="/artisan" element={<ArtisanDashboardPage />} />
            <Route path="/artisan/assignments" element={<ArtisanAssignmentsPage />} />
            <Route path="/artisan/assignments/:workOrderId" element={<ArtisanAssignmentDetailPage />} />
            <Route path="/artisan/history" element={<ArtisanHistoryPage />} />
          </Route>

          {/* Un-gated Static / Public Routes */}
          <Route path="/citizen" element={<AppShell><HomePage /></AppShell>} />
          <Route path="/authority/login" element={<AuthorityLoginPage />} />
          <Route path="/artisan/login" element={<ArtisanLoginPage />} />
        </Routes>
      </AuthorityReportsProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

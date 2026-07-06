import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/civic/SectionHeader';
import { EmptyState } from '../../components/civic/EmptyState';

export const MyReportsPreview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <SectionHeader
        title="My Reports Preview"
        subtitle="Quick overview of your submitted issues"
        actionLabel="View All"
        onAction={() => navigate('/issues')}
      />

      <EmptyState
        title="You Haven't Submitted Any Issues Yet"
        description="Your reported civic issues and status updates will be tracked here."
        actionLabel="Submit First Report"
        onAction={() => navigate('/report')}
      />
    </div>
  );
};

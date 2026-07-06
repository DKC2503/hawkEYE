import React from 'react';
import { IssueMarker } from './IssueMarker';
import type { CivicIssue, IssueCategory } from '../../types/civic';

interface IssueMarkerLayerProps {
  issues: CivicIssue[];
  selectedCategory: IssueCategory | 'all';
  selectedIssueId?: string;
  onSelectIssue: (issue: CivicIssue) => void;
}

export const IssueMarkerLayer: React.FC<IssueMarkerLayerProps> = ({
  issues,
  selectedCategory,
  selectedIssueId,
  onSelectIssue,
}) => {
  const filteredIssues = issues.filter((issue) => {
    if (selectedCategory === 'all') return true;
    return issue.category === selectedCategory;
  });

  return (
    <>
      {filteredIssues.map((issue) => (
        <IssueMarker
          key={issue.id}
          issue={issue}
          isSelected={issue.id === selectedIssueId}
          onSelect={onSelectIssue}
        />
      ))}
    </>
  );
};

import React from 'react';
import { HawkEyeMap } from './HawkEyeMap';
import type { CivicIssue } from '../../types/civic';

interface CityMapContainerProps {
  issues?: CivicIssue[];
}

export const CityMapContainer: React.FC<CityMapContainerProps> = ({ issues = [] }) => {
  return <HawkEyeMap issues={issues} />;
};

import React from 'react';
import { CityMapContainer } from '../features/map/CityMapContainer';

export const MapPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <CityMapContainer />
    </div>
  );
};

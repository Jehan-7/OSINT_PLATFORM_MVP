import React from 'react';

const MapSkeleton: React.FC = () => {
  return (
    <div 
      className="w-full h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center"
      data-testid="map-skeleton"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-24 mx-auto"></div>
      </div>
    </div>
  );
};

export default MapSkeleton; 
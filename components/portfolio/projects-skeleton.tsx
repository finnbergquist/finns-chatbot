// components/portfolio/projects-skeleton.tsx

import React from 'react';

const ProjectsSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-200 p-4 rounded-lg shadow-md animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  );
};

export default ProjectsSkeleton;

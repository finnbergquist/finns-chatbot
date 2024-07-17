// components/portfolio/SystemMessage.tsx

import React from 'react';

const SystemMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-yellow-100 p-4 rounded-lg shadow-md">
      {children}
    </div>
  );
};

export default SystemMessage;

// components/portfolio/BotCard.tsx

import React from 'react';

const BotCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {children}
    </div>
  );
};

export default BotCard;
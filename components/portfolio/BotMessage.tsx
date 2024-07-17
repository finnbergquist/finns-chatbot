// components/portfolio/BotMessage.tsx

import React from 'react';

const BotMessage: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md">
      <p>{content}</p>
    </div>
  );
};

export default BotMessage;

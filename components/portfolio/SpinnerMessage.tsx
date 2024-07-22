// components/portfolio/SpinnerMessage.tsx

import React from 'react';
import Spinner from './Spinner';

const SpinnerMessage: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-2">
      <Spinner />
      <span>Loading...</span>
    </div>
  );
};

export default SpinnerMessage;

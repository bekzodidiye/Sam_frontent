import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ArrivalChecker from './ArrivalChecker';
import ErrorBoundary from './ErrorBoundary';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ArrivalChecker />
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;


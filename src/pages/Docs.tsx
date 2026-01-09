import React from 'react';
import DocsLayout from '../components/docs/DocsLayout';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

const DocsPage = () => {
  return (
    <ErrorBoundary>
      <div style={{ margin: '-2rem -1.5rem', height: 'calc(100vh - 8rem)' }}>
        <DocsLayout />
      </div>
    </ErrorBoundary>
  );
};

export default DocsPage;


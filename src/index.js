import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import App from './App';
import { ContextProvider } from './contexts/ContextProvider';
import ErrorBoundary from './components/ErrorBoundary';

// Handle unhandled promise rejections (e.g., from browser extensions)
window.addEventListener('unhandledrejection', (event) => {
  // Suppress extension-related errors but log them
  if (event.reason?.message?.includes('message channel closed') 
    || event.reason?.message?.includes('asynchronous response')) {
    // console.warn('Extension message error (suppressed):', event.reason);
    event.preventDefault(); // Prevent breaking the app
  }
});

ReactDOM.render(
  <React.StrictMode>
    <ContextProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ContextProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);

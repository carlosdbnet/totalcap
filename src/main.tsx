import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import ErrorBoundary from './components/ErrorBoundary.tsx'
import { logError } from './lib/logger.ts'

// Captura erros globais (fora do React)
window.onerror = (message, source, lineno, colno, error) => {
  logError(`Global Error: ${message}`, `${source}:${lineno}:${colno}`);
};

// Captura Promessas rejeitadas não tratadas
window.onunhandledrejection = (event) => {
  logError(`Unhandled Rejection: ${event.reason}`, '');
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

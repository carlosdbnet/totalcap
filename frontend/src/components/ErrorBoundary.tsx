import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Envia o erro para o log do backend
    logError(error.message, errorInfo.componentStack || error.stack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '2rem',
            borderRadius: '24px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            maxWidth: '500px'
          }}>
            <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Ops! Algo deu errado.</h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Ocorreu um erro inesperado no aplicativo. O detalhe técnico foi registrado para análise.
            </p>
            
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              textAlign: 'left',
              marginBottom: '2rem',
              color: '#ef4444',
              overflow: 'auto',
              maxHeight: '150px'
            }}>
              <code>{this.state.error?.message}</code>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={18} /> Recarregar App
              </button>
              <button 
                onClick={this.handleGoHome}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'white',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Home size={18} /> Ir para Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

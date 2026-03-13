import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    (this as any).setState({
      error,
      errorInfo
    });
  }

  public render() {
    const state = (this as any).state as State;
    const props = (this as any).props as Props;
    if (state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#222', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ff4444' }}>Something went wrong.</h1>
          <p style={{ fontSize: '18px' }}>{state.error?.toString()}</p>
          <pre style={{ background: '#111', padding: '15px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {state.errorInfo?.componentStack}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={{ padding: '10px 20px', background: '#ff4444', color: '#fff', border: 'none', cursor: 'pointer', marginTop: '20px' }}
          >
            Clear Local Storage & Go to Login
          </button>
        </div>
      );
    }

    return props.children;
  }
}

export default ErrorBoundary;

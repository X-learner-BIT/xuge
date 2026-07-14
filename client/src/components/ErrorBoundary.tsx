import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg-card px-4">
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-text-primary">页面加载出错了</h2>
            <p className="mt-2 text-sm text-text-muted">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-primary transition-all hover:border-primary-light hover:text-primary"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
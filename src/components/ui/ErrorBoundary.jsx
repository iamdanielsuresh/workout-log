import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

/**
 * ErrorBoundary - Catches React errors and displays fallback UI
 * Prevents the entire app from crashing on unhandled errors
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error for debugging (in production, send to error reporting service)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry, LogRocket, or similar
      // errorReportingService.captureException(error, { extra: errorInfo });
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-100 mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-6">
              We're sorry, but something unexpected happened. Please try again.
            </p>

            {/* Error Details (dev only) */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-400 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                icon={RefreshCw}
                className="flex-1 sm:flex-none"
              >
                Try Again
              </Button>
              <Button 
                variant="secondary"
                onClick={this.handleGoHome}
                icon={Home}
                className="flex-1 sm:flex-none"
              >
                Go Home
              </Button>
            </div>

            {/* Reload Link */}
            <button
              onClick={this.handleReload}
              className="mt-6 text-sm text-gray-500 hover:text-gray-400 underline"
            >
              Reload the page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withErrorBoundary HOC - Wrap any component with error boundary
 */
export function withErrorBoundary(Component, fallback) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

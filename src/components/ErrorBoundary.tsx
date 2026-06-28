import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-grove-dark gap-4 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400 max-w-sm text-sm">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="grove-btn-primary mt-2"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

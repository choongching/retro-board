import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { RetroWordmark } from './RetroWordmark';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in dev tools. In the future this is where a logging service hook would go.
    console.error('Uncaught render error:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const navigate = useNavigate();
  const goHome = () => {
    reset();
    navigate('/');
  };
  return (
    <div className="error-fallback">
      <div className="error-fallback-inner">
        <RetroWordmark size="sm" />
        <h1 className="error-fallback-title">Something went sideways.</h1>
        <p className="error-fallback-body">
          An unexpected error tripped up the app. Your team's cards are safe in the database. Try again, or head back home.
        </p>
        <div className="error-fallback-actions">
          <button type="button" className="btn accent" onClick={reset}>Try again</button>
          <button type="button" className="btn" onClick={goHome}>Back home</button>
        </div>
        {error.message && (
          <details className="error-fallback-details">
            <summary>Technical details</summary>
            <pre>{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

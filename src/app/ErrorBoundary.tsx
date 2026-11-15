import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Route-level error boundary: a failed page never takes down navigation. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    // No personal data is logged; only the error and component stack.
    console.error('Route error', error.message, info.componentStack?.split('\n').slice(0, 4).join('\n'));
  }
  override render() {
    if (!this.state.error) return this.props.children;
    const chunk = /dynamically imported module|Loading chunk|Failed to fetch/i.test(this.state.error.message);
    return (
      <div className="wv-container py-32">
        <p className="t-label text-platinum">Something went wrong</p>
        <h1 className="t-display-2 mt-6 max-w-3xl">{chunk ? 'This page could not load. Your connection may have dropped.' : 'This page hit an unexpected error.'}</h1>
        <p className="t-body-lg mt-6 max-w-[60ch] text-platinum">Nothing you entered elsewhere on the site has been lost. Try again, or go back to the home page.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" className="btn-primary inline-flex min-h-12 items-center px-6 font-medium" onClick={() => window.location.reload()}>Try again</button>
          <a href="/" className="inline-flex min-h-12 items-center border border-[color-mix(in_srgb,var(--color-ivory)_30%,transparent)] px-6 font-medium no-underline">Go to home page</a>
        </div>
      </div>
    );
  }
}

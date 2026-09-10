/**
 * ErrorBoundary.jsx
 * -----------------
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and renders a fallback UI instead of crashing
 * to a blank white screen.
 */

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-12 max-w-xl rounded-2xl border border-wrong/20 bg-white p-8 shadow-card text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-wrong-tint text-wrong">
            <AlertTriangle size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-sans text-xl font-bold text-ink">
            Something went wrong rendering this page
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
            An unexpected error occurred while displaying this view. You can reload this page or return to the home screen.
          </p>
          {this.state.error?.message && (
            <div className="mt-4 rounded-lg bg-paper p-3 text-left font-mono text-xs text-ink-3 overflow-x-auto border border-rule">
              {this.state.error.message}
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-royal-dark transition-all"
            >
              <RefreshCw size={15} />
              Reload Page
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-rule-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-paper hover:text-ink transition-all"
            >
              <Home size={15} />
              Go to Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

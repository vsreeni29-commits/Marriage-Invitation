import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Shown in place of the failed section. Omit to hide it entirely. */
  fallback?: ReactNode;
  label?: string;
}

interface State {
  failed: boolean;
}

/**
 * Keeps one broken interaction from taking down the invitation.
 *
 * The essentials — names, date, time, venue, directions — are plain markup in
 * sections of their own, so a failure in the scratch card or the garden costs
 * a guest nothing they came for.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[${this.props.label ?? 'section'}]`, error, info.componentStack);
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

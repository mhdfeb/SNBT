import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, StatePanel } from './ui';
import { logEvent } from '../lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logEvent('error', {
      event: 'ui_crash',
      message: error.message,
      stack: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
          <StatePanel
            kind="error"
            title="Aplikasi mengalami gangguan"
            description="Terjadi runtime error. Silakan muat ulang halaman untuk melanjutkan latihan."
            action={
              <Button variant="danger" onClick={() => window.location.reload()} aria-label="Muat ulang aplikasi">
                Muat ulang
              </Button>
            }
          />
        </main>
      );
    }

    return this.props.children;
  }
}

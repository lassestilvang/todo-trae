'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from './ui/Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
  router: ReturnType<typeof useRouter>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Internal class-based ErrorBoundary that provides the error UI.
 * Uses the router prop for client-side navigation.
 */
class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        contexts: {
          reactErrorBoundary: {
            componentStack: errorInfo.componentStack || errorInfo.toString(),
          },
        },
      });
    } else {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    this.props.router.push('/');
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-md w-full p-10 text-center rounded-3xl border-border/30 shadow-2xl"
          >
            <div className="relative mx-auto w-24 h-24 mb-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-destructive/10 rounded-full blur-xl"
              />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle size={40} />
              </div>
            </div>

            <h1 className="text-3xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
              Oops! Something broke
            </h1>

            <p className="text-muted-foreground mb-10 leading-relaxed font-medium">
              {this.state.error?.message ||
                'An unexpected error occurred. Our engineers are probably already panicking.'}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReset}
                className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw size={18} />
                Try Refreshing
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 border-border/40 hover:bg-muted/40 transition-all"
              >
                <Home size={18} />
                Return to Safety
              </Button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Wrapper for the class-based ErrorBoundary that provides the Next.js router.
 * The class component needs the router prop for client-side navigation.
 */
export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const router = useRouter();
  return <ErrorBoundaryClass router={router}>{children}</ErrorBoundaryClass>;
}

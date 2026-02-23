import React from "react";
import { Logger } from "./logger";
import { ErrorBoundaryProps } from "./types";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component that logs errors automatically
 */
export class LoggerErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error
    const logger = Logger.getInstance();
    logger.error("React error boundary caught error", {
      error,
      component_stack: errorInfo.componentStack,
      error_boundary: true,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p>We've logged the error and will investigate.</p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details style={{ marginTop: "20px", textAlign: "left" }}>
              <summary>Error details</summary>
              <pre>{this.state.error.toString()}</pre>
              <pre>{this.state.error.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withLoggerErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithLoggerErrorBoundary(props: P) {
    return (
      <LoggerErrorBoundary fallback={fallback}>
        <Component {...props} />
      </LoggerErrorBoundary>
    );
  };
}

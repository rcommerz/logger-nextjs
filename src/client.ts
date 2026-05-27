/**
 * Client-only entry point
 * Exports React hooks and components that should only be used in Client Components
 *
 * Usage:
 * ```typescript
 * 'use client';
 * import { useLogger, LoggerErrorBoundary } from '@rcommerz/logger-nextjs/client';
 * ```
 */

// React hooks (client-only)
export {
  useLogger,
  useLogLifecycle,
  useLogError,
  useLogPerformance,
  useLogAction,
  useLogAsyncOperation,
  useLogPageView,
  useLogApiCall,
} from "./hooks";

// Components (client-only)
export { LoggerErrorBoundary, withLoggerErrorBoundary } from "./components";

// Re-export types for convenience
export type {
  LogLevel,
  LogType,
  LoggerConfig,
  LogContext,
  LogEntry,
  PerformanceEntry,
  ErrorBoundaryProps,
} from "./types";

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
export { useLogger, useLogLifecycle, useLogError, useLogPerformance, useLogAction, useLogAsyncOperation, useLogPageView, useLogApiCall, } from "./hooks";
export { LoggerErrorBoundary, withLoggerErrorBoundary } from "./components";
export type { LogLevel, LogType, LoggerConfig, LogContext, LogEntry, PerformanceEntry, ErrorBoundaryProps, } from "./types";

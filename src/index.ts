/**
 * Main entry point - server-safe exports only
 * Exports Logger class and types, but NOT React components/hooks
 * to avoid bundling issues in Next.js Server Components
 */

// Main logger class (safe for server-side)
export { Logger, getLogger } from "./logger";

// Types only (safe for server-side)
export type {
  LogLevel,
  LogType,
  LoggerConfig,
  LogContext,
  LogEntry,
  PerformanceEntry,
  ErrorBoundaryProps,
} from "./types";

/**
 * Log levels supported by the logger
 */
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

/**
 * Log types for categorization
 */
export type LogType =
  | "normal"
  | "http"
  | "database"
  | "security"
  | "audit"
  | "performance";

/**
 * Configuration options for Logger initialization
 */
export interface LoggerConfig {
  /**
   * Service/Application name
   */
  serviceName: string;

  /**
   * Service version (semver recommended)
   */
  serviceVersion: string;

  /**
   * Environment (development, staging, production)
   */
  env: string;

  /**
   * Minimum log level to output
   * @default "INFO"
   */
  level?: LogLevel;

  /**
   * Enable console output (default: true in development)
   */
  enableConsole?: boolean;

  /**
   * Backend endpoint to send logs to
   */
  remoteEndpoint?: string;

  /**
   * Enable batch sending of logs
   * @default false
   */
  enableBatching?: boolean;

  /**
   * Batch size (number of logs before sending)
   * @default 10
   */
  batchSize?: number;

  /**
   * Batch interval in milliseconds
   * @default 5000
   */
  batchInterval?: number;

  /**
   * Custom metadata to include in all logs
   */
  metadata?: Record<string, any>;
}

/**
 * Additional context for log entries
 */
export interface LogContext {
  /**
   * User identifier
   */
  user_id?: string;

  /**
   * Session identifier
   */
  session_id?: string;

  /**
   * Request/correlation identifier
   */
  request_id?: string;

  /**
   * Error object
   */
  error?: Error;

  /**
   * HTTP method
   */
  method?: string;

  /**
   * HTTP status code
   */
  status_code?: number;

  /**
   * URL/path
   */
  url?: string;

  /**
   * Duration in milliseconds
   */
  duration_ms?: number;

  /**
   * Component/module name
   */
  component?: string;

  /**
   * Action being performed
   */
  action?: string;

  /**
   * Any additional custom fields
   */
  [key: string]: any;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  "@timestamp": string;
  "log.level": string;
  log_type: LogType;
  message: string;
  "service.name": string;
  "service.version": string;
  env: string;
  trace_id?: string;
  span_id?: string;
  user_agent?: string;
  [key: string]: any;
}

/**
 * Performance measurement entry
 */
export interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  metadata?: Record<string, any>;
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

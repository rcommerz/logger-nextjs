/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

import { trace, context } from "@opentelemetry/api";
import { LoggerConfig, LogLevel, LogType, LogContext, LogEntry } from "./types";
import type { Logger as PinoLogger } from "pino";

/**
 * Detect if we're running in a browser or Node.js environment
 */
const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";

/**
 * Lazy-load pino only in Node.js environment
 */
let pino: typeof import("pino") | null = null;

/**
 * Initialize pino (server-side only)
 */
async function initializePino(config: LoggerConfig): Promise<PinoLogger | null> {
  if (isBrowser) {
    return null;
  }

  try {
    pino = await import("pino");

    const pinoConfig: any = {
      level: config.level?.toLowerCase() || "info",
      base: {
        service: config.serviceName,
        version: config.serviceVersion,
        env: config.env,
        ...config.metadata,
      },
      formatters: {
        level: (label: string) => {
          return { "log.level": label.toUpperCase() };
        },
        bindings: (bindings: any) => {
          return {
            "service.name": bindings.service,
            "service.version": bindings.version,
            env: bindings.env,
            ...Object.keys(bindings)
              .filter(k => !['service', 'version', 'env', 'pid', 'hostname'].includes(k))
              .reduce((acc, k) => ({ ...acc, [k]: bindings[k] }), {}),
          };
        },
      },
      timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
      messageKey: "message",
    };

    // Enable pretty printing in development
    if (config.env === "development" && config.enableConsole !== false) {
      const pinoPretty = await import("pino-pretty");
      return pino.default(pinoConfig, pinoPretty.default({
        colorize: true,
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname",
        messageFormat: "{msg}",
      }));
    }

    return pino.default(pinoConfig);
  } catch (error) {
    console.error("Failed to initialize pino:", error);
    return null;
  }
}

/**
 * Browser-compatible structured logger for Next.js/React applications with Pino
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  private pinoLogger: PinoLogger | null = null;
  private initPromise: Promise<void> | null = null;
  private originalConsole: {
    log: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
  };

  private constructor(config: LoggerConfig) {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    this.config = {
      level: "INFO",
      enableConsole: config.env === "development",
      enableBatching: false,
      batchSize: 10,
      batchInterval: 5000,
      ...config,
    };

    // Initialize pino asynchronously (only in Node.js)
    if (!isBrowser) {
      this.initPromise = initializePino(this.config).then((logger) => {
        this.pinoLogger = logger;
      });
    }

    // Start batch timer if batching is enabled
    if (this.config.enableBatching && this.config.remoteEndpoint) {
      this.startBatchTimer();
    }

    // Handle page unload - flush remaining logs
    if (isBrowser && typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  /**
   * Initialize the logger singleton
   */
  public static initialize(config: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Get the logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      throw new Error(
        "Logger not initialized. Call Logger.initialize() first.",
      );
    }
    return Logger.instance;
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const configLevel = this.config.level || "INFO";
    return this.LOG_LEVELS[level] >= this.LOG_LEVELS[configLevel];
  }

  /**
   * Get OpenTelemetry trace context
   */
  private getTraceContext(): { trace_id?: string; span_id?: string } {
    try {
      const activeContext = context.active();
      const span = trace.getSpan(activeContext);
      if (span) {
        const spanContext = span.spanContext();
        return {
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId,
        };
      }
    } catch (error) {
      // OpenTelemetry not configured or not available
    }
    return {};
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): { user_agent?: string; platform?: string } {
    if (isBrowser && typeof window !== "undefined" && window.navigator) {
      return {
        user_agent: window.navigator.userAgent,
        platform: "browser",
      };
    }
    return {
      platform: "server",
    };
  }

  /**
   * Build structured log entry
   */
  private buildLogEntry(
    level: LogLevel,
    logType: LogType,
    message: string,
    logContext?: LogContext,
  ): LogEntry {
    const traceContext = this.getTraceContext();
    const browserInfo = this.getBrowserInfo();

    const entry: LogEntry = {
      "@timestamp": new Date().toISOString(),
      "log.level": level,
      log_type: logType,
      message,
      "service.name": this.config.serviceName,
      "service.version": this.config.serviceVersion,
      env: this.config.env,
      ...traceContext,
      ...browserInfo,
      ...this.config.metadata,
      ...logContext,
    };

    // Extract error details if error object is passed
    if (logContext?.error instanceof Error) {
      entry.error_type = logContext.error.name;
      entry.error_message = logContext.error.message;
      entry.error_stack = logContext.error.stack;
      delete entry.error; // Remove the error object itself
    }

    return entry;
  }

  /**
   * Log using Pino (server-side) or console (browser)
   */
  private async logWithPino(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
  ): Promise<void> {
    // Wait for pino initialization
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null; // Only wait once
    }

    if (this.pinoLogger && !isBrowser) {
      // Server-side: Use Pino
      const pinoLevel = level.toLowerCase() as "debug" | "info" | "warn" | "error";
      const pinoContext = { ...context };

      // Handle error object specially for Pino
      if (context?.error_type && context?.error_message) {
        pinoContext.err = {
          type: context.error_type,
          message: context.error_message,
          stack: context.error_stack,
        };
        delete pinoContext.error_type;
        delete pinoContext.error_message;
        delete pinoContext.error_stack;
      }

      this.pinoLogger[pinoLevel](pinoContext, message);
    } else if (isBrowser && this.config.enableConsole) {
      // Browser: Use enhanced console logging
      this.browserConsoleLog(level, message, context);
    }
  }

  /**
   * Output log to browser console with formatting
   */
  private browserConsoleLog(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
  ): void {
    const timestamp = new Date().toLocaleTimeString();
    const consoleMethod =
      level === "ERROR"
        ? "error"
        : level === "WARN"
          ? "warn"
          : level === "DEBUG"
            ? "debug"
            : "log";

    const consoleFunc = this.originalConsole?.[consoleMethod] || console[consoleMethod];

    if (typeof consoleFunc !== "undefined") {
      const styles = {
        DEBUG: "color: cyan",
        INFO: "color: green",
        WARN: "color: orange",
        ERROR: "color: red",
      };

      consoleFunc(
        `%c[${timestamp}] %c${level}%c ${message}`,
        "color: gray",
        styles[level] || "",
        "font-weight: normal",
      );

      // Log context separately if present
      if (context && Object.keys(context).length > 0) {
        const displayContext = { ...context };
        // Remove standard fields to reduce noise (but keep log_type and platform)
        ["@timestamp", "log.level", "message", "service.name", "service.version", "env"].forEach(
          (key) => delete displayContext[key]
        );

        if (Object.keys(displayContext).length > 0) {
          consoleFunc(displayContext);
        }
      }
    }
  }

  /**
   * Send log to remote endpoint
   */
  private async sendLog(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      if (typeof fetch !== "undefined") {
        await fetch(this.config.remoteEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entry),
          keepalive: true, // Ensures request completes even if page unloads
        });
      }
    } catch (error) {
      // Silently fail - don't want logging to break the app
      // Use original console to avoid circular logging
      if (this.originalConsole?.error) {
        this.originalConsole.error("Failed to send log:", error);
      }
    }
  }

  /**
   * Add log to buffer for batch sending
   */
  private bufferLog(entry: LogEntry): void {
    this.logBuffer.push(entry);

    if (this.logBuffer.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, this.config.batchInterval || 5000);
  }

  /**
   * Flush buffered logs
   */
  public async flush(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.config.remoteEndpoint) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      if (typeof fetch !== "undefined") {
        await fetch(this.config.remoteEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logs: logsToSend }),
          keepalive: true,
        });
      }
    } catch (error) {
      console.error("Failed to flush logs:", error);
    }
  }

  /**
   * Process and send log entry
   */
  private processLog(
    level: LogLevel,
    logType: LogType,
    message: string,
    logContext?: LogContext,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.buildLogEntry(level, logType, message, logContext);

    // Extract context for pino
    const pinoContext: any = { ...entry };
    delete pinoContext.message;
    delete pinoContext["@timestamp"]; // Pino handles this

    // Log with Pino (async but don't wait)
    this.logWithPino(level, message, pinoContext).catch((err) => {
      // Fallback to console if pino fails
      if (this.originalConsole?.error) {
        this.originalConsole.error("Pino logging failed:", err);
      }
    });

    // Remote logging
    if (this.config.remoteEndpoint) {
      if (this.config.enableBatching) {
        this.bufferLog(entry);
      } else {
        this.sendLog(entry);
      }
    }
  }

  /**
   * Log at INFO level
   */
  public info(message: string, context?: LogContext): void {
    this.processLog("INFO", "normal", message, context);
  }

  /**
   * Log at ERROR level
   */
  public error(message: string, context?: LogContext): void {
    this.processLog("ERROR", "normal", message, context);
  }

  /**
   * Log at WARN level
   */
  public warn(message: string, context?: LogContext): void {
    this.processLog("WARN", "normal", message, context);
  }

  /**
   * Log at DEBUG level
   */
  public debug(message: string, context?: LogContext): void {
    this.processLog("DEBUG", "normal", message, context);
  }

  /**
   * Log HTTP requests
   */
  public http(message: string, context?: LogContext): void {
    this.processLog("INFO", "http", message, context);
  }

  /**
   * Log security events
   */
  public security(message: string, context?: LogContext): void {
    this.processLog("WARN", "security", message, context);
  }

  /**
   * Log audit events
   */
  public audit(message: string, context?: LogContext): void {
    this.processLog("INFO", "audit", message, context);
  }

  /**
   * Log database operations
   */
  public database(message: string, context?: LogContext): void {
    this.processLog("INFO", "database", message, context);
  }

  /**
   * Log performance metrics
   */
  public performance(message: string, context?: LogContext): void {
    this.processLog("INFO", "performance", message, context);
  }

  /**
   * Measure and log performance
   */
  public measure<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;

      this.performance(`Performance: ${name}`, {
        component: name,
        duration_ms: Math.round(duration * 100) / 100, // Round to 2 decimal places
        ...metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`Performance measurement failed: ${name}`, {
        component: name,
        duration_ms: Math.round(duration * 100) / 100,
        error: error as Error,
        ...metadata,
      });
      throw error;
    }
  }

  /**
   * Measure and log async performance
   */
  public async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.performance(`Performance: ${name}`, {
        component: name,
        duration_ms: Math.round(duration * 100) / 100,
        ...metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`Performance measurement failed: ${name}`, {
        component: name,
        duration_ms: Math.round(duration * 100) / 100,
        error: error as Error,
        ...metadata,
      });
      throw error;
    }
  }

  /**
   * Create a child logger with additional context
   */
  public child(bindings: Record<string, any>): Logger {
    const childConfig = {
      ...this.config,
      metadata: {
        ...this.config.metadata,
        ...bindings,
      },
    };

    // Create a new logger instance with inherited config
    const childLogger = new Logger(childConfig);

    // If parent has pino instance, create child pino instance
    if (this.pinoLogger && !isBrowser) {
      childLogger.pinoLogger = this.pinoLogger.child(bindings);
    }

    return childLogger;
  }

  /**
   * Get the underlying Pino logger instance (server-side only)
   */
  public getPinoInstance(): PinoLogger | null {
    return this.pinoLogger;
  }

  /**
   * Clean up logger resources
   */
  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    this.flush();
  }
}

// Export convenience function
export const getLogger = () => Logger.getInstance();

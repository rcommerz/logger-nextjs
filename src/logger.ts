import { trace, context } from "@opentelemetry/api";
import { LoggerConfig, LogLevel, LogType, LogContext, LogEntry } from "./types";

/**
 * Browser-compatible structured logger for Next.js/React applications
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  private originalConsole: {
    log: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
  };

  private constructor(config: LoggerConfig) {
    // Store original console methods before any interception
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

    // Start batch timer if batching is enabled
    if (this.config.enableBatching && this.config.remoteEndpoint) {
      this.startBatchTimer();
    }

    // Handle page unload - flush remaining logs
    if (typeof window !== "undefined") {
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
  private getBrowserInfo(): { user_agent?: string } {
    if (typeof window !== "undefined" && window.navigator) {
      return {
        user_agent: window.navigator.userAgent,
      };
    }
    return {};
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
   * Output log to console
   */
  private consoleLog(level: LogLevel, entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    // Use Node.js stdout/stderr for direct output (bypasses console interception)
    const isNode = typeof process !== "undefined" && process.versions?.node;

    if (isNode) {
      this.nodeConsoleLog(level, entry);
    } else {
      // Browser - use original console methods
      this.browserConsoleLog(level, entry);
    }
  }

  /**
   * Output log to Node.js stdout/stderr (bypasses console interception)
   */
  private nodeConsoleLog(level: LogLevel, entry: LogEntry): void {
    const timestamp = new Date(entry["@timestamp"]).toLocaleTimeString();

    // ANSI color codes
    const colors = {
      DEBUG: "\x1b[36m", // Cyan
      INFO: "\x1b[32m",  // Green
      WARN: "\x1b[33m",  // Yellow
      ERROR: "\x1b[31m", // Red
      reset: "\x1b[0m",
      gray: "\x1b[90m",
      bold: "\x1b[1m",
    };

    const color = colors[level] || colors.reset;

    // Build pretty formatted line
    let output = `${colors.gray}[${timestamp}]${colors.reset} ${color}${colors.bold}${level}${colors.reset} ${colors.bold}${entry.message}${colors.reset}`;

    // Add component/source if available
    if (entry.component || entry.source) {
      output += ` ${colors.gray}[${entry.component || entry.source}]${colors.reset}`;
    }

    output += "\n";

    // Add context if present (excluding standard fields)
    const contextKeys = Object.keys(entry).filter(
      (key) =>
        ![
          "@timestamp",
          "log.level",
          "log_type",
          "message",
          "service.name",
          "service.version",
          "env",
          "service_type",
          "platform",
          "component",
          "source",
          "user_agent",
        ].includes(key),
    );

    if (contextKeys.length > 0) {
      const context: Record<string, any> = {};
      contextKeys.forEach((key) => {
        context[key] = entry[key as keyof LogEntry];
      });
      output += `${colors.gray}${JSON.stringify(context, null, 2)}${colors.reset}\n`;
    }

    // Write directly to stdout/stderr to bypass console interception
    const stream = level === "ERROR" ? process.stderr : process.stdout;
    stream.write(output);
  }

  /**
   * Output log to browser console
   */
  private browserConsoleLog(level: LogLevel, entry: LogEntry): void {
    const consoleMethod =
      level === "ERROR"
        ? "error"
        : level === "WARN"
          ? "warn"
          : level === "DEBUG"
            ? "debug"
            : "log";

    // Use original console method if available (to avoid interception loop)
    const consoleFunc = this.originalConsole?.[consoleMethod] || console[consoleMethod];

    if (typeof consoleFunc !== "undefined") {
      const timestamp = new Date(entry["@timestamp"]).toLocaleTimeString();
      const styles = {
        DEBUG: "color: cyan",
        INFO: "color: green",
        WARN: "color: orange",
        ERROR: "color: red",
      };

      consoleFunc(
        `%c[${timestamp}] %c${level}%c ${entry.message}`,
        "color: gray",
        styles[level] || "",
        "font-weight: normal",
      );

      // Log context separately
      const contextKeys = Object.keys(entry).filter(
        (key) =>
          ![
            "@timestamp",
            "log.level",
            "log_type",
            "message",
            "service.name",
            "service.version",
            "env",
          ].includes(key),
      );

      if (contextKeys.length > 0) {
        const context: Record<string, any> = {};
        contextKeys.forEach((key) => {
          context[key] = entry[key as keyof LogEntry];
        });
        consoleFunc(context);
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

    // Console output
    this.consoleLog(level, entry);

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
        duration_ms: Math.round(duration),
        ...metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`Performance measurement failed: ${name}`, {
        component: name,
        duration_ms: Math.round(duration),
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
        duration_ms: Math.round(duration),
        ...metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`Performance measurement failed: ${name}`, {
        component: name,
        duration_ms: Math.round(duration),
        error: error as Error,
        ...metadata,
      });
      throw error;
    }
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

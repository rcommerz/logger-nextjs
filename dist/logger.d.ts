import { LoggerConfig, LogContext } from "./types";
import type { Logger as PinoLogger } from "pino";
/**
 * Browser-compatible structured logger for Next.js/React applications with Pino
 */
export declare class Logger {
    private static instance;
    private config;
    private logBuffer;
    private batchTimer;
    private readonly LOG_LEVELS;
    private pinoLogger;
    private initPromise;
    private originalConsole;
    private constructor();
    /**
     * Initialize the logger singleton
     */
    static initialize(config: LoggerConfig): Logger;
    /**
     * Get the logger instance
     */
    static getInstance(): Logger;
    /**
     * Check if log level should be logged
     */
    private shouldLog;
    /**
     * Get OpenTelemetry trace context
     */
    private getTraceContext;
    /**
     * Get browser information
     */
    private getBrowserInfo;
    /**
     * Build structured log entry
     */
    private buildLogEntry;
    /**
     * Log using Pino (server-side) or console (browser)
     */
    private logWithPino;
    /**
     * Output log to browser console with JSON formatting
     */
    private browserConsoleLog;
    /**
     * Send log to remote endpoint
     */
    private sendLog;
    /**
     * Add log to buffer for batch sending
     */
    private bufferLog;
    /**
     * Start batch timer
     */
    private startBatchTimer;
    /**
     * Flush buffered logs
     */
    flush(): Promise<void>;
    /**
     * Process and send log entry
     */
    private processLog;
    /**
     * Log at INFO level
     */
    info(message: string, context?: LogContext): void;
    /**
     * Log at ERROR level
     */
    error(message: string, context?: LogContext): void;
    /**
     * Log at WARN level
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Log at DEBUG level
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Log HTTP requests
     */
    http(message: string, context?: LogContext): void;
    /**
     * Log security events
     */
    security(message: string, context?: LogContext): void;
    /**
     * Log audit events
     */
    audit(message: string, context?: LogContext): void;
    /**
     * Log database operations
     */
    database(message: string, context?: LogContext): void;
    /**
     * Log performance metrics
     */
    performance(message: string, context?: LogContext): void;
    /**
     * Measure and log performance
     */
    measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T;
    /**
     * Measure and log async performance
     */
    measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
    /**
     * Create a child logger with additional context
     */
    child(bindings: Record<string, any>): Logger;
    /**
     * Get the underlying Pino logger instance (server-side only)
     */
    getPinoInstance(): PinoLogger | null;
    /**
     * Clean up logger resources
     */
    destroy(): void;
}
export declare const getLogger: () => Logger;

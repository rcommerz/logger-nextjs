"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = exports.Logger = void 0;
const api_1 = require("@opentelemetry/api");
/**
 * Browser-compatible structured logger for Next.js/React applications
 */
class Logger {
    constructor(config) {
        this.logBuffer = [];
        this.batchTimer = null;
        this.LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
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
    static initialize(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }
    /**
     * Get the logger instance
     */
    static getInstance() {
        if (!Logger.instance) {
            throw new Error("Logger not initialized. Call Logger.initialize() first.");
        }
        return Logger.instance;
    }
    /**
     * Check if log level should be logged
     */
    shouldLog(level) {
        const configLevel = this.config.level || "INFO";
        return this.LOG_LEVELS[level] >= this.LOG_LEVELS[configLevel];
    }
    /**
     * Get OpenTelemetry trace context
     */
    getTraceContext() {
        try {
            const activeContext = api_1.context.active();
            const span = api_1.trace.getSpan(activeContext);
            if (span) {
                const spanContext = span.spanContext();
                return {
                    trace_id: spanContext.traceId,
                    span_id: spanContext.spanId,
                };
            }
        }
        catch (error) {
            // OpenTelemetry not configured or not available
        }
        return {};
    }
    /**
     * Get browser information
     */
    getBrowserInfo() {
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
    buildLogEntry(level, logType, message, logContext) {
        const traceContext = this.getTraceContext();
        const browserInfo = this.getBrowserInfo();
        const entry = {
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
    consoleLog(level, entry) {
        if (!this.config.enableConsole)
            return;
        const consoleMethod = level === "ERROR"
            ? "error"
            : level === "WARN"
                ? "warn"
                : level === "DEBUG"
                    ? "debug"
                    : "log";
        if (typeof console !== "undefined") {
            console[consoleMethod](JSON.stringify(entry, null, 2));
        }
    }
    /**
     * Send log to remote endpoint
     */
    async sendLog(entry) {
        if (!this.config.remoteEndpoint)
            return;
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
        }
        catch (error) {
            // Silently fail - don't want logging to break the app
            console.error("Failed to send log:", error);
        }
    }
    /**
     * Add log to buffer for batch sending
     */
    bufferLog(entry) {
        this.logBuffer.push(entry);
        if (this.logBuffer.length >= (this.config.batchSize || 10)) {
            this.flush();
        }
    }
    /**
     * Start batch timer
     */
    startBatchTimer() {
        this.batchTimer = setInterval(() => {
            if (this.logBuffer.length > 0) {
                this.flush();
            }
        }, this.config.batchInterval || 5000);
    }
    /**
     * Flush buffered logs
     */
    async flush() {
        if (this.logBuffer.length === 0 || !this.config.remoteEndpoint)
            return;
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
        }
        catch (error) {
            console.error("Failed to flush logs:", error);
        }
    }
    /**
     * Process and send log entry
     */
    processLog(level, logType, message, logContext) {
        if (!this.shouldLog(level))
            return;
        const entry = this.buildLogEntry(level, logType, message, logContext);
        // Console output
        this.consoleLog(level, entry);
        // Remote logging
        if (this.config.remoteEndpoint) {
            if (this.config.enableBatching) {
                this.bufferLog(entry);
            }
            else {
                this.sendLog(entry);
            }
        }
    }
    /**
     * Log at INFO level
     */
    info(message, context) {
        this.processLog("INFO", "normal", message, context);
    }
    /**
     * Log at ERROR level
     */
    error(message, context) {
        this.processLog("ERROR", "normal", message, context);
    }
    /**
     * Log at WARN level
     */
    warn(message, context) {
        this.processLog("WARN", "normal", message, context);
    }
    /**
     * Log at DEBUG level
     */
    debug(message, context) {
        this.processLog("DEBUG", "normal", message, context);
    }
    /**
     * Log HTTP requests
     */
    http(message, context) {
        this.processLog("INFO", "http", message, context);
    }
    /**
     * Log security events
     */
    security(message, context) {
        this.processLog("WARN", "security", message, context);
    }
    /**
     * Log audit events
     */
    audit(message, context) {
        this.processLog("INFO", "audit", message, context);
    }
    /**
     * Log performance metrics
     */
    performance(message, context) {
        this.processLog("INFO", "performance", message, context);
    }
    /**
     * Measure and log performance
     */
    measure(name, fn, metadata) {
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
        }
        catch (error) {
            const duration = performance.now() - startTime;
            this.error(`Performance measurement failed: ${name}`, {
                component: name,
                duration_ms: Math.round(duration),
                error: error,
                ...metadata,
            });
            throw error;
        }
    }
    /**
     * Measure and log async performance
     */
    async measureAsync(name, fn, metadata) {
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
        }
        catch (error) {
            const duration = performance.now() - startTime;
            this.error(`Performance measurement failed: ${name}`, {
                component: name,
                duration_ms: Math.round(duration),
                error: error,
                ...metadata,
            });
            throw error;
        }
    }
    /**
     * Clean up logger resources
     */
    destroy() {
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }
        this.flush();
    }
}
exports.Logger = Logger;
// Export convenience function
const getLogger = () => Logger.getInstance();
exports.getLogger = getLogger;

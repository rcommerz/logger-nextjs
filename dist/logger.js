"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = exports.Logger = void 0;
const api_1 = require("@opentelemetry/api");
/**
 * Detect if we're running in a browser or Node.js environment
 */
const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
/**
 * Lazy-load pino only in Node.js environment
 */
let pino = null;
/**
 * Initialize pino (server-side only)
 */
async function initializePino(config) {
    if (isBrowser) {
        return null;
    }
    try {
        pino = await Promise.resolve().then(() => __importStar(require("pino")));
        const pinoConfig = {
            level: config.level?.toLowerCase() || "info",
            base: {
                service: config.serviceName,
                version: config.serviceVersion,
                env: config.env,
                ...config.metadata,
            },
            formatters: {
                level: (label) => {
                    return { "log.level": label.toUpperCase() };
                },
                bindings: (bindings) => {
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
            const pinoPretty = await Promise.resolve().then(() => __importStar(require("pino-pretty")));
            return pino.default(pinoConfig, pinoPretty.default({
                colorize: true,
                translateTime: "HH:MM:ss.l",
                ignore: "pid,hostname",
                messageFormat: "{msg}",
            }));
        }
        return pino.default(pinoConfig);
    }
    catch (error) {
        console.error("Failed to initialize pino:", error);
        return null;
    }
}
/**
 * Browser-compatible structured logger for Next.js/React applications with Pino
 */
class Logger {
    constructor(config) {
        this.logBuffer = [];
        this.batchTimer = null;
        this.LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
        this.pinoLogger = null;
        this.initPromise = null;
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
        if (isBrowser) {
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
        if (isBrowser && window.navigator) {
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
     * Log using Pino (server-side) or console (browser)
     */
    async logWithPino(level, message, context) {
        // Wait for pino initialization
        if (this.initPromise) {
            await this.initPromise;
            this.initPromise = null; // Only wait once
        }
        if (this.pinoLogger && !isBrowser) {
            // Server-side: Use Pino
            const pinoLevel = level.toLowerCase();
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
        }
        else if (isBrowser && this.config.enableConsole) {
            // Browser: Use enhanced console logging
            this.browserConsoleLog(level, message, context);
        }
    }
    /**
     * Output log to browser console with formatting
     */
    browserConsoleLog(level, message, context) {
        const timestamp = new Date().toLocaleTimeString();
        const consoleMethod = level === "ERROR"
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
            consoleFunc(`%c[${timestamp}] %c${level}%c ${message}`, "color: gray", styles[level] || "", "font-weight: normal");
            // Log context separately if present
            if (context && Object.keys(context).length > 0) {
                const displayContext = { ...context };
                // Remove standard fields to reduce noise
                ["@timestamp", "log.level", "log_type", "message", "service.name", "service.version", "env", "platform"].forEach((key) => delete displayContext[key]);
                if (Object.keys(displayContext).length > 0) {
                    consoleFunc(displayContext);
                }
            }
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
            // Use original console to avoid circular logging
            if (this.originalConsole?.error) {
                this.originalConsole.error("Failed to send log:", error);
            }
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
        // Extract context for pino
        const pinoContext = { ...entry };
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
     * Log database operations
     */
    database(message, context) {
        this.processLog("INFO", "database", message, context);
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
                duration_ms: Math.round(duration * 100) / 100, // Round to 2 decimal places
                ...metadata,
            });
            return result;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            this.error(`Performance measurement failed: ${name}`, {
                component: name,
                duration_ms: Math.round(duration * 100) / 100,
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
                duration_ms: Math.round(duration * 100) / 100,
                ...metadata,
            });
            return result;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            this.error(`Performance measurement failed: ${name}`, {
                component: name,
                duration_ms: Math.round(duration * 100) / 100,
                error: error,
                ...metadata,
            });
            throw error;
        }
    }
    /**
     * Create a child logger with additional context
     */
    child(bindings) {
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
    getPinoInstance() {
        return this.pinoLogger;
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

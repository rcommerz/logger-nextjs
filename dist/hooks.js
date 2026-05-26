"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLogger = useLogger;
exports.useLogLifecycle = useLogLifecycle;
exports.useLogError = useLogError;
exports.useLogPerformance = useLogPerformance;
exports.useLogAction = useLogAction;
exports.useLogAsyncOperation = useLogAsyncOperation;
exports.useLogPageView = useLogPageView;
exports.useLogApiCall = useLogApiCall;
const react_1 = require("react");
const logger_1 = require("./logger");
/**
 * Hook to get logger instance
 */
function useLogger() {
    return logger_1.Logger.getInstance();
}
/**
 * Hook to log component mount/unmount
 */
function useLogLifecycle(componentName, metadata) {
    const logger = useLogger();
    (0, react_1.useEffect)(() => {
        logger.debug(`Component mounted: ${componentName}`, {
            component: componentName,
            action: "mount",
            ...metadata,
        });
        return () => {
            logger.debug(`Component unmounted: ${componentName}`, {
                component: componentName,
                action: "unmount",
                ...metadata,
            });
        };
    }, [logger, componentName, metadata]);
}
/**
 * Hook to log errors in components
 */
function useLogError() {
    const logger = useLogger();
    return (0, react_1.useCallback)((error, context) => {
        logger.error("Component error occurred", {
            error,
            ...context,
        });
    }, [logger]);
}
/**
 * Hook to measure component render performance
 */
function useLogPerformance(componentName) {
    const logger = useLogger();
    const renderCount = (0, react_1.useRef)(0);
    const startTime = (0, react_1.useRef)(performance.now());
    (0, react_1.useEffect)(() => {
        renderCount.current += 1;
        const duration = performance.now() - startTime.current;
        logger.performance(`Component render: ${componentName}`, {
            component: componentName,
            render_count: renderCount.current,
            duration_ms: Math.round(duration),
        });
        startTime.current = performance.now();
    });
}
/**
 * Hook to track user actions
 */
function useLogAction() {
    const logger = useLogger();
    return (0, react_1.useCallback)((action, context) => {
        logger.info(`User action: ${action}`, {
            action,
            ...context,
        });
    }, [logger]);
}
/**
 * Hook to measure async operations
 */
function useLogAsyncOperation() {
    const logger = useLogger();
    return (0, react_1.useCallback)(async (operationName, operation, context) => {
        const startTime = performance.now();
        try {
            const result = await operation();
            const duration = performance.now() - startTime;
            logger.info(`Async operation completed: ${operationName}`, {
                component: operationName,
                duration_ms: Math.round(duration),
                status: "success",
                ...context,
            });
            return result;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            logger.error(`Async operation failed: ${operationName}`, {
                component: operationName,
                duration_ms: Math.round(duration),
                status: "error",
                error: error,
                ...context,
            });
            throw error;
        }
    }, [logger]);
}
/**
 * Hook to track page views (for Next.js)
 */
function useLogPageView(pageName, metadata) {
    const logger = useLogger();
    (0, react_1.useEffect)(() => {
        logger.info(`Page view: ${pageName}`, {
            page: pageName,
            url: typeof window !== "undefined" ? window.location.href : undefined,
            referrer: typeof document !== "undefined" ? document.referrer : undefined,
            ...metadata,
        });
    }, [logger, pageName, metadata]);
}
/**
 * Hook to track API calls
 */
function useLogApiCall() {
    const logger = useLogger();
    return (0, react_1.useCallback)(async (url, method, options) => {
        const startTime = performance.now();
        const requestId = `${method}-${url}-${Date.now()}`;
        logger.http(`API request: ${method} ${url}`, {
            method,
            url,
            request_id: requestId,
        });
        try {
            const response = await fetch(url, { ...options, method });
            const duration = performance.now() - startTime;
            const data = await response.json();
            logger.http(`API response: ${method} ${url}`, {
                method,
                url,
                status_code: response.status,
                duration_ms: Math.round(duration),
                request_id: requestId,
            });
            return data;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            logger.error(`API error: ${method} ${url}`, {
                method,
                url,
                duration_ms: Math.round(duration),
                request_id: requestId,
                error: error,
            });
            throw error;
        }
    }, [logger]);
}

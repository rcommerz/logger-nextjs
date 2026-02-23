import { useEffect, useCallback, useRef } from "react";
import { Logger } from "./logger";
import { LogContext } from "./types";

/**
 * Hook to get logger instance
 */
export function useLogger() {
  return Logger.getInstance();
}

/**
 * Hook to log component mount/unmount
 */
export function useLogLifecycle(componentName: string, metadata?: Record<string, any>) {
  const logger = useLogger();

  useEffect(() => {
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
export function useLogError() {
  const logger = useLogger();

  return useCallback(
    (error: Error, context?: LogContext) => {
      logger.error("Component error occurred", {
        error,
        ...context,
      });
    },
    [logger]
  );
}

/**
 * Hook to measure component render performance
 */
export function useLogPerformance(componentName: string) {
  const logger = useLogger();
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
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
export function useLogAction() {
  const logger = useLogger();

  return useCallback(
    (action: string, context?: LogContext) => {
      logger.info(`User action: ${action}`, {
        action,
        ...context,
      });
    },
    [logger]
  );
}

/**
 * Hook to measure async operations
 */
export function useLogAsyncOperation() {
  const logger = useLogger();

  return useCallback(
    async <T,>(
      operationName: string,
      operation: () => Promise<T>,
      context?: LogContext
    ): Promise<T> => {
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
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error(`Async operation failed: ${operationName}`, {
          component: operationName,
          duration_ms: Math.round(duration),
          status: "error",
          error: error as Error,
          ...context,
        });
        throw error;
      }
    },
    [logger]
  );
}

/**
 * Hook to track page views (for Next.js)
 */
export function useLogPageView(pageName: string, metadata?: Record<string, any>) {
  const logger = useLogger();

  useEffect(() => {
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
export function useLogApiCall() {
  const logger = useLogger();

  return useCallback(
    async <T,>(
      url: string,
      method: string,
      options?: RequestInit
    ): Promise<T> => {
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
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error(`API error: ${method} ${url}`, {
          method,
          url,
          duration_ms: Math.round(duration),
          request_id: requestId,
          error: error as Error,
        });
        throw error;
      }
    },
    [logger]
  );
}

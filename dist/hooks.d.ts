import { Logger } from "./logger";
import { LogContext } from "./types";
/**
 * Hook to get logger instance
 */
export declare function useLogger(): Logger;
/**
 * Hook to log component mount/unmount
 */
export declare function useLogLifecycle(componentName: string, metadata?: Record<string, any>): void;
/**
 * Hook to log errors in components
 */
export declare function useLogError(): (error: Error, context?: LogContext) => void;
/**
 * Hook to measure component render performance
 */
export declare function useLogPerformance(componentName: string): void;
/**
 * Hook to track user actions
 */
export declare function useLogAction(): (action: string, context?: LogContext) => void;
/**
 * Hook to measure async operations
 */
export declare function useLogAsyncOperation(): <T>(operationName: string, operation: () => Promise<T>, context?: LogContext) => Promise<T>;
/**
 * Hook to track page views (for Next.js)
 */
export declare function useLogPageView(pageName: string, metadata?: Record<string, any>): void;
/**
 * Hook to track API calls
 */
export declare function useLogApiCall(): <T>(url: string, method: string, options?: RequestInit) => Promise<T>;

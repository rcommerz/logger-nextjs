import React from "react";
import { ErrorBoundaryProps } from "./types";
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}
/**
 * Error boundary component that logs errors automatically
 */
export declare class LoggerErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}
/**
 * Higher-order component to wrap components with error boundary
 */
export declare function withLoggerErrorBoundary<P extends object>(Component: React.ComponentType<P>, fallback?: React.ReactNode): (props: P) => React.JSX.Element;
export {};

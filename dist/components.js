"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerErrorBoundary = void 0;
exports.withLoggerErrorBoundary = withLoggerErrorBoundary;
const react_1 = __importDefault(require("react"));
const logger_1 = require("./logger");
/**
 * Error boundary component that logs errors automatically
 */
class LoggerErrorBoundary extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
        };
    }
    componentDidCatch(error, errorInfo) {
        // Log the error
        const logger = logger_1.Logger.getInstance();
        logger.error("React error boundary caught error", {
            error,
            component_stack: errorInfo.componentStack,
            error_boundary: true,
        });
        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }
    render() {
        if (this.state.hasError) {
            // Render fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }
            // Default error UI
            return (react_1.default.createElement("div", { style: { padding: "20px", textAlign: "center" } },
                react_1.default.createElement("h2", null, "Something went wrong"),
                react_1.default.createElement("p", null, "We've logged the error and will investigate."),
                process.env.NODE_ENV === "development" && this.state.error && (react_1.default.createElement("details", { style: { marginTop: "20px", textAlign: "left" } },
                    react_1.default.createElement("summary", null, "Error details"),
                    react_1.default.createElement("pre", null, this.state.error.toString()),
                    react_1.default.createElement("pre", null, this.state.error.stack)))));
        }
        return this.props.children;
    }
}
exports.LoggerErrorBoundary = LoggerErrorBoundary;
/**
 * Higher-order component to wrap components with error boundary
 */
function withLoggerErrorBoundary(Component, fallback) {
    return function WithLoggerErrorBoundary(props) {
        return (react_1.default.createElement(LoggerErrorBoundary, { fallback: fallback },
            react_1.default.createElement(Component, { ...props })));
    };
}

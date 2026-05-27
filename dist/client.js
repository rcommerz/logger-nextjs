"use strict";
/**
 * Client-only entry point
 * Exports React hooks and components that should only be used in Client Components
 *
 * Usage:
 * ```typescript
 * 'use client';
 * import { useLogger, LoggerErrorBoundary } from '@rcommerz/logger-nextjs/client';
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLoggerErrorBoundary = exports.LoggerErrorBoundary = exports.useLogApiCall = exports.useLogPageView = exports.useLogAsyncOperation = exports.useLogAction = exports.useLogPerformance = exports.useLogError = exports.useLogLifecycle = exports.useLogger = void 0;
// React hooks (client-only)
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "useLogger", { enumerable: true, get: function () { return hooks_1.useLogger; } });
Object.defineProperty(exports, "useLogLifecycle", { enumerable: true, get: function () { return hooks_1.useLogLifecycle; } });
Object.defineProperty(exports, "useLogError", { enumerable: true, get: function () { return hooks_1.useLogError; } });
Object.defineProperty(exports, "useLogPerformance", { enumerable: true, get: function () { return hooks_1.useLogPerformance; } });
Object.defineProperty(exports, "useLogAction", { enumerable: true, get: function () { return hooks_1.useLogAction; } });
Object.defineProperty(exports, "useLogAsyncOperation", { enumerable: true, get: function () { return hooks_1.useLogAsyncOperation; } });
Object.defineProperty(exports, "useLogPageView", { enumerable: true, get: function () { return hooks_1.useLogPageView; } });
Object.defineProperty(exports, "useLogApiCall", { enumerable: true, get: function () { return hooks_1.useLogApiCall; } });
// Components (client-only)
var components_1 = require("./components");
Object.defineProperty(exports, "LoggerErrorBoundary", { enumerable: true, get: function () { return components_1.LoggerErrorBoundary; } });
Object.defineProperty(exports, "withLoggerErrorBoundary", { enumerable: true, get: function () { return components_1.withLoggerErrorBoundary; } });

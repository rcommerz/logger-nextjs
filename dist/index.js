"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withLoggerErrorBoundary = exports.LoggerErrorBoundary = exports.useLogApiCall = exports.useLogPageView = exports.useLogAsyncOperation = exports.useLogAction = exports.useLogPerformance = exports.useLogError = exports.useLogLifecycle = exports.useLogger = exports.getLogger = exports.Logger = void 0;
// Main logger class
var logger_1 = require("./logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
Object.defineProperty(exports, "getLogger", { enumerable: true, get: function () { return logger_1.getLogger; } });
// React hooks
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "useLogger", { enumerable: true, get: function () { return hooks_1.useLogger; } });
Object.defineProperty(exports, "useLogLifecycle", { enumerable: true, get: function () { return hooks_1.useLogLifecycle; } });
Object.defineProperty(exports, "useLogError", { enumerable: true, get: function () { return hooks_1.useLogError; } });
Object.defineProperty(exports, "useLogPerformance", { enumerable: true, get: function () { return hooks_1.useLogPerformance; } });
Object.defineProperty(exports, "useLogAction", { enumerable: true, get: function () { return hooks_1.useLogAction; } });
Object.defineProperty(exports, "useLogAsyncOperation", { enumerable: true, get: function () { return hooks_1.useLogAsyncOperation; } });
Object.defineProperty(exports, "useLogPageView", { enumerable: true, get: function () { return hooks_1.useLogPageView; } });
Object.defineProperty(exports, "useLogApiCall", { enumerable: true, get: function () { return hooks_1.useLogApiCall; } });
// Components
var components_1 = require("./components");
Object.defineProperty(exports, "LoggerErrorBoundary", { enumerable: true, get: function () { return components_1.LoggerErrorBoundary; } });
Object.defineProperty(exports, "withLoggerErrorBoundary", { enumerable: true, get: function () { return components_1.withLoggerErrorBoundary; } });

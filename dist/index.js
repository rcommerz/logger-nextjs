"use strict";
/**
 * Main entry point - server-safe exports only
 * Exports Logger class and types, but NOT React components/hooks
 * to avoid bundling issues in Next.js Server Components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = exports.Logger = void 0;
// Main logger class (safe for server-side)
var logger_1 = require("./logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
Object.defineProperty(exports, "getLogger", { enumerable: true, get: function () { return logger_1.getLogger; } });

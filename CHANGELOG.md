# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of @rcommerz/logger-nextjs
- Browser-compatible structured logging for Next.js/React
- React hooks for easy integration
- Error boundary component with automatic logging
- OpenTelemetry trace context extraction
- Remote logging with batching support
- Performance measurement utilities
- Full TypeScript support

## [1.0.0] - 2026-02-23

### Added
- Core Logger class with singleton pattern
- Log levels: DEBUG, INFO, WARN, ERROR
- Log types: normal, http, database, security, audit, performance
- React hooks:
  - `useLogger()` - Get logger instance
  - `useLogLifecycle()` - Auto-log component mount/unmount
  - `useLogError()` - Error logging helper
  - `useLogPerformance()` - Track render performance
  - `useLogAction()` - Track user actions
  - `useLogAsyncOperation()` - Track async operations
  - `useLogPageView()` - Track page views
  - `useLogApiCall()` - Track API calls
- LoggerErrorBoundary component
- withLoggerErrorBoundary HOC
- Remote logging with fetch API
- Batch logging for performance
- Browser information capture
- Comprehensive test suite with 90%+ coverage
- GitHub Actions CI/CD workflows
- Complete documentation and examples

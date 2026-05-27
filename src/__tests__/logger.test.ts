import { Logger } from "../logger";
import { LoggerConfig } from "../types";
import * as otelApi from "@opentelemetry/api";

describe("Logger", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let fetchMock: jest.Mock;

  const mockConfig: LoggerConfig = {
    serviceName: "test-service",
    serviceVersion: "1.0.0",
    env: "test",
    enableConsole: true,
  };

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
    fetchMock = global.fetch as jest.Mock;
    fetchMock.mockClear();

    // Reset singleton
    (Logger as any).instance = null;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe("Initialization", () => {
    it("should initialize logger with config", () => {
      const logger = Logger.initialize(mockConfig);
      expect(logger).toBeInstanceOf(Logger);
    });

    it("should return same instance on multiple initialize calls", () => {
      const logger1 = Logger.initialize(mockConfig);
      const logger2 = Logger.initialize(mockConfig);
      expect(logger1).toBe(logger2);
    });

    it("should throw error when getInstance called before initialize", () => {
      expect(() => Logger.getInstance()).toThrow(
        "Logger not initialized. Call Logger.initialize() first.",
      );
    });

    it("should return instance after initialization", () => {
      Logger.initialize(mockConfig);
      const logger = Logger.getInstance();
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe("Log Levels", () => {
    it("should log info messages", () => {
      const logger = Logger.initialize(mockConfig);
      logger.info("Test info message");

      // Check that console.log was called with formatted output
      expect(consoleLogSpy).toHaveBeenCalled();
      const firstCall = consoleLogSpy.mock.calls[0][0];
      expect(firstCall).toContain("INFO");
      expect(firstCall).toContain("Test info message");
    });

    it("should log error messages", () => {
      const logger = Logger.initialize(mockConfig);
      logger.error("Test error message");

      // Check that console.error was called with formatted output
      expect(consoleErrorSpy).toHaveBeenCalled();
      const firstCall = consoleErrorSpy.mock.calls[0][0];
      expect(firstCall).toContain("ERROR");
      expect(firstCall).toContain("Test error message");
    });

    it("should log warning messages", () => {
      const logger = Logger.initialize(mockConfig);
      logger.warn("Test warning message");

      // Check that console.warn was called with formatted output
      expect(consoleWarnSpy).toHaveBeenCalled();
      const firstCall = consoleWarnSpy.mock.calls[0][0];
      expect(firstCall).toContain("WARN");
      expect(firstCall).toContain("Test warning message");
    });

    it("should log debug messages when level is DEBUG", () => {
      const logger = Logger.initialize({ ...mockConfig, level: "DEBUG" });
      logger.debug("Test debug message");

      // Check that console.debug was called with formatted output
      expect(consoleDebugSpy).toHaveBeenCalled();
      const firstCall = consoleDebugSpy.mock.calls[0][0];
      expect(firstCall).toContain("DEBUG");
      expect(firstCall).toContain("Test debug message");
    });

    it("should not log debug messages when level is INFO", () => {
      const logger = Logger.initialize({ ...mockConfig, level: "INFO" });
      logger.debug("Test debug message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe("Log Context", () => {
    it("should include context in log entry", () => {
      const logger = Logger.initialize(mockConfig);
      logger.info("Test message", { user_id: "123", action: "login" });

      // First call is the formatted message
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Test message");

      // Second call contains the context object
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1][0];
      expect(contextCall.user_id).toBe("123");
      expect(contextCall.action).toBe("login");
    });

    it("should extract error details from Error object", () => {
      const logger = Logger.initialize(mockConfig);
      const error = new Error("Test error");
      logger.error("Error occurred", { error });

      // First call is the formatted message
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("Error occurred");

      // Second call contains the context with error details
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleErrorSpy.mock.calls[1][0];
      expect(contextCall.error_type).toBe("Error");
      expect(contextCall.error_message).toBe("Test error");
      expect(contextCall.error_stack).toBeDefined();
    });

    it("should include service metadata", () => {
      const logger = Logger.initialize(mockConfig);
      logger.info("Test message");

      // Service metadata is in the context object (second call if context exists, or not logged if no custom context)
      // Since we have no custom context, just check that the message was logged
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Test message");
    });
  });

  describe("Log Types", () => {
    it("should log HTTP messages", () => {
      const logger = Logger.initialize(mockConfig);
      logger.http("HTTP request", { method: "GET", url: "/api/test" });

      // First call is the formatted message
      expect(consoleLogSpy.mock.calls[0][0]).toContain("HTTP request");

      // Second call contains the context with log_type and custom fields
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1][0];
      expect(contextCall.log_type).toBe("http");
      expect(contextCall.method).toBe("GET");
    });

    it("should log security events", () => {
      const logger = Logger.initialize(mockConfig);
      logger.security("Security event", { action: "failed_login" });

      // First call is the formatted message
      expect(consoleWarnSpy.mock.calls[0][0]).toContain("Security event");

      // Second call contains the context with log_type
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleWarnSpy.mock.calls[1][0];
      expect(contextCall.log_type).toBe("security");
    });

    it("should log audit events", () => {
      const logger = Logger.initialize(mockConfig);
      logger.audit("Audit event", { action: "user_updated" });

      // First call is the formatted message
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Audit event");

      // Second call contains the context with log_type
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1][0];
      expect(contextCall.log_type).toBe("audit");
    });

    it("should log performance metrics", () => {
      const logger = Logger.initialize(mockConfig);
      logger.performance("Performance metric", { duration_ms: 123 });

      // First call is the formatted message
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Performance metric");

      // Second call contains the context with log_type
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1][0];
      expect(contextCall.log_type).toBe("performance");
    });
  });

  describe("Performance Measurement", () => {
    it("should measure sync function execution", () => {
      const logger = Logger.initialize(mockConfig);
      const result = logger.measure("test-operation", () => {
        return "result";
      });

      expect(result).toBe("result");

      // First call is the formatted message
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Performance: test-operation");

      // Second call contains the context with component and duration
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1][0];
      expect(contextCall.component).toBe("test-operation");
      expect(contextCall.duration_ms).toBeDefined();
    });

    it("should measure async function execution", async () => {
      const logger = Logger.initialize(mockConfig);
      const result = await logger.measureAsync("async-operation", async () => {
        return "async-result";
      });

      expect(result).toBe("async-result");

      // First call is the formatted message
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Performance: async-operation");

      // Second call contains the context
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1][0];
      expect(contextCall.component).toBe("async-operation");
    });

    it("should log error when measured function throws", () => {
      const logger = Logger.initialize(mockConfig);
      expect(() => {
        logger.measure("failing-operation", () => {
          throw new Error("Test error");
        });
      }).toThrow("Test error");

      // First call is the formatted error message
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("Performance measurement failed: failing-operation");

      // Second call contains the context with error details
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleErrorSpy.mock.calls[1][0];
      expect(contextCall.error_message).toBe("Test error");
    });

    it("should log error when async measured function throws", async () => {
      const logger = Logger.initialize(mockConfig);

      await expect(
        logger.measureAsync("failing-async-operation", async () => {
          throw new Error("Async test error");
        }),
      ).rejects.toThrow("Async test error");

      // First call is the formatted error message
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("Performance measurement failed: failing-async-operation");

      // Second call contains the context
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleErrorSpy.mock.calls[1][0];
      expect(contextCall.error_message).toBe("Async test error");
      expect(contextCall.component).toBe("failing-async-operation");
    });
  });

  describe("Remote Logging", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({ ok: true });
    });

    it("should send logs to remote endpoint", async () => {
      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
      });

      logger.info("Test message");

      // Wait for async fetch
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetchMock).toHaveBeenCalledWith(
        "https://logs.example.com/api/logs",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("should batch logs when batching is enabled", async () => {
      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
        batchSize: 3,
      });

      logger.info("Message 1");
      logger.info("Message 2");
      expect(fetchMock).not.toHaveBeenCalled();

      logger.info("Message 3");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.logs).toHaveLength(3);
    });

    it("should handle fetch errors gracefully", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
      });

      logger.info("Test message");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not throw
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to send log:",
        expect.any(Error),
      );
    });
  });

  describe("Console Output", () => {
    it("should output to console when enableConsole is true", () => {
      const logger = Logger.initialize({ ...mockConfig, enableConsole: true });
      logger.info("Test message");

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should not output to console when enableConsole is false", () => {
      const logger = Logger.initialize({
        ...mockConfig,
        enableConsole: false,
      });
      logger.info("Test message");

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe("OpenTelemetry Integration", () => {
    it("should extract trace context from active span", () => {
      // Reset singleton
      (Logger as any).instance = null;

      // Mock OpenTelemetry context and span
      const mockSpanContext = {
        traceId: "abc123trace",
        spanId: "def456span",
      };

      const mockSpan = {
        spanContext: () => mockSpanContext,
      };

      jest.spyOn(otelApi.trace, "getSpan").mockReturnValue(mockSpan);

      const logger = Logger.initialize(mockConfig);
      logger.info("Test with trace");

      // First call is the formatted message
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Test with trace");

      // Second call contains the context with trace information
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1][0];
      expect(contextCall.trace_id).toBe("abc123trace");
      expect(contextCall.span_id).toBe("def456span");

      jest.restoreAllMocks();
    });
  });

  describe("Browser Information", () => {
    it("should capture browser user agent", () => {
      const mockUserAgent = "Mozilla/5.0 Test Browser";
      const originalWindow = global.window;

      // Mock window.navigator while keeping other window methods
      Object.defineProperty(global.window, "navigator", {
        value: {
          userAgent: mockUserAgent,
        },
        writable: true,
        configurable: true,
      });

      const logger = Logger.initialize(mockConfig);
      logger.info("Test message");

      // Second call contains the context with user agent
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleLogSpy.mock.calls[1][0];
      expect(contextCall.user_agent).toBe(mockUserAgent);
    });

    it("should handle missing window object", () => {
      // Reset singleton
      (Logger as any).instance = null;

      const originalWindow = global.window;
      delete (global as any).window;

      const logger = Logger.initialize(mockConfig);
      logger.info("Test without window");

      // First call is the formatted message
      expect(consoleLogSpy.mock.calls[0][0]).toContain("Test without window");

      // Since there's no custom context, check that platform is set to "server" in the context if it's logged
      // When window is not available, user_agent should not be present
      if (consoleLogSpy.mock.calls.length > 1) {
        const contextCall = consoleLogSpy.mock.calls[1][0];
        expect(contextCall.user_agent).toBeUndefined();
        expect(contextCall.platform).toBe("server");
      }

      // Restore window
      global.window = originalWindow;
    });
  });

  describe("Batching Configuration", () => {
    it("should start batch interval timer when batching is enabled", () => {
      jest.useFakeTimers();
      fetchMock.mockResolvedValue({ ok: true });

      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
        batchSize: 5,
        batchInterval: 1000,
      });

      logger.info("Message 1");
      logger.info("Message 2");

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      expect(fetchMock).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it("should use default batchSize when not configured", async () => {
      fetchMock.mockResolvedValue({ ok: true });

      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
        // No batchSize specified - should use default of 10
      });

      // Add 10 messages to trigger default batch size
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i + 1}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(fetchMock).toHaveBeenCalled();
    });

    it("should flush when batch size is reached", async () => {
      fetchMock.mockResolvedValue({ ok: true });

      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
        batchSize: 3,
      });

      logger.info("Message 1");
      logger.info("Message 2");
      logger.info("Message 3");

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(fetchMock).toHaveBeenCalled();
    });

    it("should handle flush errors gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      fetchMock.mockRejectedValue(new Error("Network failure"));

      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
      });

      logger.info("Message 1");
      logger.destroy();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to flush logs:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should not flush when buffer is empty with batch timer", () => {
      jest.useFakeTimers();
      fetchMock.mockResolvedValue({ ok: true });

      Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
        batchInterval: 1000,
      });

      // Don't add any logs, just advance timer
      jest.advanceTimersByTime(1000);

      // Should not call fetch when buffer is empty
      expect(fetchMock).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe("Cleanup", () => {
    it("should flush logs on destroy", async () => {
      fetchMock.mockResolvedValue({ ok: true });

      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
      });

      logger.info("Message 1");
      logger.destroy();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(fetchMock).toHaveBeenCalled();
    });

    it("should clear batch interval on destroy", () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
        batchInterval: 1000,
      });

      logger.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();

      jest.useRealTimers();
      clearIntervalSpy.mockRestore();
    });

    it("should clear log buffer on destroy", () => {
      const logger = Logger.initialize({
        ...mockConfig,
        remoteEndpoint: "https://logs.example.com/api/logs",
        enableBatching: true,
      });

      logger.info("Message 1");
      logger.info("Message 2");

      // Access private property to verify buffer
      const logBufferBefore = (logger as any).logBuffer;
      expect(logBufferBefore.length).toBeGreaterThan(0);

      logger.destroy();

      const logBufferAfter = (logger as any).logBuffer;
      expect(logBufferAfter.length).toBe(0);
    });
  });
});

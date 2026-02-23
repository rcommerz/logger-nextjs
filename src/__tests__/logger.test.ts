import { Logger } from "../logger";
import { LoggerConfig } from "../types";

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

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"log.level": "INFO"'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message": "Test info message"'),
      );
    });

    it("should log error messages", () => {
      const logger = Logger.initialize(mockConfig);
      logger.error("Test error message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"log.level": "ERROR"'),
      );
    });

    it("should log warning messages", () => {
      const logger = Logger.initialize(mockConfig);
      logger.warn("Test warning message");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"log.level": "WARN"'),
      );
    });

    it("should log debug messages when level is DEBUG", () => {
      const logger = Logger.initialize({ ...mockConfig, level: "DEBUG" });
      logger.debug("Test debug message");

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('"log.level": "DEBUG"'),
      );
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

      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('"user_id": "123"');
      expect(logCall).toContain('"action": "login"');
    });

    it("should extract error details from Error object", () => {
      const logger = Logger.initialize(mockConfig);
      const error = new Error("Test error");
      logger.error("Error occurred", { error });

      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('"error_type": "Error"');
      expect(logCall).toContain('"error_message": "Test error"');
      expect(logCall).toContain('"error_stack"');
    });

    it("should include service metadata", () => {
      const logger = Logger.initialize(mockConfig);
      logger.info("Test message");

      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('"service.name": "test-service"');
      expect(logCall).toContain('"service.version": "1.0.0"');
      expect(logCall).toContain('"env": "test"');
    });
  });

  describe("Log Types", () => {
    it("should log HTTP messages", () => {
      const logger = Logger.initialize(mockConfig);
      logger.http("HTTP request", { method: "GET", url: "/api/test" });

      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('"log_type": "http"');
      expect(logCall).toContain('"method": "GET"');
    });

    it("should log security events", () => {
      const logger = Logger.initialize(mockConfig);
      logger.security("Security event", { action: "failed_login" });

      const logCall = consoleWarnSpy.mock.calls[0][0];
      expect(logCall).toContain('"log_type": "security"');
    });

    it("should log audit events", () => {
      const logger = Logger.initialize(mockConfig);
      logger.audit("Audit event", { action: "user_updated" });

      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('"log_type": "audit"');
    });

    it("should log performance metrics", () => {
      const logger = Logger.initialize(mockConfig);
      logger.performance("Performance metric", { duration_ms: 123 });

      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('"log_type": "performance"');
    });
  });

  describe("Performance Measurement", () => {
    it("should measure sync function execution", () => {
      const logger = Logger.initialize(mockConfig);
      const result = logger.measure("test-operation", () => {
        return "result";
      });

      expect(result).toBe("result");
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('"component": "test-operation"');
      expect(logCall).toContain('"duration_ms"');
    });

    it("should measure async function execution", async () => {
      const logger = Logger.initialize(mockConfig);
      const result = await logger.measureAsync("async-operation", async () => {
        return "async-result";
      });

      expect(result).toBe("async-result");
      const logCall = consoleLogSpy.mock.calls[0][0];
      expect(logCall).toContain('"component": "async-operation"');
    });

    it("should log error when measured function throws", () => {
      const logger = Logger.initialize(mockConfig);
      expect(() => {
        logger.measure("failing-operation", () => {
          throw new Error("Test error");
        });
      }).toThrow("Test error");

      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('"error_message": "Test error"');
    });

    it("should log error when async measured function throws", async () => {
      const logger = Logger.initialize(mockConfig);

      await expect(
        logger.measureAsync("failing-async-operation", async () => {
          throw new Error("Async test error");
        }),
      ).rejects.toThrow("Async test error");

      const logCall = consoleErrorSpy.mock.calls[0][0];
      expect(logCall).toContain('"error_message": "Async test error"');
      expect(logCall).toContain('"component": "failing-async-operation"');
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
      // Mock OpenTelemetry context and span
      const mockSpanContext = {
        traceId: "abc123trace",
        spanId: "def456span",
      };

      const mockSpan = {
        spanContext: () => mockSpanContext,
      };

      const otelApi = require("@opentelemetry/api");
      const activeContext = otelApi.context.active();
      jest.spyOn(otelApi.trace, "getSpan").mockReturnValue(mockSpan);

      const logger = Logger.initialize(mockConfig);
      logger.info("Test with trace");

      const logOutput = consoleLogSpy.mock.calls[0][0];
      const logData = JSON.parse(logOutput);

      expect(logData.trace_id).toBe("abc123trace");
      expect(logData.span_id).toBe("def456span");

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

      const logOutput = consoleLogSpy.mock.calls[0][0];
      const logData = JSON.parse(logOutput);

      expect(logData.user_agent).toBe(mockUserAgent);
    });

    it("should handle missing window object", () => {
      // Reset singleton
      (Logger as any).instance = null;

      const originalWindow = global.window;
      delete (global as any).window;

      const logger = Logger.initialize(mockConfig);
      logger.info("Test without window");

      const logOutput = consoleLogSpy.mock.calls[0][0];
      const logData = JSON.parse(logOutput);

      expect(logData.user_agent).toBeUndefined();

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

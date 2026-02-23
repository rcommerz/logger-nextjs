import { renderHook, act } from "@testing-library/react";
import {
  useLogger,
  useLogLifecycle,
  useLogError,
  useLogPerformance,
  useLogAction,
  useLogAsyncOperation,
  useLogPageView,
  useLogApiCall,
} from "../hooks";
import { Logger } from "../logger";
import { LoggerConfig } from "../types";

describe("React Hooks", () => {
  let mockLogger: any;
  const mockConfig: LoggerConfig = {
    serviceName: "test-service",
    serviceVersion: "1.0.0",
    env: "test",
    enableConsole: false,
  };

  beforeEach(() => {
    // Reset singleton
    (Logger as any).instance = null;
    Logger.initialize(mockConfig);

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      http: jest.fn(),
      performance: jest.fn(),
    };

    jest.spyOn(Logger, "getInstance").mockReturnValue(mockLogger as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("useLogger", () => {
    it("should return logger instance", () => {
      const { result } = renderHook(() => useLogger());
      expect(result.current).toBe(mockLogger);
    });
  });

  describe("useLogLifecycle", () => {
    it("should log component mount", () => {
      renderHook(() => useLogLifecycle("TestComponent"));

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Component mounted: TestComponent",
        expect.objectContaining({
          component: "TestComponent",
          action: "mount",
        })
      );
    });

    it("should log component mount with metadata", () => {
      renderHook(() =>
        useLogLifecycle("TestComponent", { page: "home", user: "123" })
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Component mounted: TestComponent",
        expect.objectContaining({
          component: "TestComponent",
          action: "mount",
          page: "home",
          user: "123",
        })
      );
    });

    it("should log component unmount", () => {
      const { unmount } = renderHook(() => useLogLifecycle("TestComponent"));

      mockLogger.debug.mockClear();
      unmount();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Component unmounted: TestComponent",
        expect.objectContaining({
          component: "TestComponent",
          action: "unmount",
        })
      );
    });
  });

  describe("useLogError", () => {
    it("should return error logging function", () => {
      const { result } = renderHook(() => useLogError());
      expect(typeof result.current).toBe("function");
    });

    it("should log errors", () => {
      const { result } = renderHook(() => useLogError());
      const error = new Error("Test error");

      act(() => {
        result.current(error);
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Component error occurred",
        expect.objectContaining({
          error,
        })
      );
    });

    it("should log errors with context", () => {
      const { result } = renderHook(() => useLogError());
      const error = new Error("Test error");

      act(() => {
        result.current(error, { component: "TestComponent", user_id: "123" });
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Component error occurred",
        expect.objectContaining({
          error,
          component: "TestComponent",
          user_id: "123",
        })
      );
    });
  });

  describe("useLogPerformance", () => {
    beforeEach(() => {
      jest.spyOn(performance, "now").mockReturnValue(1000);
    });

    it("should log component render performance", () => {
      const { rerender } = renderHook(() => useLogPerformance("TestComponent"));

      expect(mockLogger.performance).toHaveBeenCalledWith(
        "Component render: TestComponent",
        expect.objectContaining({
          component: "TestComponent",
          render_count: 1,
          duration_ms: 0,
        })
      );

      mockLogger.performance.mockClear();
      jest.spyOn(performance, "now").mockReturnValue(1050);
      rerender();

      expect(mockLogger.performance).toHaveBeenCalledWith(
        "Component render: TestComponent",
        expect.objectContaining({
          component: "TestComponent",
          render_count: 2,
          duration_ms: 50,
        })
      );
    });
  });

  describe("useLogAction", () => {
    it("should return action logging function", () => {
      const { result } = renderHook(() => useLogAction());
      expect(typeof result.current).toBe("function");
    });

    it("should log user actions", () => {
      const { result } = renderHook(() => useLogAction());

      act(() => {
        result.current("button_click");
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "User action: button_click",
        expect.objectContaining({
          action: "button_click",
        })
      );
    });

    it("should log user actions with context", () => {
      const { result } = renderHook(() => useLogAction());

      act(() => {
        result.current("add_to_cart", {
          product_id: "123",
          quantity: 2,
        });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "User action: add_to_cart",
        expect.objectContaining({
          action: "add_to_cart",
          product_id: "123",
          quantity: 2,
        })
      );
    });
  });

  describe("useLogAsyncOperation", () => {
    it("should log successful async operations", async () => {
      const { result } = renderHook(() => useLogAsyncOperation());

      const mockOperation = jest.fn().mockResolvedValue("success");

      await act(async () => {
        const data = await result.current("testOperation", mockOperation);
        expect(data).toBe("success");
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Async operation completed: testOperation",
        expect.objectContaining({
          component: "testOperation",
          duration_ms: expect.any(Number),
          status: "success",
        })
      );
    });

    it("should log successful async operations with context", async () => {
      const { result } = renderHook(() => useLogAsyncOperation());

      const mockOperation = jest.fn().mockResolvedValue("result");

      await act(async () => {
        await result.current("fetchData", mockOperation, { user_id: "123" });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Async operation completed: fetchData",
        expect.objectContaining({
          component: "fetchData",
          status: "success",
          user_id: "123",
          duration_ms: expect.any(Number),
        })
      );
    });

    it("should log failed async operations", async () => {
      const { result } = renderHook(() => useLogAsyncOperation());

      const error = new Error("Operation failed");
      const mockOperation = jest.fn().mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current("failingOperation", mockOperation);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Async operation failed: failingOperation",
        expect.objectContaining({
          component: "failingOperation",
          duration_ms: expect.any(Number),
          status: "error",
          error,
        })
      );
    });

    it("should log failed async operations with context", async () => {
      const { result } = renderHook(() => useLogAsyncOperation());

      const error = new Error("Failed");
      const mockOperation = jest.fn().mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current("apiCall", mockOperation, { endpoint: "/api/data" });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Async operation failed: apiCall",
        expect.objectContaining({
          status: "error",
          endpoint: "/api/data",
          duration_ms: expect.any(Number),
        })
      );
    });
  });

  describe("useLogPageView", () => {
    beforeEach(() => {
      // Mock window and document
      Object.defineProperty(window, "location", {
        value: { href: "https://example.com/page" },
        writable: true,
        configurable: true,
      });
      Object.defineProperty(document, "referrer", {
        value: "https://google.com",
        writable: true,
        configurable: true,
      });
    });

    it("should log page views", () => {
      renderHook(() => useLogPageView("HomePage"));

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Page view: HomePage",
        expect.objectContaining({
          page: "HomePage",
          url: "https://example.com/page",
          referrer: "https://google.com",
        })
      );
    });

    it("should log page views with metadata", () => {
      renderHook(() =>
        useLogPageView("ProductPage", { product_id: "123", category: "shoes" })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Page view: ProductPage",
        expect.objectContaining({
          page: "ProductPage",
          product_id: "123",
          category: "shoes",
        })
      );
    });
  });

  describe("useLogApiCall", () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
      fetchMock = global.fetch as jest.Mock;
      fetchMock.mockClear();
    });

    it("should log successful API calls", async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: "test" }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLogApiCall());

      await act(async () => {
        const data = await result.current("/api/test", "GET");
        expect(data).toEqual({ data: "test" });
      });

      expect(mockLogger.http).toHaveBeenCalledWith(
        "API request: GET /api/test",
        expect.objectContaining({
          method: "GET",
          url: "/api/test",
          request_id: expect.stringContaining("GET-/api/test"),
        })
      );

      expect(mockLogger.http).toHaveBeenCalledWith(
        "API response: GET /api/test",
        expect.objectContaining({
          method: "GET",
          url: "/api/test",
          status_code: 200,
          duration_ms: expect.any(Number),
        })
      );
    });

    it("should log failed API calls", async () => {
      const error = new Error("Network error");
      fetchMock.mockRejectedValue(error);

      const { result } = renderHook(() => useLogApiCall());

      await act(async () => {
        try {
          await result.current("/api/fail", "POST");
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockLogger.http).toHaveBeenCalledWith(
        "API request: POST /api/fail",
        expect.anything()
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "API error: POST /api/fail",
        expect.objectContaining({
          method: "POST",
          url: "/api/fail",
          duration_ms: expect.any(Number),
          error,
        })
      );
    });

    it("should pass options to fetch", async () => {
      const mockResponse = {
        status: 201,
        json: jest.fn().mockResolvedValue({ id: 1 }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLogApiCall());

      await act(async () => {
        await result.current("/api/create", "POST", {
          body: JSON.stringify({ name: "test" }),
          headers: { "Content-Type": "application/json" },
        });
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/create",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "test" }),
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });
});

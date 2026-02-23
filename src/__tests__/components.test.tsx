import React from "react";
import { render, screen } from "@testing-library/react";
import { LoggerErrorBoundary, withLoggerErrorBoundary } from "../components";
import { Logger } from "../logger";
import { LoggerConfig } from "../types";

describe("Error Boundary Components", () => {
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
      error: jest.fn(),
    };

    jest.spyOn(Logger, "getInstance").mockReturnValue(mockLogger as any);

    // Suppress console.error for these tests
    jest.spyOn(console, "error").mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("LoggerErrorBoundary", () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>No error</div>;
    };

    it("should render children when no error occurs", () => {
      render(
        <LoggerErrorBoundary>
          <ThrowError shouldThrow={false} />
        </LoggerErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("should catch errors and log them", () => {
      render(
        <LoggerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LoggerErrorBoundary>
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        "React error boundary caught error",
        expect.objectContaining({
          error: expect.any(Error),
          error_boundary: true,
          component_stack: expect.any(String),
        })
      );
    });

    it("should render custom fallback UI", () => {
      const CustomFallback = () => <div>Custom Error UI</div>;

      render(
        <LoggerErrorBoundary fallback={<CustomFallback />}>
          <ThrowError shouldThrow={true} />
        </LoggerErrorBoundary>
      );

      expect(screen.getByText("Custom Error UI")).toBeInTheDocument();
    });

    it("should render default error UI when no fallback provided", () => {
      render(
        <LoggerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LoggerErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("We've logged the error and will investigate.")).toBeInTheDocument();
    });

    it("should log error message and stack", () => {
      render(
        <LoggerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LoggerErrorBoundary>
      );

      const loggedError = mockLogger.error.mock.calls[0][1].error;
      expect(loggedError.message).toBe("Test error");
      expect(loggedError.stack).toBeDefined();
    });

    it("should call onError prop when provided", () => {
      const onErrorMock = jest.fn();

      render(
        <LoggerErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </LoggerErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("should show error details in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      render(
        <LoggerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LoggerErrorBoundary>
      );

      // Should have error details visible in development
      expect(screen.getByText("Error details")).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("withLoggerErrorBoundary", () => {
    const TestComponent = ({ name }: { name: string }) => {
      return <div>Hello {name}</div>;
    };

    it("should wrap component with error boundary", () => {
      const WrappedComponent = withLoggerErrorBoundary(TestComponent);

      render(<WrappedComponent name="World" />);

      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should pass props to wrapped component", () => {
      const WrappedComponent = withLoggerErrorBoundary(TestComponent);

      render(<WrappedComponent name="Test User" />);

      expect(screen.getByText("Hello Test User")).toBeInTheDocument();
    });

    it("should catch errors in wrapped component", () => {
      const ThrowingComponent = () => {
        throw new Error("Wrapped component error");
      };

      const WrappedComponent = withLoggerErrorBoundary(ThrowingComponent);

      render(<WrappedComponent />);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "React error boundary caught error",
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });

    it("should use custom fallback", () => {
      const ThrowingComponent = () => {
        throw new Error("Error");
      };
      const CustomFallback = () => <div>Custom HOC Fallback</div>;

      const WrappedComponent = withLoggerErrorBoundary(
        ThrowingComponent,
        <CustomFallback />
      );

      render(<WrappedComponent />);

      expect(screen.getByText("Custom HOC Fallback")).toBeInTheDocument();
    });
  });
});

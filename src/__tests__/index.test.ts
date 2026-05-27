import * as LoggerModule from "../index";
import * as ClientModule from "../client";

describe("Index Exports (Server-safe)", () => {
  it("should export Logger class", () => {
    expect(LoggerModule.Logger).toBeDefined();
  });

  it("should export getLogger function", () => {
    expect(LoggerModule.getLogger).toBeDefined();
  });

  it("should NOT export React hooks (moved to /client)", () => {
    expect((LoggerModule as any).useLogger).toBeUndefined();
    expect((LoggerModule as any).LoggerErrorBoundary).toBeUndefined();
  });
});

describe("Client Exports", () => {
  it("should export React hooks", () => {
    expect(ClientModule.useLogger).toBeDefined();
    expect(ClientModule.useLogLifecycle).toBeDefined();
    expect(ClientModule.useLogError).toBeDefined();
    expect(ClientModule.useLogPerformance).toBeDefined();
    expect(ClientModule.useLogAction).toBeDefined();
    expect(ClientModule.useLogAsyncOperation).toBeDefined();
    expect(ClientModule.useLogPageView).toBeDefined();
    expect(ClientModule.useLogApiCall).toBeDefined();
  });

  it("should export components", () => {
    expect(ClientModule.LoggerErrorBoundary).toBeDefined();
    expect(ClientModule.withLoggerErrorBoundary).toBeDefined();
  });
});

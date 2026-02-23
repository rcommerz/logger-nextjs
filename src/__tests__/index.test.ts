import * as LoggerModule from "../index";

describe("Index Exports", () => {
  it("should export Logger class", () => {
    expect(LoggerModule.Logger).toBeDefined();
  });

  it("should export getLogger function", () => {
    expect(LoggerModule.getLogger).toBeDefined();
  });

  it("should export React hooks", () => {
    expect(LoggerModule.useLogger).toBeDefined();
    expect(LoggerModule.useLogLifecycle).toBeDefined();
    expect(LoggerModule.useLogError).toBeDefined();
    expect(LoggerModule.useLogPerformance).toBeDefined();
    expect(LoggerModule.useLogAction).toBeDefined();
    expect(LoggerModule.useLogAsyncOperation).toBeDefined();
    expect(LoggerModule.useLogPageView).toBeDefined();
    expect(LoggerModule.useLogApiCall).toBeDefined();
  });

  it("should export components", () => {
    expect(LoggerModule.LoggerErrorBoundary).toBeDefined();
    expect(LoggerModule.withLoggerErrorBoundary).toBeDefined();
  });
});

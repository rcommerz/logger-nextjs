import "@testing-library/jest-dom";

// Mock performance API if not available
if (typeof performance === "undefined") {
  global.performance = {
    now: () => Date.now(),
  } as any;
}

// Mock fetch if not available
if (typeof fetch === "undefined") {
  global.fetch = jest.fn();
}

// Mock window if not available (for jsdom sometimes it's incomplete)
if (typeof window !== "undefined" && !window.addEventListener) {
  window.addEventListener = jest.fn();
  window.removeEventListener = jest.fn();
}

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

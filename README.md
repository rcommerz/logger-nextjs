# logger-nextjs

[![npm version](https://badge.fury.io/js/%40rcommerz%2Flogger-nextjs.svg)](https://www.npmjs.com/package/@rcommerz/logger-nextjs)
[![CI Tests](https://github.com/rcommerz/logger-nextjs/actions/workflows/test.yml/badge.svg)](https://github.com/rcommerz/logger-nextjs/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

Production-ready structured logging package for Next.js and React applications with OpenTelemetry support, React hooks, and browser-friendly design.

## Features

- ✅ **Browser-Compatible** - Works in client-side React/Next.js applications
- ✅ **React Hooks** - Easy integration with functional components
- ✅ **Error Boundary** - Automatic error logging with React Error Boundary
- ✅ **OpenTelemetry Integration** - Automatic trace_id and span_id extraction
- ✅ **Remote Logging** - Send logs to backend endpoints
- ✅ **Batch Logging** - Efficient log batching for performance
- ✅ **Performance Tracking** - Built-in performance measurement utilities
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Zero Dependencies** - Only @opentelemetry/api as peer dependency
- ✅ **Singleton Pattern** - Initialize once, use everywhere

## Installation

```bash
npm install @rcommerz/logger-nextjs
# or
yarn add @rcommerz/logger-nextjs
# or
pnpm add @rcommerz/logger-nextjs
```

## Quick Start

### 1. Initialize Logger (in your app entry point)

**For Next.js App Router:**

```typescript
// app/layout.tsx
import { Logger } from '@rcommerz/logger-nextjs';

Logger.initialize({
  serviceName: 'my-nextjs-app',
  serviceVersion: '1.0.0',
  env: process.env.NODE_ENV || 'development',
  enableConsole: process.env.NODE_ENV === 'development',
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
  enableBatching: true,
  batchSize: 10,
  batchInterval: 5000,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**For Next.js Pages Router:**

```typescript
// pages/_app.tsx
import { Logger } from '@rcommerz/logger-nextjs';
import type { AppProps } from 'next/app';

Logger.initialize({
  serviceName: 'my-nextjs-app',
  serviceVersion: '1.0.0',
  env: process.env.NODE_ENV || 'development',
});

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

**For React (non-Next.js):**

```typescript
// index.tsx or App.tsx
import { Logger } from '@rcommerz/logger-nextjs';

Logger.initialize({
  serviceName: 'my-react-app',
  serviceVersion: '1.0.0',
  env: process.env.NODE_ENV || 'development',
});
```

### 2. Use Logger in Components

```typescript
import { useLogger } from '@rcommerz/logger-nextjs';

export default function MyComponent() {
  const logger = useLogger();

  const handleClick = () => {
    logger.info('Button clicked', {
      component: 'MyComponent',
      action: 'button_click',
    });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Usage Examples

### Basic Logging

```typescript
import { Logger } from '@rcommerz/logger-nextjs';

const logger = Logger.getInstance();

// Log levels
logger.info('Application started');
logger.error('Something went wrong', { error: err });
logger.warn('This is a warning');
logger.debug('Debug information');

// With context
logger.info('User logged in', {
  user_id: 'usr_123',
  session_id: 'sess_456',
  ip: '192.168.1.1',
});
```

### React Hooks

#### useLogger - Get logger instance

```typescript
import { useLogger } from '@rcommerz/logger-nextjs';

function MyComponent() {
  const logger = useLogger();

  useEffect(() => {
    logger.info('Component mounted');
  }, [logger]);

  return <div>Content</div>;
}
```

#### useLogLifecycle - Auto-log mount/unmount

```typescript
import { useLogLifecycle } from '@rcommerz/logger-nextjs';

function MyComponent() {
  useLogLifecycle('MyComponent', { page: 'home' });
  return <div>Content</div>;
}
```

#### useLogAction - Track user actions

```typescript
import { useLogAction } from '@rcommerz/logger-nextjs';

function ProductCard({ productId }: { productId: string }) {
  const logAction = useLogAction();

  const handleAddToCart = () => {
    logAction('add_to_cart', {
      product_id: productId,
      action: 'add_to_cart',
    });
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

#### useLogPageView - Track page views

```typescript
import { useLogPageView } from '@rcommerz/logger-nextjs';

export default function ProductPage({ productId }: { productId: string }) {
  useLogPageView('ProductPage', { product_id: productId });

  return <div>Product details</div>;
}
```

#### useLogApiCall - Track API calls

```typescript
import { useLogApiCall } from '@rcommerz/logger-nextjs';

function useProducts() {
  const logApiCall = useLogApiCall();

  const fetchProducts = async () => {
    const data = await logApiCall<Product[]>(
      '/api/products',
      'GET'
    );
    return data;
  };

  return { fetchProducts };
}
```

#### useLogAsyncOperation - Track async operations

```typescript
import { useLogAsyncOperation } from '@rcommerz/logger-nextjs';

function CheckoutButton() {
  const logAsync = useLogAsyncOperation();

  const handleCheckout = async () => {
    await logAsync(
      'Checkout Process',
      async () => {
        // Your checkout logic
        await processPayment();
        await createOrder();
      },
      { cart_items: 3, total: 299.99 }
    );
  };

  return <button onClick={handleCheckout}>Checkout</button>;
}
```

#### useLogPerformance - Track render performance

```typescript
import { useLogPerformance } from '@rcommerz/logger-nextjs';

function HeavyComponent() {
  useLogPerformance('HeavyComponent');
  // Component will log render time and count
  return <div>Heavy content</div>;
}
```

### Error Boundary

#### Wrap your app with LoggerErrorBoundary

```typescript
import { LoggerErrorBoundary } from '@rcommerz/logger-nextjs';

export default function App({ children }: { children: React.ReactNode }) {
  return (
    <LoggerErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        // Additional error handling
        console.error('Caught by boundary:', error);
      }}
    >
      {children}
    </LoggerErrorBoundary>
  );
}
```

#### Use HOC to wrap individual components

```typescript
import { withLoggerErrorBoundary } from '@rcommerz/logger-nextjs';

function MyComponent() {
  return <div>Content</div>;
}

export default withLoggerErrorBoundary(MyComponent);
```

### Performance Measurement

```typescript
const logger = Logger.getInstance();

// Measure sync function
const result = logger.measure('calculateTotal', () => {
  return items.reduce((sum, item) => sum + item.price, 0);
});

// Measure async function
const data = await logger.measureAsync('fetchUserData', async () => {
  const response = await fetch('/api/user');
  return response.json();
}, { user_id: '123' });
```

### Log Types

```typescript
const logger = Logger.getInstance();

// Normal logs
logger.info('User action', { action: 'click' });

// HTTP requests
logger.http('API Request', {
  method: 'POST',
  url: '/api/orders',
  status_code: 201,
  duration_ms: 245,
});

// Security events
logger.security('Failed login attempt', {
  user_id: 'user_123',
  ip: '192.168.1.1',
  reason: 'invalid_password',
});

// Audit logs
logger.audit('Permission changed', {
  user_id: 'user_123',
  admin_id: 'admin_456',
  old_role: 'user',
  new_role: 'admin',
});

// Performance metrics
logger.performance('Page load', {
  page: '/products',
  duration_ms: 1234,
  resources_loaded: 15,
});
```

### Remote Logging

```typescript
Logger.initialize({
  serviceName: 'my-app',
  serviceVersion: '1.0.0',
  env: 'production',
  remoteEndpoint: 'https://logs.myapp.com/api/logs',
  enableBatching: true,
  batchSize: 20,
  batchInterval: 10000,
});

// Logs will be sent to remote endpoint automatically
logger.info('This will be sent to remote endpoint');

// Manual flush (useful before page unload)
logger.flush();
```

## Configuration

```typescript
interface LoggerConfig {
  serviceName: string;              // Your service/app name
  serviceVersion: string;           // Version (semver recommended)
  env: string;                      // Environment: development, staging, production
  level?: LogLevel;                 // Minimum log level (default: INFO)
  enableConsole?: boolean;          // Output to console (default: true in dev)
  remoteEndpoint?: string;          // Backend logging endpoint
  enableBatching?: boolean;         // Enable log batching (default: false)
  batchSize?: number;               // Logs per batch (default: 10)
  batchInterval?: number;           // Batch interval in ms (default: 5000)
  metadata?: Record<string, any>;   // Custom metadata for all logs
}
```

## Log Structure

All logs follow this structure:

```json
{
  "@timestamp": "2026-02-23T10:30:00.123Z",
  "log.level": "INFO",
  "log_type": "normal",
  "message": "User logged in",
  "service.name": "my-nextjs-app",
  "service.version": "1.0.0",
  "env": "production",
  "trace_id": "abc123...",
  "span_id": "def456...",
  "user_agent": "Mozilla/5.0...",
  "user_id": "usr_123",
  "custom_field": "value"
}
```

## Next.js Integration

### App Router (Next.js 13+)

```typescript
// app/providers.tsx
'use client';

import { Logger } from '@rcommerz/logger-nextjs';
import { useEffect } from 'react';

export function LoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Logger.initialize({
      serviceName: process.env.NEXT_PUBLIC_APP_NAME!,
      serviceVersion: process.env.NEXT_PUBLIC_APP_VERSION!,
      env: process.env.NODE_ENV,
      remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
    });
  }, []);

  return children;
}
```

```typescript
// app/layout.tsx
import { LoggerProvider } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <LoggerProvider>{children}</LoggerProvider>
      </body>
    </html>
  );
}
```

### Pages Router (Next.js 12 and earlier)

```typescript
// pages/_app.tsx
import { Logger, LoggerErrorBoundary } from '@rcommerz/logger-nextjs';
import { useEffect } from 'react';

Logger.initialize({
  serviceName: 'my-app',
  serviceVersion: '1.0.0',
  env: process.env.NODE_ENV,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LoggerErrorBoundary>
      <Component {...pageProps} />
    </LoggerErrorBoundary>
  );
}
```

## OpenTelemetry Integration

The logger automatically extracts trace_id and span_id from OpenTelemetry context when available:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-app');

tracer.startActiveSpan('user-action', (span) => {
  logger.info('Action performed'); // Will include trace_id and span_id
  span.end();
});
```

## Best Practices

1. **Initialize Once**: Call `Logger.initialize()` in your app entry point (\_app.tsx or layout.tsx)
2. **Use Hooks**: Prefer hooks like `useLogger()` in functional components
3. **Add Context**: Always include relevant context with your logs
4. **Enable Batching in Production**: Use batching to reduce network overhead
5. **Sensitive Data**: Never log passwords, tokens, or sensitive user data
6. **Error Objects**: Pass Error objects in context for automatic extraction
7. **Performance**: Use `measure` and `measureAsync` for performance tracking
8. **Cleanup**: Logger automatically flushes on page unload

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import type {
  LogLevel,
  LogType,
  LoggerConfig,
  LogContext,
  LogEntry,
} from '@rcommerz/logger-nextjs';
```

## Testing

The package includes comprehensive tests. Run them with:

```bash
npm test
npm run test:coverage
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

## Performance

- **Zero runtime dependencies** (only OpenTelemetry API)
- **Async logging** to avoid blocking UI
- **Batching support** to reduce network calls
- **Lightweight** (~10KB minified + gzipped)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [RCOMMERZ](https://github.com/rcommerz)

## Support

- **Issues**: https://github.com/rcommerz/logger-nextjs/issues
- **Documentation**: https://github.com/rcommerz/logger-nextjs#readme

## Related Packages

- [@rcommerz/logger-express](https://www.npmjs.com/package/@rcommerz/logger-express) - Express/Node.js backend logger
- [@rcommerz/logger-laravel](https://packagist.org/packages/rcommerz/logger-laravel) - Laravel backend logger
- [@rcommerz/logger-go](https://pkg.go.dev/github.com/rcommerz/logger-go) - Go backend logger

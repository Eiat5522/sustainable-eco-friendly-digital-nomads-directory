# **Implementation Plan: Integrating Pino Structured Logging into Next.js 15**

## **1.0 Introduction and Strategic Objectives**

This document provides a comprehensive, step-by-step implementation plan for integrating **Pino**, a high-performance structured logger, into an existing **Next.js 15** application.

The strategic migration to structured logging is critical for enhancing the **observability** of our application. By adopting this approach, we will improve debuggability across server and client environments, boost logging performance with minimal overhead, and establish a strong foundation for observability and APM integrations.

---

## **Core Goals**

The primary objectives of this implementation are:

### **• Establish a High-Performance Logging Foundation**

Implement a low-overhead logging solution optimized for performance even with heavy instrumentation.

### **• Implement a Unified Logging Interface**

Create a consistent logging interface usable in Server Components, Client Components, and API Routes.

### **• Ensure Type-Safe and Context-Rich Logging**

Use TypeScript to support contextual metadata (request IDs, module identifiers, etc.).

### **• Enable Seamless Telemetry Integration**

Enable correlation of logs with traces using OpenTelemetry or Datadog.

---

## **Implementation Phases**

This plan is structured into five phases:

1. **Project Scaffolding and Initial Configuration**
2. **Development of the Unified Logger Utility**
3. **Telemetry and APM Integration**
4. **Validation and Testing Strategy**
5. **Usage Guidelines and Rollout**

---

# **2.0 Phase 1: Project Scaffolding and Initial Configuration**

This phase sets up dependencies and Next.js 15 configurations to ensure Pino functions correctly without causing bundling errors or client-side breakage.

---

## **2.1 Dependency Installation**

Install Pino and Pino Pretty:

```bash
npm install pino pino-pretty
```

---

## **2.2 Next.js Project Configuration**

### **1. Externalize Server Packages**

Add the following to `next.config.js`:

```js
// next.config.js

/** @type {import("next").NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty'],
};

module.exports = nextConfig;
```

This ensures Pino is not bundled into the client build.

---

### **2. Resolve `thread-stream` Bundling Issues**

Pino transports depend on `thread-stream`, which must be excluded from bundling:

```js
// next.config.js

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({ "thread-stream": "commonjs thread-stream" });
    }
    return config;
  }
};
```

With this prepared, we can now build the unified logger utility.

---

# **3.0 Phase 2: Development of the Unified Logger Utility**

This phase creates the reusable centralized logger for both server and client runtimes.

---

## **3.1 Server-Side Configuration**

Place the following in `src/lib/logger.ts`:

```ts
// src/lib/logger.ts
import pino, { Logger, TransportTargetOptions } from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseOptions = {
  level: process.env.PINO_LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  redact: ['req.headers.authorization', 'user.password'],
};

const developmentTransport: TransportTargetOptions = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: true,
  },
};

const productionTransports: TransportTargetOptions[] = [
  { target: 'pino/file', options: { destination: 'logs/app.log', mkdir: true } },
  { target: 'pino-pretty', options: { colorize: true }, level: 'debug' },
  { target: 'pino-opentelemetry-transport', level: 'error' },
];

export const serverLogger: Logger = pino({
  ...baseOptions,
  transport: isDevelopment
    ? developmentTransport
    : { targets: productionTransports },
});
```

---

### **Key Configuration Notes**

| Setting       | Purpose                                               |
| ------------- | ----------------------------------------------------- |
| **level**     | Controls min log level (debug for dev, info for prod) |
| **redact**    | Masks sensitive fields                                |
| **transport** | Configuration for dev/prod transports                 |

---

### **Child Loggers for Context**

```ts
import { serverLogger } from '@/lib/logger';

const log = serverLogger.child({ requestID: 'xyz-123' });

log.info("User initiated signup process.");
```

---

## **3.2 Client-Side Logging Strategy**

```ts
import pino, { Logger } from 'pino';

const clientLogger: Logger = pino({
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  browser: {
    asObject: true,
    write: (logObj) => {
      const { level, msg, time, ...rest } = logObj;
      const ts = time ? new Date(time).toISOString() : new Date().toISOString();
      const levelLabel = pino.levels.labels[level] || 'info';
      const logMethod = level >= 50 ? 'error' : level >= 40 ? 'warn' : 'info';

      console[logMethod](`${ts} [${levelLabel.toUpperCase()}] ${msg}`, rest);
    }
  }
});
```

---

## **3.3 Unified Logger Interface**

```ts
// src/lib/logger.ts

export interface LoggerInterface {
  debug(obj: unknown, msg?: string): void;
  debug(msg: string): void;
  info(obj: unknown, msg?: string): void;
  info(msg: string): void;
  warn(obj: unknown, msg?: string): void;
  warn(msg: string): void;
  error(obj: unknown, msg?: string): void;
  error(msg: string): void;
  child(bindings: Record<string, any>): LoggerInterface;
}

let logger: LoggerInterface;

// Server branch
if (typeof window === 'undefined') {
  const pino = require('pino');
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const baseOptions = {
    level: process.env.PINO_LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    redact: ['req.headers.authorization', 'user.password'],
  };

  const developmentTransport = {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: true },
  };

  const productionTransports = [
    { target: 'pino/file', options: { destination: 'logs/app.log', mkdir: true } },
    { target: 'pino-opentelemetry-transport', level: 'error' },
  ];

  logger = pino({
    ...baseOptions,
    transport: isDevelopment
      ? developmentTransport
      : { targets: productionTransports },
  });
}
// Client branch
else {
  const pino = require('pino');

  logger = pino({
    level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
    browser: {
      asObject: true,
      write: (logObj: Record<string, any>) => {
        const { level, msg, time, ...rest } = logObj;
        const ts = time ? new Date(time).toISOString() : new Date().toISOString();
        const levelLabel = pino.levels.labels[level] || 'info';
        const logMethod = level >= 50 ? 'error' : level >= 40 ? 'warn' : 'info';
        console[logMethod](`${ts} [${levelLabel.toUpperCase()}] ${msg}`, Object.keys(rest).length > 0 ? rest : '');
      }
    }
  });
}

export { logger };
```

---

### **Alternative: Explicit File Separation**

* `logger.server.ts` for server
* `logger.client.ts` for browser

Cleaner for static analysis.

---

# **4.0 Phase 3: Telemetry and APM Integration**

Logs become much more powerful when correlated with traces.

---

## **4.1 OpenTelemetry Integration**

### **Method 1: Transport-Based**

Use `pino-opentelemetry-transport`.

### **Method 2: Trace Context Injection**

Use `pino.mixin`.

---

## **4.2 Datadog Integration**

### **Recommended: Datadog Agent with Automatic Injection**

Set:

```bash
DD_LOGS_INJECTION=true
```

This injects:

* `dd.trace_id`
* `dd.span_id`

---

# **5.0 Phase 4: Validation and Testing Strategy**

## **5.1 Verifying Log Calls with Jest Spies**

```ts
import { logger } from '@/lib/logger';
import { signupUser } from '@/app/actions/signupUser';

describe('signupUser', () => {
  it('should log an informational message on successful signup', async () => {
    const infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

    await signupUser({ name: 'Alice', email: 'alice@example.com' });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.any(String) }),
      expect.stringContaining('User signed up successfully')
    );

    infoSpy.mockRestore();
  });
});
```

---

## **5.2 Managing Log Output in Tests**

Suppress logs:

```json
"scripts": {
  "test": "LOG_LEVEL=silent jest"
}
```

---

## **5.3 Ensuring Log Reliability**

For synchronous logging:

* `pino.destination({ sync: true })`
* `logger.flush()`
* `pino.final()`

---

# **6.0 Phase 5: Usage Guidelines and Rollout**

## **6.1 Server Components & API Routes**

```ts
// app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const requestID = req.headers.get('x-request-id') || randomUUID();
  const log = logger.child({ requestID });

  try {
    const data = await req.json();
    log.info({ email: data.email }, 'Received signup request');

    const userId = 'user-12345';
    log.info({ userId }, 'Signup successful');
    return NextResponse.json({ success: true, userId });
  } catch (error) {
    log.error({ err: error }, 'Signup failed');
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

---

## **6.2 Client Components Example**

```tsx
'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';

export function SignupForm() {
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    logger.info({ email }, 'Submitting signup form from client');

    try {
      logger.debug('Form submission successful');
    } catch (error) {
      logger.error({ err: error }, 'Client-side form submission failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

---

# **7.0 Summary and Go-Live Checklist**

## **Go-Live Checklist**

* [ ] JSON logs enabled in production
* [ ] Sensitive data redacted
* [ ] Trace IDs correctly injected
* [ ] Client-side logger avoids Node transports
* [ ] Log levels set via environment variables
* [ ] Jest tests validate logging side effects
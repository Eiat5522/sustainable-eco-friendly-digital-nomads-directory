// Node-only installer for logger exit/flush handlers.
// This file must only be imported in Node.js server contexts.

interface LogEntry {
  msg: string;
  context?: unknown;
}

let handlersInstalled = false;

export function installExitFlushHandlers() {
  if (typeof process === 'undefined') return;
  if (handlersInstalled) return;
  try {
    const globalAny = globalThis as unknown as { __logQueue?: Array<LogEntry> };

    const flushNow = () => {
      try {
        const q = globalAny.__logQueue ?? [];
        globalAny.__logQueue = [];
        for (const entry of q) {
          try {
            // Use console.error as a fallback if pino isn't available during shutdown
            // biome-ignore lint/suspicious/noConsole: intentional fallback for logging during shutdown
            if (entry?.context && entry?.msg && typeof console.error === 'function') {
              // biome-ignore lint/suspicious/noConsole: intentional fallback for logging during shutdown
              console.error(entry.msg, entry.context);
            }
          } catch (_) {
            // ignore
          }
        }
      } catch (_) {
        // ignore
      }
    };

    try {
      process.on('beforeExit', flushNow);
      process.on('exit', flushNow);
      process.on('SIGINT', () => {
        flushNow();
        try {
          process.exit(130);
        } catch (_) {
          // ignore
        }
      });
      process.on('SIGTERM', () => {
        flushNow();
        try {
          process.exit(143);
        } catch (_) {
          // ignore
        }
      });
      process.on('uncaughtException', (err: unknown) => {
        try {
          // biome-ignore lint/suspicious/noConsole: intentional fallback for logging during shutdown
          console.error('uncaughtException', err);
        } catch (_) {
          // ignore
        }
        flushNow();
        try {
          process.exit(1);
        } catch (_) {
          // ignore
        }
      });
      handlersInstalled = true;
    } catch (_) {
      // best-effort only
    }
  } catch (_) {
    // ignore errors in shutdown installer
  }
}

// Node-only installer for logger exit/flush handlers.
// This file must only be imported in Node.js server contexts.

interface LogEntry {
  msg: string;
  context?: unknown;
}

let handlersInstalled = false;

export function installExitFlushHandlers() {
  const proc = (globalThis as unknown as { process?: NodeJS.Process }).process;
  if (typeof proc === 'undefined') return;
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
      proc.on('beforeExit', flushNow);
      proc.on('exit', flushNow);
      proc.on('SIGINT', () => {
        flushNow();
        try {
          proc.exit(130);
        } catch (_) {
          // ignore
        }
      });
      proc.on('SIGTERM', () => {
        flushNow();
        try {
          proc.exit(143);
        } catch (_) {
          // ignore
        }
      });
      const handleFatalError = (eventName: string, error: unknown, exitCode: number) => {
        try {
          // biome-ignore lint/suspicious/noConsole: intentional fallback for logging during shutdown
          console.error(eventName, error);
        } catch (_) {
          // ignore
        }
        flushNow();
        try {
          proc.exit(exitCode);
        } catch (_) {
          // ignore
        }
      };

      proc.on('uncaughtException', (err: unknown) => {
        handleFatalError('uncaughtException', err, 1);
      });

      proc.on('unhandledRejection', (reason: unknown) => {
        handleFatalError('unhandledRejection', reason, 1);
      });
      handlersInstalled = true;
    } catch (_) {
      // best-effort only
    }
  } catch (_) {
    // ignore errors in shutdown installer
  }
}

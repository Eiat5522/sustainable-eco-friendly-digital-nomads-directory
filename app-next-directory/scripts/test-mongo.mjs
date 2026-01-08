import { MongoMemoryServer } from 'mongodb-memory-server';

async function loadStructuredLogger() {
  const candidates = ['../dist/lib/logger.js', '../src/lib/logger.js', '../src/lib/logger.ts'];
  for (const modulePath of candidates) {
    try {
      const mod = await import(modulePath);
      const logger = mod.structuredLogger ?? mod.default;
      if (logger) return logger;
    } catch {
      // try next candidate
    }
  }
  return {
    info: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.debug(...args),
  };
}

const structuredLogger = await loadStructuredLogger();

async function run() {
  structuredLogger.info('Starting MongoMemoryServer...');
  try {
    const requestedPort = process.env.TEST_MONGO_PORT
      ? Number.parseInt(process.env.TEST_MONGO_PORT, 10)
      : 0;
    const port = Number.isNaN(requestedPort) ? 0 : requestedPort;
    const binaryVersion = process.env.TEST_MONGODB_VERSION ?? '7.0.14'; // bump here when upgrading MongoDB binary

    const mongod = await MongoMemoryServer.create({
      instance: {
        port,
        dbName: 'e2e_test',
      },
      binary: {
        version: binaryVersion,
        downloadDir: './tmp/mongodb-binaries',
      },
    });
    const uri = mongod.getUri();
    const assignedPort = typeof mongod.getPort === 'function' ? mongod.getPort() : port;

    structuredLogger.info('MongoMemoryServer started', { uri, port: assignedPort });

    // Keep it running
    const shutdown = async () => {
      await mongod.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Wait forever
    await new Promise(() => {});
  } catch (err) {
    structuredLogger.error('Failed to start MongoMemoryServer', err);
    process.exit(1);
  }
}

run().catch(err => {
  structuredLogger.error('Unexpected error:', err);
  process.exit(1);
});

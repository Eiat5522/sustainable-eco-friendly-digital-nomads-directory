import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  console.log('Starting MongoDB Memory Server...');
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'e2e_test',
    },
  });

  const uri = mongod.getUri();
  console.log(`MongoDB Memory Server started at: ${uri}`);
  let isCleaningUp = false;
  const cleanup = () => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    mongod.stop().then(() => {
      process.exit(0);
    }).catch((err) => {
      console.error('Error stopping MongoDB:', err);
      process.exit(1);
    });
  };

  // Keep the process alive
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(err => {
  console.error('Failed to start MongoDB Memory Server:', err);
  process.exit(1);
});
main().catch(err => {
  console.error('Failed to start MongoDB Memory Server:', err);
  process.exit(1);
});

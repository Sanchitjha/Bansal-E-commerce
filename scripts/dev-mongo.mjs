// Starts a throw-away MongoDB (as a replica set, so transactions work) for local development and tests.
// Nothing is stored after you stop it. Usage:  npm run db:dev   then set MONGODB_URI to the printed address.
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const port = Number(process.env.DEV_MONGO_PORT || 27117);
const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: 'wiredTiger' },
  instanceOpts: [{ port }],
});

console.log(`MONGODB_URI=${replSet.getUri()}`);
console.log('In-memory MongoDB is running. Press Ctrl+C to stop.');

const stop = async () => {
  await replSet.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);

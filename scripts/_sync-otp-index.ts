import { config } from 'dotenv';
import mongoose from 'mongoose';
config({ path: '.env.local', override: true });
import { db } from '../src/lib/models';
(async () => {
  const m = await db();
  await m.OtpCode.createCollection().catch(() => {});
  await m.OtpCode.syncIndexes();
  const idx = await m.OtpCode.collection.indexes();
  console.log('host:', mongoose.connection.host);
  console.log('otpcodes indexes:', idx.map((i: any) => `${i.name}${i.expireAfterSeconds !== undefined ? ' (auto-delete)' : ''}`).join(', '));
  console.log('rows now:', await m.OtpCode.countDocuments());
  await mongoose.disconnect();
})();

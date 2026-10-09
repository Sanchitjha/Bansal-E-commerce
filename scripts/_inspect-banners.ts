import { config } from 'dotenv';
import mongoose from 'mongoose';
config({ path: '.env.local', override: true });
import { db } from '../src/lib/models';
(async () => {
  const m = await db();
  console.log('host:', mongoose.connection.host);
  const banners = await m.HeroBanner.find().sort({ priority: 1 }).lean();
  for (const b of banners) console.log(b._id, '|', b.title, '|', b.imageUrl.split('/').slice(-1)[0], '| active:', b.isActive, '| product:', b.productId, '| layout:', (b as any).layout);
  console.log('creator videos:', await m.CreatorVideo.countDocuments(), '| reviews:', await m.Review.countDocuments(), '| subscribers:', await m.Subscriber.countDocuments(), '| orders:', await m.Order.countDocuments());
  const logs = await m.ActivityLog.find({ action: /Banner/i }).lean();
  console.log('admin banner edits in activity log:', logs.length);
  await mongoose.disconnect();
})();

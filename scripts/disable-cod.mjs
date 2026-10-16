import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'luminary' });
  const db = mongoose.connection.db;
  await db.collection('sitesettings').updateOne(
    { _id: 'singleton' },
    { $set: { codEnabled: false } },
    { upsert: true }
  );
  const updated = await db.collection('sitesettings').findOne({ _id: 'singleton' });
  console.log('SiteSettings codEnabled is now:', updated.codEnabled);

  // Also clamp any existing cart sessions in MongoDB where LF-ATTAR-2ML or any 1 rupee item has quantity > 1
  const carts = await db.collection('cartsessions').find({}).toArray();
  let clampedCarts = 0;
  for (const cart of carts) {
    if (!Array.isArray(cart.items)) continue;
    let modified = false;
    const newItems = cart.items.map((it) => {
      if (it.productId === 'prod-attar-2ml' && it.quantity > 1) {
        modified = true;
        return { ...it, quantity: 1 };
      }
      return it;
    });
    if (modified) {
      await db.collection('cartsessions').updateOne(
        { _id: cart._id },
        { $set: { items: newItems } }
      );
      clampedCarts++;
    }
  }
  console.log(`Clamped ${clampedCarts} existing cart sessions with >1 quantity.`);

  await mongoose.disconnect();
}

run().catch(console.error);

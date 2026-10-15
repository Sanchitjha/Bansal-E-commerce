import { config } from 'dotenv';
config({ path: '.env.local' });
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { db } from '../src/lib/models';

async function main() {
  const m = await db();
  const email = 'luminaryfragrance@gmail.com';
  const password = 'Amit@7786';
  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert the new admin
  const res = await m.Admin.findOneAndUpdate(
    { email },
    { $set: { email, passwordHash, name: 'Amit (Admin)' } },
    { upsert: true, new: true }
  );
  console.log('Admin updated/created:', res.email);

  // List existing products
  const products = await m.Product.find({}).select('id name sku status sellingPrice images');
  console.log(`Total products in MongoDB: ${products.length}`);
  products.forEach((p) => {
    console.log(`- [${p.sku}] ${p.name} (status: ${p.status}, price: ₹${p.sellingPrice}, images: ${p.images?.length})`);
  });
}

main()
  .catch(console.error)
  .finally(() => mongoose.disconnect());

import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import { db } from '../src/lib/models';

const targetDir = path.join('public', 'products', 'whatsapp');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Move WhatsApp images from root to public/products/whatsapp
const rootFiles = fs.readdirSync('.').filter((f) => f.startsWith('WhatsApp Image') || f.startsWith('WhatsApp Video'));
console.log(`Moving ${rootFiles.length} WhatsApp media files from root to public/products/whatsapp/ ...`);

for (const file of rootFiles) {
  const src = path.join('.', file);
  const dest = path.join(targetDir, file);
  fs.copyFileSync(src, dest);
  fs.unlinkSync(src);
}
console.log('Finished moving media files. Root folder is now clean!');

// 2. Add individual products from gift sets into MongoDB
async function addIndividualProducts() {
  const m = await db();

  const newProducts = [
    {
      _id: 'prod-royal-20ml',
      name: 'Luminary Royal Eau de Parfum (20 ml Travel Edition)',
      sku: 'LF-ROYAL-20ML',
      category: 'fragrance',
      subcategory: 'Perfumes',
      brand: 'Luminary Fragrance',
      shortDescription: 'Royal woody oudh & warm amber notes in an exquisite 20 ml travel spray bottle.',
      longDescription: 'Luminary Royal is a sophisticated Eau de Parfum with rich woody oudh, precious amber, and subtle spice notes. Perfect travel size 20 ml luxury spray bottle with gold cap.',
      images: [
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.36.55 PM (1).jpeg',
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.42.39 PM (1).jpeg'
      ],
      mrp: 999,
      sellingPrice: 499,
      costPrice: 150,
      discountPercent: 50,
      gstRate: 18,
      hsnCode: '33030010',
      stock: 120,
      lowStockThreshold: 10,
      weightKg: 0.15,
      status: 'active',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
      isHomepagePriority: true,
      priorityOrder: 3,
      isBulkAvailable: true,
      bulkSlabs: [
        { minQty: 1, pricePerUnit: 499 },
        { minQty: 5, pricePerUnit: 449 },
        { minQty: 10, pricePerUnit: 399 }
      ],
      rating: 4.9,
      reviewsCount: 88,
      seoTitle: 'Luminary Royal Eau de Parfum 20 ml',
      metaDescription: 'Buy Luminary Royal 20 ml luxury travel perfume with royal woody oudh and amber notes.',
      urlSlug: 'luminary-royal-eau-de-parfum-20ml',
      keywords: ['luminary royal', '20ml perfume', 'travel perfume', 'luxury perfume']
    },
    {
      _id: 'prod-velvet-20ml',
      name: 'Luminary Velvet Eau de Parfum (20 ml Travel Edition)',
      sku: 'LF-VELVET-20ML',
      category: 'fragrance',
      subcategory: 'Perfumes',
      brand: 'Luminary Fragrance',
      shortDescription: 'Velvet rose, fresh floral bouquet and sweet vanilla in a vibrant 20 ml bottle.',
      longDescription: 'Luminary Velvet captures the essence of freshly bloomed velvety roses kissed by morning dew and Madagascar vanilla. Compact 20 ml pocket-friendly luxury perfume.',
      images: [
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.36.55 PM (1).jpeg',
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.42.39 PM (1).jpeg'
      ],
      mrp: 999,
      sellingPrice: 499,
      costPrice: 150,
      discountPercent: 50,
      gstRate: 18,
      hsnCode: '33030010',
      stock: 120,
      lowStockThreshold: 10,
      weightKg: 0.15,
      status: 'active',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
      isHomepagePriority: true,
      priorityOrder: 4,
      isBulkAvailable: true,
      bulkSlabs: [
        { minQty: 1, pricePerUnit: 499 },
        { minQty: 5, pricePerUnit: 449 },
        { minQty: 10, pricePerUnit: 399 }
      ],
      rating: 4.8,
      reviewsCount: 76,
      seoTitle: 'Luminary Velvet Eau de Parfum 20 ml',
      metaDescription: 'Buy Luminary Velvet 20 ml travel spray perfume with velvet rose and sweet vanilla notes.',
      urlSlug: 'luminary-velvet-eau-de-parfum-20ml',
      keywords: ['luminary velvet', 'rose perfume', '20ml perfume']
    },
    {
      _id: 'prod-dream-heaven-20ml',
      name: 'Luminary Dream Heaven Eau de Parfum (20 ml)',
      sku: 'LF-DREAM-20ML',
      category: 'fragrance',
      subcategory: 'Perfumes',
      brand: 'Luminary Fragrance',
      shortDescription: 'Warm amber and bourbon vanilla notes in an amber glass spray bottle.',
      longDescription: 'Dream Heaven is an enchanting Eau de Parfum featuring warm amber, rich bourbon vanilla, and golden orchid. Formulated for 14+ hours of projection.',
      images: [
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.36.54 PM.jpeg'
      ],
      mrp: 999,
      sellingPrice: 499,
      costPrice: 150,
      discountPercent: 50,
      gstRate: 18,
      hsnCode: '33030010',
      stock: 100,
      lowStockThreshold: 10,
      weightKg: 0.15,
      status: 'active',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isHomepagePriority: false,
      priorityOrder: 5,
      isBulkAvailable: true,
      bulkSlabs: [
        { minQty: 1, pricePerUnit: 499 },
        { minQty: 5, pricePerUnit: 449 }
      ],
      rating: 4.9,
      reviewsCount: 64,
      seoTitle: 'Luminary Dream Heaven Eau de Parfum 20 ml',
      metaDescription: 'Buy Luminary Dream Heaven 20 ml EDP with warm amber and vanilla notes.',
      urlSlug: 'luminary-dream-heaven-eau-de-parfum-20ml',
      keywords: ['dream heaven', 'vanilla perfume', 'amber perfume']
    },
    {
      _id: 'prod-forest-bliss-attar',
      name: 'Luminary Forest Bliss Royal Crown Attar (12 ml)',
      sku: 'LF-FOREST-12ML',
      category: 'fragrance',
      subcategory: 'Attars',
      brand: 'Luminary Fragrance',
      shortDescription: 'Creamy Mysore sandalwood and Himalayan cedarwood in a royal gold crown bottle.',
      longDescription: 'Forest Bliss is 100% pure alcohol-free concentrated perfume oil (Ittar) with creamy Mysore sandalwood, cedarwood, and earthy moss notes. Handcrafted in a heavy gold-embossed crown bottle.',
      images: [
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.36.54 PM.jpeg',
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.36.55 PM (1).jpeg'
      ],
      mrp: 1299,
      sellingPrice: 699,
      costPrice: 200,
      discountPercent: 46,
      gstRate: 18,
      hsnCode: '33030020',
      stock: 150,
      lowStockThreshold: 10,
      weightKg: 0.18,
      status: 'active',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isHomepagePriority: true,
      priorityOrder: 6,
      isBulkAvailable: true,
      bulkSlabs: [
        { minQty: 1, pricePerUnit: 699 },
        { minQty: 5, pricePerUnit: 629 },
        { minQty: 10, pricePerUnit: 559 }
      ],
      rating: 5.0,
      reviewsCount: 112,
      seoTitle: 'Luminary Forest Bliss Royal Crown Attar 12 ml',
      metaDescription: 'Buy Forest Bliss 12 ml royal crown attar with pure sandalwood and cedarwood notes.',
      urlSlug: 'luminary-forest-bliss-royal-crown-attar-12ml',
      keywords: ['sandalwood attar', 'crown attar', 'forest bliss']
    },
    {
      _id: 'prod-ivory-dreamily-attar',
      name: 'Luminary Ivory Dreamily Pure Rose Attar (12 ml)',
      sku: 'LF-IVORY-12ML',
      category: 'fragrance',
      subcategory: 'Attars',
      brand: 'Luminary Fragrance',
      shortDescription: 'Distilled Indian Damask red rose petals in a heavy gold filigree crown bottle.',
      longDescription: 'Ivory Dreamily is crafted by steam distilling thousands of fresh Damask rose petals into pure non-alcoholic attar. Divine spiritual rose fragrance ideal for daily wear and festive occasions.',
      images: [
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.36.54 PM.jpeg',
        '/products/whatsapp/WhatsApp Image 2026-09-29 at 7.36.55 PM (1).jpeg'
      ],
      mrp: 1299,
      sellingPrice: 699,
      costPrice: 200,
      discountPercent: 46,
      gstRate: 18,
      hsnCode: '33030020',
      stock: 150,
      lowStockThreshold: 10,
      weightKg: 0.18,
      status: 'active',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isHomepagePriority: true,
      priorityOrder: 7,
      isBulkAvailable: true,
      bulkSlabs: [
        { minQty: 1, pricePerUnit: 699 },
        { minQty: 5, pricePerUnit: 629 },
        { minQty: 10, pricePerUnit: 559 }
      ],
      rating: 4.9,
      reviewsCount: 95,
      seoTitle: 'Luminary Ivory Dreamily Pure Rose Attar 12 ml',
      metaDescription: 'Buy Luminary Ivory Dreamily 12 ml pure rose crown attar non-alcoholic.',
      urlSlug: 'luminary-ivory-dreamily-pure-rose-attar-12ml',
      keywords: ['rose attar', 'pure gulab attar', 'crown attar']
    }
  ];

  for (const p of newProducts) {
    const res = await m.Product.updateOne(
      { _id: p._id },
      { $set: p },
      { upsert: true }
    );
    console.log(`Product [${p.sku}] ${p.name}: ${res.upsertedCount ? 'Added' : 'Updated'}`);
  }

  const total = await m.Product.countDocuments({ status: 'active' });
  console.log(`Total active products now in store: ${total}`);
}

addIndividualProducts()
  .catch(console.error)
  .finally(() => mongoose.disconnect());

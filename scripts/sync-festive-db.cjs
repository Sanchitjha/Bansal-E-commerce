const { config } = require('dotenv');
config({ path: '.env.local' });
const mongoose = require('mongoose');

const banners = [
  {
    _id: 'hero-navratri-offer',
    title: 'Navratri Special Offer: Buy Attar @ ₹1 Only',
    subtitle: 'This Navratri, bring home the divine fragrance of prosperity. Buy 2 ml Attar worth ₹249 at Just ₹1 ONLY.',
    badge: 'NAVRATRI SPECIAL • LIMITED TIME',
    discountTag: 'ATTAR @ ₹1 ONLY',
    buttonText: 'GRAB FESTIVE DEAL',
    destinationUrl: '/#festive-edit',
    imageUrl: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791713912/luminary/banners/navratri-special-offer-attar.jpg',
    priority: 1,
    isActive: true,
    layout: 'full',
    showText: false,
    productId: null
  },
  {
    _id: 'hero-navratri-blessing',
    title: 'Blessed & Fragrant Navratri',
    subtitle: 'May the divine blessings of Maa Durga fill your life with joy, prosperity, and the sweet fragrance of success.',
    badge: 'FESTIVE GREETINGS',
    discountTag: 'FESTIVE SALE LIVE',
    buttonText: 'SHOP FESTIVE EDIT',
    destinationUrl: '/#festive-edit',
    imageUrl: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791713913/luminary/banners/navratri-blessings-greeting.jpg',
    priority: 2,
    isActive: true,
    layout: 'full',
    showText: false,
    productId: null
  },
  {
    _id: 'hero-1',
    title: 'Luxury Gift Sets, Boxed to Impress',
    subtitle: 'Two perfume sprays and two crown-cap attars in one signature box. Choose navy, purple or brown.',
    badge: 'LUMINARY GIFT SETS',
    discountTag: 'UP TO 34% OFF',
    buttonText: 'SHOP GIFT SETS',
    destinationUrl: '/collections/gift-sets',
    imageUrl: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791555868/luminary/products/banner-gift-sets-wide.jpg',
    priority: 3,
    isActive: true,
    layout: 'full',
    showText: true,
    productId: null
  },
  {
    _id: 'hero-2',
    title: 'Fragrance Land Eau de Parfum',
    subtitle: 'Spicy rose, woody and fresh citrus in a 100 ml gold-capped bottle.',
    badge: 'EAU DE PARFUM',
    discountTag: '40% OFF',
    buttonText: 'SHOP EAU DE PARFUM',
    destinationUrl: '/collections/perfumes',
    imageUrl: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791554365/luminary/products/banner-fragrance-land.jpg',
    priority: 4,
    isActive: true,
    layout: 'full',
    showText: true,
    productId: null
  },
  {
    _id: 'hero-3',
    title: 'Premium Safed Musli',
    subtitle: '100% pure and natural whole-root Chlorophytum borivilianum, 50 g pack.',
    badge: 'AYURVEDIC CARE',
    discountTag: '20% OFF',
    buttonText: 'SHOP AYURVEDIC CARE',
    destinationUrl: '/collections/ayurvedic-care',
    imageUrl: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791631057/luminary/products/banner-safed-musli-clear.jpg',
    priority: 5,
    isActive: true,
    layout: 'full',
    showText: true,
    productId: null
  },
  {
    _id: 'hero-4',
    title: 'Smart Ultrasonic Aroma Diffuser',
    subtitle: 'App-controlled cold-mist diffuser with ambient LED lighting.',
    badge: 'MINI GADGETS & LIFESTYLE',
    discountTag: 'NEW ARRIVAL',
    buttonText: 'SHOP MINI GADGETS',
    destinationUrl: '/collections/mini-gadgets',
    imageUrl: 'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791555872/luminary/products/banner-diffuser-clear.jpg',
    priority: 6,
    isActive: true,
    layout: 'full',
    showText: true,
    productId: null
  }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'luminary' });
  const col = mongoose.connection.db.collection('herobanners');

  for (const b of banners) {
    await col.updateOne({ _id: b._id }, { $set: b }, { upsert: true });
  }
  console.log('Hero banners synced to MongoDB');

  // Update prod-15 image
  await mongoose.connection.db.collection('products').updateOne(
    { _id: 'prod-15' },
    {
      $set: {
        images: [
          'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791713915/luminary/products/one-life-purple-box-luxury.jpg',
          'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791381628/luminary/products/one-life-60ml-1.jpg',
          'https://res.cloudinary.com/wu9kqgfs/image/upload/v1791381630/luminary/products/one-life-60ml-2.jpg',
        ]
      }
    }
  );
  console.log('Product prod-15 updated with purple box image in MongoDB');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

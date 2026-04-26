#!/usr/bin/env node
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User      = require('../backend/models/User');
const Product   = require('../backend/models/Product');
const { Order } = require('../backend/models/Order');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand    = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));

function randomDate(daysAgoMin, daysAgoMax) {
  const d = new Date();
  d.setDate(d.getDate() - randInt(daysAgoMin, daysAgoMax));
  d.setHours(randInt(8, 22), randInt(0, 59), randInt(0, 59), 0);
  return d;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Data pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Alibek',   'Jasur',    'Dilnoza',  'Sarvar',   'Malika',
  'Otabek',   'Nilufar',  'Bobur',    'Zulfiya',  'Eldor',
  'Kamola',   'Sherzod',  'Mohira',   'Ulugbek',  'Feruza',
  'Nodir',    'Barno',    'Sanjar',   'Gulnora',  'Timur',
  'Shahnoza', 'Mansur',   'Diyora',   'Behruz',   'Maftuna',
  'Azizbek',  'Hulkar',   'Firdavs',  'Nargiza',  'Mirzo',
  'Lobar',    'Davron',   'Ozoda',    'Umid',     'Sitora',
  'Ibrohim',  'Muazzam',  'Ruslan',   'Nafisa',   'Saidakbar',
];

const LAST_NAMES = [
  'Karimov',   'Toshmatov', 'Yusupov',    'Nazarov',  'Mirzayev',
  'Xoliqov',   'Ismoilov',  'Rahimov',    'Abdullayev','Ergashev',
  'Sobirov',   'Hamidov',   'Qodirov',    'Umarov',   'Valiyev',
  'Normatov',  'Yunusov',   'Jalolov',    'Tursunov', 'Xasanov',
];

const PHONE_PREFIXES = ['90', '91', '93', '94', '95', '97', '98', '99', '33', '55'];

const NOTES_POOL = [
  'Please call before delivery.',
  'Leave at the door if no answer.',
  'Gift wrapping please.',
  'Fragile — handle with care.',
  null, null, null, null, null, // most orders have no notes
];

// ─── Seed products ────────────────────────────────────────────────────────────

const SEED_PRODUCT_NAMES = [
  'Bleu de Chanel EDP', 'Sauvage EDT', 'La Vie Est Belle', 'Black Opium EDP',
  'Oud Wood', 'Acqua di Giò', 'Chance Eau Tendre',
  'Hyaluronic Serum 2%', 'Vitamin C Brightening Cream', 'Velvet Matte Lipstick',
];

const SEED_PRODUCTS = [
  {
    name: 'Bleu de Chanel EDP', brand: 'Chanel', price: 185, stock: 50,
    type: 'perfume', category: 'men',
    perfumeProfile: { woody: 8, fresh: 6, citrus: 5 },
  },
  {
    name: 'Sauvage EDT', brand: 'Dior', price: 145, stock: 60,
    type: 'perfume', category: 'men',
    perfumeProfile: { fresh: 9, woody: 6, spicy: 4 },
  },
  {
    name: 'La Vie Est Belle', brand: 'Lancôme', price: 130, stock: 45,
    type: 'perfume', category: 'women',
    perfumeProfile: { floral: 9, sweet: 7, powdery: 5 },
  },
  {
    name: 'Black Opium EDP', brand: 'YSL', price: 155, stock: 40,
    type: 'perfume', category: 'women',
    perfumeProfile: { sweet: 8, oriental: 7, spicy: 5 },
  },
  {
    name: 'Oud Wood', brand: 'Tom Ford', price: 220, stock: 30,
    type: 'perfume', category: 'unisex',
    perfumeProfile: { woody: 10, oriental: 8, spicy: 6 },
  },
  {
    name: 'Acqua di Giò', brand: 'Giorgio Armani', price: 110, stock: 55,
    type: 'perfume', category: 'men',
    perfumeProfile: { fresh: 9, citrus: 8, woody: 4 },
  },
  {
    name: 'Chance Eau Tendre', brand: 'Chanel', price: 160, stock: 35,
    type: 'perfume', category: 'women',
    perfumeProfile: { floral: 8, citrus: 7, fresh: 6 },
  },
  {
    name: 'Hyaluronic Serum 2%', brand: 'The Ordinary', price: 22, stock: 120,
    type: 'skincare', category: 'unisex',
    skincareProfile: { skinTypes: ['dry', 'normal'], ingredients: ['hyaluronic acid'] },
  },
  {
    name: 'Vitamin C Brightening Cream', brand: 'CeraVe', price: 38, stock: 80,
    type: 'skincare', category: 'women',
    skincareProfile: { skinTypes: ['combination', 'normal'], ingredients: ['vitamin C', 'niacinamide'] },
  },
  {
    name: 'Velvet Matte Lipstick', brand: 'MAC', price: 28, stock: 90,
    type: 'cosmetics', category: 'women',
    cosmeticsProfile: { colors: ['red', 'nude', 'pink'] },
  },
];

// ─── City coordinate bounds (Uzbekistan) ─────────────────────────────────────

const CITY_BOUNDS = {
  Tashkent:  { lat: [41.25, 41.37], lng: [69.18, 69.35] },
  Samarkand: { lat: [39.60, 39.68], lng: [66.91, 67.02] },
};

function coordsFor(city) {
  const b = CITY_BOUNDS[city];
  return {
    lat: parseFloat(rand(b.lat[0], b.lat[1]).toFixed(5)),
    lng: parseFloat(rand(b.lng[0], b.lng[1]).toFixed(5)),
  };
}

// ─── Status distribution: 50 orders, skewed toward COMPLETED ─────────────────

const STATUS_POOL = shuffle([
  ...Array(22).fill('COMPLETED'),
  ...Array(10).fill('CONFIRMED'),
  ...Array(8).fill('PAID'),
  ...Array(6).fill('PENDING'),
  ...Array(4).fill('CANCELLED'),
]);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const shouldClear = process.argv.includes('--clear');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // ── Optional: wipe previous seed run ───────────────────────────────────────
  if (shouldClear) {
    const seededUsers = await User.find({ email: /@seeded\.parfum$/ }, '_id');
    const seededIds   = seededUsers.map(u => u._id);
    const [orderDel, userDel, prodDel] = await Promise.all([
      Order.deleteMany({ user: { $in: seededIds } }),
      User.deleteMany({ _id: { $in: seededIds } }),
      Product.deleteMany({ name: { $in: SEED_PRODUCT_NAMES } }),
    ]);
    console.log(
      `Cleared: ${userDel.deletedCount} users, ` +
      `${orderDel.deletedCount} orders, ` +
      `${prodDel.deletedCount} products.`
    );
  }

  // ── 1. Upsert seed products ───────────────────────────────────────────────
  const existingProducts = await Product.find({ name: { $in: SEED_PRODUCT_NAMES } }, 'name');
  const existingSet      = new Set(existingProducts.map(p => p.name));
  const toInsert         = SEED_PRODUCTS.filter(p => !existingSet.has(p.name));

  if (toInsert.length > 0) {
    await Product.insertMany(toInsert);
  }

  const products = await Product.find({ name: { $in: SEED_PRODUCT_NAMES } }).lean();
  console.log(`Products ready: ${products.length}`);

  // ── 2. Build 50 users ─────────────────────────────────────────────────────
  const passwordHash = bcrypt.hashSync('Test1234!', 10);
  const usedPhones   = new Set();
  const userDocs     = [];

  for (let i = 0; i < 50; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName  = pick(LAST_NAMES);

    // Unique Uzbekistan phone number
    let phone;
    do {
      const prefix = pick(PHONE_PREFIXES);
      const digits = String(randInt(1000000, 9999999)).padStart(7, '0');
      phone = `+998${prefix}${digits}`;
    } while (usedPhones.has(phone));
    usedPhones.add(phone);

    // Unique email — tagged with @seeded.parfum so --clear can find them
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@seeded.parfum`;

    const isVerified = Math.random() < 0.82; // ~80% verified
    const createdAt  = randomDate(30, 60);

    userDocs.push({
      _id: new mongoose.Types.ObjectId(),
      name: `${firstName} ${lastName}`,
      email,
      password: passwordHash,
      phone,
      role:       'user',
      isActive:   true,
      isVerified,
      createdAt,
      updatedAt:  createdAt,
    });
  }

  // collection.insertMany bypasses Mongoose middleware so we can set createdAt freely
  await User.collection.insertMany(userDocs);
  console.log(`Users created: ${userDocs.length}`);

  // ── 3. Build 50 orders ────────────────────────────────────────────────────
  const orderDocs = [];

  for (let i = 0; i < 50; i++) {
    const user = pick(userDocs);
    const city = Math.random() < 0.72 ? 'Tashkent' : 'Samarkand';

    // 1–3 distinct products per order
    const itemCount = randInt(1, 3);
    const chosen    = shuffle(products).slice(0, itemCount);

    let totalPrice = 0;
    const items = chosen.map(p => {
      const quantity = randInt(1, 3);
      totalPrice    += p.price * quantity;
      return { product: p._id, quantity };
    });
    totalPrice = parseFloat(totalPrice.toFixed(2));

    // First 20 orders are older (31–60 days ago); last 30 are recent (1–30 days ago)
    // This creates a visible upward trend in analytics
    const createdAt = i < 20 ? randomDate(31, 60) : randomDate(1, 30);
    const note      = pick(NOTES_POOL);

    const doc = {
      user:         user._id,
      customerName: user.name,
      phone:        user.phone,
      city,
      location:     coordsFor(city),
      items,
      totalPrice,
      status:       STATUS_POOL[i],
      createdAt,
      updatedAt:    createdAt,
    };
    if (note) doc.notes = note;

    orderDocs.push(doc);
  }

  await Order.collection.insertMany(orderDocs);
  console.log(`Orders created: ${orderDocs.length}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const verifiedCount = userDocs.filter(u => u.isVerified).length;
  const statusCounts  = orderDocs.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const recentCount = orderDocs.filter(o => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return o.createdAt >= cutoff;
  }).length;

  console.log('\n── Seed complete ─────────────────────────────────────────────');
  console.log(`  Users   : 50  (${verifiedCount} verified, ${50 - verifiedCount} unverified)`);
  console.log(`  Password: Test1234!  (all seed users)`);
  console.log(`  Orders  : 50`);
  Object.entries(statusCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([status, count]) => {
      console.log(`    ${status.padEnd(12)} ${String(count).padStart(2)}  ${'█'.repeat(count)}`);
    });
  console.log(`  Recent orders (last 30d) : ${recentCount}`);
  console.log(`  Older  orders (31–60d)   : ${50 - recentCount}`);
  console.log('──────────────────────────────────────────────────────────────');

  await mongoose.disconnect();
  console.log('Disconnected. Done.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});

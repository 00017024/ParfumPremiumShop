const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./backend/models/Product');

dotenv.config();

const sampleProducts = [
  {
    name: "Sauvage Eau de Toilette",
    brand: "Dior",
    price: 89.99,
    description: "A radically fresh composition, Sauvage is both raw and noble.",
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop",
    categories: ["Men", "Eau de Toilette"],
    newArrival: true,
    popularity: 95
  },
  {
    name: "Chanel No. 5 Eau de Parfum",
    brand: "Chanel",
    price: 135.00,
    description: "The quintessence of femininity in a timeless, iconic fragrance.",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&h=600&fit=crop",
    categories: ["Women", "Eau de Parfum"],
    newArrival: false,
    popularity: 100
  },
  {
    name: "Bleu de Chanel Parfum",
    brand: "Chanel",
    price: 152.00,
    description: "An aromatic woody fragrance that reveals the spirit of a man who refuses to be defined.",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&h=600&fit=crop",
    categories: ["Men", "Parfum"],
    newArrival: false,
    popularity: 88
  },
  {
    name: "La Vie Est Belle",
    brand: "Lancôme",
    price: 98.00,
    description: "A unique olfactory signature scented with a balanced accord of iris, patchouli, and gourmand.",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59bd9?w=600&h=600&fit=crop",
    categories: ["Women", "Eau de Parfum"],
    newArrival: true,
    popularity: 92
  },
  {
    name: "Acqua di Giò Profumo",
    brand: "Giorgio Armani",
    price: 112.00,
    description: "An aquatic, aromatic fragrance opening with fresh calabrian bergamot and marine notes.",
    stock: 28,
    imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop",
    categories: ["Men", "Eau de Parfum"],
    newArrival: false,
    popularity: 85
  },
  {
    name: "Black Opium",
    brand: "Yves Saint Laurent",
    price: 108.00,
    description: "A seductive gourmand floral fragrance with coffee, vanilla, and white flowers.",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=600&h=600&fit=crop",
    categories: ["Women", "Eau de Parfum"],
    newArrival: true,
    popularity: 90
  },
  {
    name: "1 Million",
    brand: "Paco Rabanne",
    price: 79.99,
    description: "An explosion of fresh mint and blood mandarin contrast with the sensuality of rose absolute.",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600&h=600&fit=crop",
    categories: ["Men", "Eau de Toilette"],
    newArrival: false,
    popularity: 87
  },
  {
    name: "Flowerbomb",
    brand: "Viktor & Rolf",
    price: 145.00,
    description: "An explosion of flowers with notes of sambac jasmine, centifolia rose, and patchouli.",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600&h=600&fit=crop",
    categories: ["Women", "Eau de Parfum"],
    newArrival: false,
    popularity: 93
  },
  {
    name: "The One Eau de Parfum",
    brand: "Dolce & Gabbana",
    price: 94.00,
    description: "A modern, sensual fragrance with notes of peach, jasmine, and vanilla.",
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=600&h=600&fit=crop",
    categories: ["Women", "Eau de Parfum"],
    newArrival: false,
    popularity: 82
  },
  {
    name: "Invictus",
    brand: "Paco Rabanne",
    price: 84.99,
    description: "A powerful stimulating fragrance of grapefruit and guaiac wood.",
    stock: 32,
    imageUrl: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=600&h=600&fit=crop",
    categories: ["Men", "Eau de Toilette"],
    newArrival: false,
    popularity: 86
  },
  {
    name: "Coco Mademoiselle",
    brand: "Chanel",
    price: 138.00,
    description: "An oriental fragrance with a fresh, modern twist on a classic.",
    stock: 19,
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop",
    categories: ["Women", "Eau de Parfum"],
    newArrival: false,
    popularity: 96
  },
  {
    name: "Eros Eau de Parfum",
    brand: "Versace",
    price: 95.00,
    description: "A fragrance that interprets the sublime masculine through a luminous aura.",
    stock: 27,
    imageUrl: "https://images.unsplash.com/photo-1584990347449-1082b2e5c65d?w=600&h=600&fit=crop",
    categories: ["Men", "Eau de Parfum"],
    newArrival: true,
    popularity: 89
  },
  {
    name: "Good Girl",
    brand: "Carolina Herrera",
    price: 125.00,
    description: "An oriental floral fragrance with notes of almond, tuberose, and tonka bean.",
    stock: 16,
    imageUrl: "https://images.unsplash.com/photo-1595425970470-1fa6e4f2bc8d?w=600&h=600&fit=crop",
    categories: ["Women", "Eau de Parfum"],
    newArrival: true,
    popularity: 91
  },
  {
    name: "Le Male",
    brand: "Jean Paul Gaultier",
    price: 76.00,
    description: "A powerful yet refined fragrance with lavender, mint, and vanilla.",
    stock: 29,
    imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop",
    categories: ["Men", "Eau de Toilette"],
    newArrival: false,
    popularity: 84
  },
  {
    name: "Si Passione",
    brand: "Giorgio Armani",
    price: 102.00,
    description: "An intense and feminine fragrance with notes of pear, blackcurrant nectar, and vanilla.",
    stock: 21,
    imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59bd9?w=600&h=600&fit=crop",
    categories: ["Women", "Eau de Parfum"],
    newArrival: false,
    popularity: 83
  },
  {
    name: "Dylan Blue",
    brand: "Versace",
    price: 82.00,
    description: "A strong masculine fragrance with Mediterranean freshness.",
    stock: 0, // Out of stock example
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&h=600&fit=crop",
    categories: ["Men", "Eau de Toilette"],
    newArrival: false,
    popularity: 81
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log(`✅ Successfully seeded ${sampleProducts.length} products`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
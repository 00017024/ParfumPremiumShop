const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/User');
const Product = require('./backend/models/Product');
const Cart = require('./backend/models/Cart');
const Order = require('./backend/models/Order');
require('dotenv').config();

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Clean up old data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    console.log('✅ Old data cleared');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      phone: '+998900000000',
      password: adminPassword,
      role: 'admin'
    });

    // Create normal user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      name: 'John Doe',
      email: 'user@example.com',
      phone: '+998911111111',
      password: userPassword,
      role: 'user'
    });

    console.log('✅ Users created');

    // Create products
    const products = await Product.insertMany([
      {
        name: 'Ocean Breeze',
        brand: 'FreshScents',
        price: 50,
        description: 'Refreshing aquatic fragrance',
        popularity: 10,
        newArrival: true,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        name: 'Rose Bloom',
        brand: 'FloraPerfume',
        price: 80,
        description: 'Elegant rose with vanilla notes',
        popularity: 25,
        imageUrl: 'https://via.placeholder.com/150'
      },
      {
        name: 'Amber Night',
        brand: 'LuxuryScent',
        price: 120,
        description: 'Warm amber and musk fragrance',
        popularity: 5,
        imageUrl: 'https://via.placeholder.com/150'
      }
    ]);

    console.log('✅ Products created');

    // Add items to user’s cart
    await Cart.create({
      user: user._id,
      items: [
        { product: products[0]._id, quantity: 2 }, // 2 x Ocean Breeze
        { product: products[1]._id, quantity: 1 }  // 1 x Rose Bloom
      ]
    });

    console.log('✅ Cart created for user');

    console.log(`
    🎉 Seeder finished successfully!
    
    Admin login: admin@example.com / admin123
    User login: user@example.com / user123
    `);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();

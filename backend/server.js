const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/authRoute');
const authMiddleware = require('./middleware/authMiddleware');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
dotenv.config();
connectDB();

// Routes
app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: `Welcome user ${req.user.id}` });
});

app.get('/', (req, res) => {
  res.send('Parfum Premium API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

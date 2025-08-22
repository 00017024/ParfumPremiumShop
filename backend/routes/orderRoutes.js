const express = require('express');
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus
} = require('../controllers/orderController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Create new order
router.post('/', authMiddleware, createOrder);

// Get logged-in user's orders
router.get('/my-orders', authMiddleware, getMyOrders);

// Admin only: get all orders
router.get('/', authMiddleware, adminMiddleware, getAllOrders);

// Admin only: update order status
router.put('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);

module.exports = router;

const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Create new order from cart
exports.createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const order = new Order({
      user: req.user.id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      })),
      totalPrice
    });

    await order.save();

    // Clear cart after order
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name price brand');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name price brand');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const { status } = req.body;
    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

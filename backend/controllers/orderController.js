const Order = require('../models/Order');
const { ORDER_STATUS } = require('../models/Order');
const ApiError = require("../utils/ApiError");
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
      totalPrice,
      status: ORDER_STATUS.PENDING
    });

    await order.save();

    // Clear cart after order
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};


// Get all orders (admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name price brand');
    res.json(orders);
   } catch (err) {
    next(err);
  }
};

// Get user orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name price brand');
    res.json(orders);
   } catch (err) {
    next(err);
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status: nextStatus } = req.body;

    if (!Object.values(ORDER_STATUS).includes(nextStatus)) {
      throw new ApiError(
        400,
        "Invalid order status",
        "ORDER_STATUS_INVALID"
      );

    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    // Prevent no-op or double actions
    if (order.status === nextStatus) {
      throw new ApiError(
        400,
        `Order is already in ${nextStatus} status`,
        "ORDER_STATUS_NOOP"
      );

    }

    // Role-based enforcement
    if (
      [ORDER_STATUS.CONFIRMED, ORDER_STATUS.COMPLETED].includes(nextStatus) &&
      !req.user.isAdmin
    ) {
      throw new ApiError(
        403,
        "Only admin can perform this action",
        "ORDER_ADMIN_ONLY"
      );

    }

    // User can only cancel before confirmation
    if (
      nextStatus === ORDER_STATUS.CANCELLED &&
      !req.user.isAdmin &&
      ![ORDER_STATUS.PENDING, ORDER_STATUS.PAID].includes(order.status)
    ) {
      throw new ApiError(
        403,
        "Order can no longer be cancelled",
        "ORDER_CANNOT_CANCEL"
      );
    }

    // Lifecycle enforcement (MODEL LEVEL)
    if (!order.canTransitionTo(nextStatus)) {
      throw new ApiError(
        400,
        `Invalid transition from ${order.status} to ${nextStatus}`,
        "ORDER_INVALID_TRANSITION"
      );
    }

    order.status = nextStatus;
    await order.save();

    res.json(order);
  } catch (err) {
  next(err);
}
};


const { Order, ORDER_STATUS } = require('../models/Order');
const ApiError = require('../utils/ApiError');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Shared populate string — ensures imageUrl is always included for frontend
const PRODUCT_FIELDS = 'name price brand imageUrl';

// ─── Create Order ─────────────────────────────────────────────────────────────
// POST /orders
// Loads cart, validates stock, creates order, decrements stock atomically,
// clears cart, and returns the populated order.

exports.createOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Cart is empty', 'CART_EMPTY');
    }

    // Validate stock availability before touching anything
    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
      }

      if (item.quantity > product.stock) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.name}`,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    // Calculate total from cart items
    const totalPrice = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Build order document
    const order = new Order({
      user: req.user._id,
      customerName: req.body.customerName,
      phone: req.body.phone,
      city: req.body.city,
      address: req.body.address,
      notes: req.body.notes,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      totalPrice,
      status: ORDER_STATUS.PENDING,
    });

    await order.save();

    // Atomically decrement stock — roll back if any item fails
    for (const item of cart.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        await Order.findByIdAndDelete(order._id);
        return next(
          new ApiError(
            400,
            `Insufficient stock for ${item.product.name}`,
            'INSUFFICIENT_STOCK'
          )
        );
      }
    }

    // Clear cart after successful order creation
    cart.items = [];
    await cart.save();

    // Populate product fields for response
    await order.populate('items.product', PRODUCT_FIELDS);

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// ─── Get My Orders ────────────────────────────────────────────────────────────
// GET /orders/my
// Returns all orders for the authenticated user, newest first.

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', PRODUCT_FIELDS)
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ─── Get Order By ID ──────────────────────────────────────────────────────────
// GET /orders/:id
// Returns a single order. User must own the order or be an admin.

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', PRODUCT_FIELDS);

    if (!order) {
      throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'Access denied', 'ORDER_ACCESS_DENIED');
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// ─── Get All Orders ───────────────────────────────────────────────────────────
// GET /orders
// Admin only. Returns all orders with user and product details.

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', PRODUCT_FIELDS)
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ─── Update Order Status ──────────────────────────────────────────────────────
// PATCH /orders/:id
// Validates the transition, enforces role-based rules, and saves updated status.

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status: nextStatus } = req.body;

    if (!Object.values(ORDER_STATUS).includes(nextStatus)) {
      throw new ApiError(400, 'Invalid order status', 'ORDER_STATUS_INVALID');
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
    }

    // Prevent no-op transitions
    if (order.status === nextStatus) {
      throw new ApiError(
        400,
        `Order is already ${nextStatus}`,
        'ORDER_STATUS_NOOP'
      );
    }

    const isAdmin = req.user.role === 'admin';

    // Only admins can confirm or complete orders
    if (
      [ORDER_STATUS.CONFIRMED, ORDER_STATUS.COMPLETED].includes(nextStatus) &&
      !isAdmin
    ) {
      throw new ApiError(
        403,
        'Only admin can perform this action',
        'ORDER_ADMIN_ONLY'
      );
    }

    // Users can only cancel while still PENDING or PAID
    if (nextStatus === ORDER_STATUS.CANCELLED && !isAdmin) {
      const cancellable = [ORDER_STATUS.PENDING, ORDER_STATUS.PAID];
      if (!cancellable.includes(order.status)) {
        throw new ApiError(
          403,
          'Order can no longer be cancelled',
          'ORDER_CANNOT_CANCEL'
        );
      }
    }

    // Validate lifecycle transition via model method
    if (!order.canTransitionTo(nextStatus)) {
      throw new ApiError(
        400,
        `Invalid transition from ${order.status} to ${nextStatus}`,
        'ORDER_INVALID_TRANSITION'
      );
    }

    order.status = nextStatus;
    await order.save();

    await order.populate('items.product', PRODUCT_FIELDS);

    res.json(order);
  } catch (err) {
    next(err);
  }
};
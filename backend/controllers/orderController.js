const mongoose = require("mongoose");
const { Order, ORDER_STATUS } = require("../models/Order");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, customerName, phone, city, address, notes } = req.body;

    if (!items || items.length === 0) {
      throw new ApiError(400, "Order items missing", "ORDER_ITEMS_MISSING");
    }

    if (!customerName || !phone || !city || !address) {
      throw new ApiError(
        400,
        "Customer details required (name, phone, city, address)",
        "CUSTOMER_DETAILS_MISSING"
      );
    }

    let totalPrice = 0;
    const orderItems = [];
    const productIds = items.map(item => item.productId);

    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
      if (
        typeof item.quantity !== "number" ||
        item.quantity <= 0 ||
        !Number.isInteger(item.quantity)
      ) {
        throw new ApiError(
          400,
          `Invalid quantity for product ${item.productId}`,
          "INVALID_QUANTITY"
        );
      }

      const product = productMap.get(item.productId.toString());
      if (!product) {
        throw new ApiError(
          404,
          `Product ${item.productId} not found`,
          "PRODUCT_NOT_FOUND"
        );
      }

      if (item.quantity > product.stock) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          "INSUFFICIENT_STOCK"
        );
      }

      totalPrice += product.price * item.quantity;
      orderItems.push({ product: product._id, quantity: item.quantity });
    }

    const order = new Order({
      user: req.user._id,
      customerName,
      phone,
      city,
      address,
      notes,
      items: orderItems,
      totalPrice,
      status: ORDER_STATUS.PENDING,
    });

    await order.save({ session });

    for (const item of items) {
      const updateResult = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        throw new ApiError(
          409,
          "Stock changed during order processing. Please try again.",
          "STOCK_CONFLICT"
        );
      }
    }

    await session.commitTransaction();
    await order.populate("items.product", "name price brand imageUrl");

    res.status(201).json({ success: true, order });

  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}; // ← createOrder ends HERE

// GET /orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price brand imageUrl");

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// GET /orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name price brand imageUrl");

    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new ApiError(403, "Access denied", "FORBIDDEN");
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// GET /orders (Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const total  = await Order.countDocuments();
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email")
      .populate("items.product", "name price brand imageUrl");

    res.json({ total, page, pages: Math.ceil(total / limit), orders });
  } catch (err) {
    next(err);
  }
};

// PUT /orders/:id/status (Admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (!order.canTransitionTo(status)) {
      throw new ApiError(
        400,
        `Cannot transition from ${order.status} to ${status}`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const wasCancelled = status === ORDER_STATUS.CANCELLED;

    order.status = status;
    await order.save();

    if (wasCancelled) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    await order.populate("items.product", "name price brand imageUrl");

    res.json(order);
  } catch (err) {
    next(err);
  }
};
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

// GET /cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product", "name price imageUrl");

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// POST /cart/add
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    const qty = quantity && quantity > 0 ? quantity : 1;

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// DELETE /cart/remove/:productId
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      throw new ApiError(404, "Cart not found", "CART_NOT_FOUND");
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      throw new ApiError(
        404,
        "Product not in cart",
        "CART_ITEM_NOT_FOUND"
      );
    }

    if (quantity && quantity > 0) {
      cart.items[itemIndex].quantity -= quantity;

      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
    } else {
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// DELETE /cart/clear
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      throw new ApiError(404, "Cart not found", "CART_NOT_FOUND");
    }

    cart.items = [];
    await cart.save();

    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
};

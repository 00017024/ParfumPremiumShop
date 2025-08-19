const Cart = require('../models/Cart');
const Product = require('../models/Product');

// GET /cart (get logged-in user cart)
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price imageUrl');
    if (!cart) {
      return res.json({ items: [] }); // return empty cart
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /cart/add (add product to cart)
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Product already in cart → update quantity
      cart.items[itemIndex].quantity += quantity || 1;
    } else {
      // Add new product
      cart.items.push({ product: productId, quantity: quantity || 1 });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /cart/remove/:productId (remove single product)
// DELETE /cart/remove/:productId
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body; // optional

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Product not in cart' });
    }

    if (quantity && quantity > 0) {
      // decrease quantity
      cart.items[itemIndex].quantity -= quantity;
      if (cart.items[itemIndex].quantity <= 0) {
        // remove completely if no quantity left
        cart.items.splice(itemIndex, 1);
      }
    } else {
      // remove all if no quantity provided
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


// DELETE /cart/clear (clear entire cart)
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = [];
    await cart.save();

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

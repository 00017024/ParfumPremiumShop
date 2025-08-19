const Product = require('../models/Product');

// @desc Get all products with filtering/sorting
// @route GET /products
exports.getProducts = async (req, res) => {
  try {
    let query = {};
    let sort = {};

    // Filtering
    if (req.query.brand) query.brand = req.query.brand;
    if (req.query.newArrival) query.newArrival = req.query.newArrival === 'true';

    // Sorting
    if (req.query.sort) {
      const order = req.query.order === 'desc' ? -1 : 1;
      sort[req.query.sort] = order;
    }

    const products = await Product.find(query).sort(sort);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc Get product by ID
// @route GET /products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc Add product (Admin only)
// @route POST /products
exports.addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: 'Invalid product data' });
  }
};

// @desc Update product (Admin only)
// @route PUT /products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: 'Invalid update data' });
  }
};

// @desc Delete product (Admin only)
// @route DELETE /products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

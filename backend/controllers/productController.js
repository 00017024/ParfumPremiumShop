const Product = require('../models/Product');

// @desc Get all products with filtering/sorting
// @route GET /products
// GET /products?search=chanel&page=1&limit=10&sort=price&order=asc
const getProducts = async (req, res) => {
  try {
    let { search, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // Search by name or brand (case-insensitive)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Count total for pagination info
    const total = await Product.countDocuments(query);

    // Fetch products with pagination and sorting
    const products = await Product.find(query)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

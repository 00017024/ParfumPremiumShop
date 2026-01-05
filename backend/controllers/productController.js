const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

// GET /products
// /products?search=chanel&page=1&limit=10&sort=price&order=asc
exports.getProducts = async (req, res, next) => {
  try {
    let {
      search,
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc"
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } }
      ];
    }

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (err) {
    next(err);
  }
};

// GET /products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
};

// POST /products (Admin)
exports.addProduct = async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    throw new ApiError(
      400,
      "Invalid product data",
      "PRODUCT_INVALID_DATA"
    );
  }
};

// PUT /products/:id (Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    res.json(product);
  } catch (err) {
    next(
      err instanceof ApiError
        ? err
        : new ApiError(400, "Invalid update data", "PRODUCT_UPDATE_INVALID")
    );
  }
};

// DELETE /products/:id (Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "price", "name"]);

// Maps each product type to its exclusive profile field.
// Used to auto-unset incompatible profiles on type change.
const PROFILE_FOR_TYPE = {
  perfume:   "scentProfile",
  skincare:  "skincareProfile",
  cosmetics: "cosmeticsProfile",
};
const ALL_PROFILES = Object.values(PROFILE_FOR_TYPE);

// GET /products
exports.getProducts = async (req, res, next) => {
  try {
    let {
      search,
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc"
    } = req.query;

    page  = Math.max(1, parseInt(page, 10)  || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    if (!ALLOWED_SORT_FIELDS.has(sort)) sort = "createdAt";

    const query = {};

    if (search) {
      // Escape special regex chars to prevent ReDoS
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { brand: { $regex: escaped, $options: "i" } }
      ];
    }

    if (req.query.category) {
      query.categories = req.query.category;
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
    if (err instanceof ApiError) return next(err);
    // Surface Mongoose ValidationError and hook errors (e.g. profile mismatch)
    if (err.name === "ValidationError" || err.message?.startsWith("Profile mismatch")) {
      return next(new ApiError(400, err.message, "VALIDATION_ERROR"));
    }
    next(new ApiError(400, "Invalid product data", "PRODUCT_INVALID_DATA"));
  }
};

// PUT /products/:id (Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    // When type is changing, build a $set/$unset document so that profiles
    // incompatible with the new type are atomically removed in the same write.
    // No extra DB read is needed — the new type is known from the request body.
    let updateDoc = req.body;

    if (req.body.type) {
      const allowedProfile = PROFILE_FOR_TYPE[req.body.type];
      const toUnset = {};

      for (const profile of ALL_PROFILES) {
        // Only $unset profiles the caller isn't explicitly setting.
        // (Setting an incompatible profile is rejected by the Mongoose hook.)
        if (profile !== allowedProfile && req.body[profile] == null) {
          toUnset[profile] = "";
        }
      }

      if (Object.keys(toUnset).length > 0) {
        updateDoc = { $set: req.body, $unset: toUnset };
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateDoc,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    res.json(product);
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    // Surface Mongoose ValidationError and hook errors (e.g. profile mismatch)
    if (err.name === "ValidationError" || err.message?.startsWith("Profile mismatch")) {
      return next(new ApiError(400, err.message, "VALIDATION_ERROR"));
    }
    next(new ApiError(400, "Invalid update data", "PRODUCT_UPDATE_INVALID"));
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

const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "price", "name"]);
const ACCORD_FIELDS = ["woody", "musky", "sweet", "citrus", "floral", "spicy", "powdery", "fresh"];

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

    if (req.query.type && ["perfume", "skincare", "cosmetics"].includes(req.query.type)) {
      query.type = req.query.type;
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

// GET /products/filter/perfume
// Scores perfumes by distance from user's accord preferences (lower = better match).
exports.filterPerfumes = async (req, res, next) => {
  try {
    const preferences = {};
    for (const accord of ACCORD_FIELDS) {
      const raw = req.query[accord];
      if (raw !== undefined) {
        const val = parseFloat(raw);
        if (!isNaN(val) && val >= 0 && val <= 10) {
          preferences[accord] = val;
        }
      }
    }

    const prefKeys = Object.keys(preferences);

    if (prefKeys.length === 0) {
      const all = await Product.find({ type: "perfume" });
      return res.json({ products: all, total: all.length });
    }

    // Pre-filter in MongoDB: each selected accord must be >= floor(target/2).
    // Eliminates clearly irrelevant products before JS scoring.
    const preFilter = { type: "perfume" };
    for (const key of prefKeys) {
      preFilter[`scentProfile.${key}`] = { $gte: Math.max(0, Math.floor(preferences[key] / 2)) };
    }
    const perfumes = await Product.find(preFilter);

    const scored = perfumes.map((p) => {
      const profile = p.scentProfile || {};
      const totalDiff = prefKeys.reduce(
        (sum, key) => sum + Math.abs((profile[key] ?? 0) - preferences[key]),
        0
      );
      // Normalized: average absolute difference across selected accords
      return { product: p, score: totalDiff / prefKeys.length };
    });

    scored.sort((a, b) => a.score - b.score);

    res.json({ products: scored.map((s) => s.product), total: scored.length });
  } catch (err) {
    next(err);
  }
};

// GET /products/filter/skincare
// Scores skincare products by overlapping ingredients (×2) and skin types (×1).
exports.filterSkincare = async (req, res, next) => {
  try {
    const ingredientList = req.query.ingredients
      ? req.query.ingredients.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];
    const skinTypeList = req.query.skinTypes
      ? req.query.skinTypes.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const skincareProducts = await Product.find({ type: "skincare" });

    if (ingredientList.length === 0 && skinTypeList.length === 0) {
      return res.json({ products: skincareProducts, total: skincareProducts.length });
    }

    const scored = skincareProducts.map((p) => {
      const profile = p.skincareProfile || {};
      const productIngredients = (profile.ingredients || []).map((i) => i.toLowerCase());
      const productSkinTypes = (profile.skinTypes || []).map((s) => s.toLowerCase());

      const matchIngredients = ingredientList.filter((i) => productIngredients.includes(i)).length;
      const matchSkinTypes = skinTypeList.filter((s) => productSkinTypes.includes(s)).length;

      return { product: p, score: matchIngredients * 2 + matchSkinTypes };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json({ products: scored.map((s) => s.product), total: scored.length });
  } catch (err) {
    next(err);
  }
};

// GET /products/filter/cosmetics
// Filters cosmetics by color family (exact match). No scoring needed.
exports.filterCosmetics = async (req, res, next) => {
  try {
    const colorList = req.query.colors
      ? req.query.colors.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const query = { type: "cosmetics" };
    if (colorList.length > 0) {
      query["cosmeticsProfile.colors"] = { $in: colorList };
    }

    const products = await Product.find(query);
    res.json({ products, total: products.length });
  } catch (err) {
    next(err);
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

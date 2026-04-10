const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const { profileToVector, hasAnyAccord, cosineSimilarity } = require("../utils/similarity");

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "price", "name"]);
const ACCORD_FIELDS = ["woody", "oriental", "sweet", "citrus", "floral", "spicy", "powdery", "fresh"];

// Maps each product type to its exclusive profile field.
// Used to auto-unset incompatible profiles on type change.
const PROFILE_FOR_TYPE = {
  perfume:   "perfumeProfile",
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
      query.category = req.query.category;
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
// Ranks perfumes by cosine similarity against the user's accord preferences.
exports.filterPerfumes = async (req, res, next) => {
  try {
    // Collect only accords the user actively set (value > 0).
    // Accords left at 0 mean "no preference" and must not anchor the vector.
    const preferences = {};
    for (const accord of ACCORD_FIELDS) {
      const raw = req.query[accord];
      if (raw !== undefined) {
        const val = parseFloat(raw);
        if (!isNaN(val) && val > 0 && val <= 10) {
          preferences[accord] = val;
        }
      }
    }

    const prefKeys = Object.keys(preferences);

    // No active preferences — return all perfumes unscored.
    if (prefKeys.length === 0) {
      const all = await Product.find({ type: "perfume" });
      return res.json({ products: all, total: all.length });
    }

    // Light pre-filter: product must have > 0 on at least one selected accord.
    // Uses $or so a product only needs to match one dimension, not all of them.
    // This avoids throwing away valid partial matches while still skipping
    // products with zero overlap on every requested accord.
    const preFilter = {
      type: "perfume",
      $or: prefKeys.map((key) => ({ [`perfumeProfile.${key}`]: { $gt: 0 } })),
    };
    const perfumes = await Product.find(preFilter);

    // Build the full 8-dimensional user preference vector.
    // Unselected accords remain 0 — direction is set only by what the user chose.
    const prefVector = profileToVector(preferences);

    // Score by cosine similarity (range [0, 1]).
    // Higher = closer directional match. Sort descending so best matches come first.
    const scored = perfumes
      .map((p) => ({
        product: p,
        score:   cosineSimilarity(prefVector, profileToVector(p.perfumeProfile || {})),
      }))
      .sort((a, b) => b.score - a.score);

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

// GET /products/:id/recommendations
// Returns similar products based on the source product's type:
//   perfume   → cosine similarity on 8-dimensional accord vector
//   skincare  → weighted overlap (ingredients ×2, skinTypes ×1)
//   cosmetics → no recommendations (returns empty array)
//
// Query params:
//   ?limit=N  — number of results to return (default 5, max 20)
exports.getRecommendations = async (req, res, next) => {
  try {
    const source = await Product.findById(req.params.id).lean();
    if (!source) throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");

    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));

    // ── Cosmetics: no recommendation algorithm defined ─────────────────────
    if (source.type === "cosmetics") {
      return res.json({ success: true, data: [] });
    }

    // ── Perfume: cosine similarity ─────────────────────────────────────────
    if (source.type === "perfume") {
      const sourceProfile = source.perfumeProfile || {};

      // Pre-filter: source must have at least one non-zero accord.
      // A zero vector has no direction — similarity against it is meaningless.
      if (!hasAnyAccord(sourceProfile)) {
        return res.json({ success: true, data: [] });
      }

      const sourceVec = profileToVector(sourceProfile);

      // Fetch all other perfumes. MongoDB pre-filter: at least one accord
      // field must be >= 1 to discard products with empty profiles early.
      const candidates = await Product.find({
        type: "perfume",
        _id:  { $ne: source._id },
        $or:  [
          { "perfumeProfile.woody":   { $gte: 1 } },
          { "perfumeProfile.oriental": { $gte: 1 } },
          { "perfumeProfile.sweet":   { $gte: 1 } },
          { "perfumeProfile.citrus":  { $gte: 1 } },
          { "perfumeProfile.floral":  { $gte: 1 } },
          { "perfumeProfile.spicy":   { $gte: 1 } },
          { "perfumeProfile.powdery": { $gte: 1 } },
          { "perfumeProfile.fresh":   { $gte: 1 } },
        ],
      }).lean();

      const scored = candidates
        // JS-level guard: skip anything that still has a zero vector
        .filter((p) => hasAnyAccord(p.perfumeProfile))
        .map((p) => ({
          score:   cosineSimilarity(sourceVec, profileToVector(p.perfumeProfile)),
          product: p,
        }))
        .filter((s) => s.score > 0)   // omit truly orthogonal profiles
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return res.json({
        success: true,
        data: scored.map(({ product, score }) => ({
          _id:            product._id,
          name:           product.name,
          brand:          product.brand,
          price:          product.price,
          stock:          product.stock,
          imageUrl:       product.imageUrl,
          type:           product.type,
          perfumeProfile: product.perfumeProfile,
          score:          Math.round(score * 1000) / 1000,
        })),
      });
    }

    // ── Skincare: weighted ingredient + skinType overlap ───────────────────
    if (source.type === "skincare") {
      const srcProfile     = source.skincareProfile || {};
      const srcIngredients = new Set((srcProfile.ingredients || []).map((s) => s.toLowerCase()));
      const srcSkinTypes   = new Set((srcProfile.skinTypes   || []).map((s) => s.toLowerCase()));

      const candidates = await Product.find({
        type: "skincare",
        _id:  { $ne: source._id },
      }).lean();

      const scored = candidates
        .map((p) => {
          const prof        = p.skincareProfile || {};
          const ingredients = (prof.ingredients || []).map((s) => s.toLowerCase());
          const skinTypes   = (prof.skinTypes   || []).map((s) => s.toLowerCase());

          // Deduplicate before counting to be safe (enum toggle UI prevents
          // duplicates at creation time, but guard here regardless).
          const matchIngredients = [...new Set(ingredients)].filter((i) => srcIngredients.has(i)).length;
          const matchSkinTypes   = [...new Set(skinTypes)]  .filter((s) => srcSkinTypes.has(s)).length;

          return {
            score:   matchIngredients * 2 + matchSkinTypes,
            product: p,
          };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return res.json({
        success: true,
        data: scored.map(({ product, score }) => ({
          _id:             product._id,
          name:            product.name,
          brand:           product.brand,
          price:           product.price,
          stock:           product.stock,
          imageUrl:        product.imageUrl,
          type:            product.type,
          skincareProfile: product.skincareProfile,
          score,
        })),
      });
    }

    // Unknown type — return empty rather than 500
    res.json({ success: true, data: [] });
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

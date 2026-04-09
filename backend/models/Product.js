const mongoose = require("mongoose");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const perfumeProfileSchema = new mongoose.Schema(
  {
    woody:    { type: Number, min: 0, max: 10 },
    oriental: { type: Number, min: 0, max: 10 },
    sweet:    { type: Number, min: 0, max: 10 },
    citrus:   { type: Number, min: 0, max: 10 },
    floral:   { type: Number, min: 0, max: 10 },
    spicy:    { type: Number, min: 0, max: 10 },
    powdery:  { type: Number, min: 0, max: 10 },
    fresh:    { type: Number, min: 0, max: 10 },
  },
  { _id: false }
);

const skincareProfileSchema = new mongoose.Schema(
  {
    skinTypes:   [{ type: String, enum: ["dry", "oily", "combination", "sensitive", "normal"] }],
    ingredients: [{ type: String, enum: ["aloe vera", "snail mucin", "collagen", "hyaluronic acid", "salicylic acid", "niacinamide", "vitamin C", "retinol"] }],
  },
  { _id: false }
);

const cosmeticsProfileSchema = new mongoose.Schema(
  {
    colors: [{ type: String, enum: ["nude", "red", "pink", "brown", "coral"] }],
  },
  { _id: false }
);

// ─── Profile map: which profile belongs to which type ─────────────────────────

const PROFILE_FOR_TYPE = {
  perfume:   "perfumeProfile",
  skincare:  "skincareProfile",
  cosmetics: "cosmeticsProfile",
};

const ALL_PROFILES = Object.values(PROFILE_FOR_TYPE);

// ─── Main schema ──────────────────────────────────────────────────────────────

const productSchema = new mongoose.Schema(
  {
    // ── Existing fields (unchanged) ──────────────────────────────────────────
    name:        { type: String, required: true },
    brand:       { type: String, required: true },
    price:       { type: Number, required: true },
    description: { type: String },
    newArrival:  { type: Boolean, default: false },
    imageUrl:    { type: String },
    stock:       { type: Number, default: 0 },

    // ── New fields ────────────────────────────────────────────────────────────

    // Product type — defaults to "perfume" so existing documents are unaffected
    type: {
      type:    String,
      enum:    ["perfume", "skincare", "cosmetics"],
      default: "perfume",
    },

    // Audience segmentation
    category: {
      type: String,
      enum: ["men", "women", "unisex"],
    },

    // Type-specific profiles — all optional; only one may be set per product
    perfumeProfile:   { type: perfumeProfileSchema,   default: undefined },
    skincareProfile:  { type: skincareProfileSchema,  default: undefined },
    cosmeticsProfile: { type: cosmeticsProfileSchema, default: undefined },
  },
  { timestamps: true }
);

// ─── Step 3: Pre-validation hook (save / create path) ─────────────────────────
//
// Runs on:  new Product(...).save()
// Does NOT run on: findByIdAndUpdate (covered by pre("findOneAndUpdate") below)
//
// Rule: a product may only carry the profile that matches its `type`.
//   perfume   → only perfumeProfile
//   skincare  → only skincareProfile
//   cosmetics → only cosmeticsProfile

productSchema.pre("validate", function (next) {
  const productType    = this.type || "perfume";
  const allowedProfile = PROFILE_FOR_TYPE[productType];

  for (const profile of ALL_PROFILES) {
    if (profile !== allowedProfile && this[profile] != null) {
      return next(
        new Error(
          `Profile mismatch: "${profile}" is not allowed for product type "${productType}". ` +
          `Only "${allowedProfile}" is permitted.`
        )
      );
    }
  }

  next();
});

// ─── Step 3: Pre-update hook (update path) ────────────────────────────────────
//
// Runs on: findByIdAndUpdate / findOneAndUpdate
//
// Checks the incoming update payload for two invalid conditions:
//   1. Multiple profiles in the same update body.
//   2. A profile that contradicts a `type` field being set in the same update.

productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Flatten plain fields from both direct assignment and $set operator
  const data = {};
  for (const [key, val] of Object.entries(update)) {
    if (!key.startsWith("$")) data[key] = val;
  }
  if (update.$set) Object.assign(data, update.$set);

  const presentProfiles = ALL_PROFILES.filter((p) => data[p] != null);

  // Nothing profile-related in this update — nothing to check
  if (presentProfiles.length === 0) return next();

  // Two or more profiles in the same update body — always invalid
  if (presentProfiles.length > 1) {
    return next(
      new Error(
        `Profile mismatch: cannot set multiple profiles (${presentProfiles.join(", ")}) in the same update.`
      )
    );
  }

  // One profile present — if `type` is also being set, they must agree
  if (data.type) {
    const allowedProfile = PROFILE_FOR_TYPE[data.type];
    if (presentProfiles[0] !== allowedProfile) {
      return next(
        new Error(
          `Profile mismatch: "${presentProfiles[0]}" is not allowed for product type "${data.type}". ` +
          `Only "${allowedProfile}" is permitted.`
        )
      );
    }
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);

const Joi = require("joi");

// ─── Reusable profile sub-schemas ─────────────────────────────────────────────
// All fields within each profile are optional — no required sub-fields.

const scentProfileSchema = Joi.object({
  woody:   Joi.number().min(0).max(10),
  musky:   Joi.number().min(0).max(10),
  sweet:   Joi.number().min(0).max(10),
  citrus:  Joi.number().min(0).max(10),
  floral:  Joi.number().min(0).max(10),
  spicy:   Joi.number().min(0).max(10),
  powdery: Joi.number().min(0).max(10),
  fresh:   Joi.number().min(0).max(10),
});

const skincareProfileSchema = Joi.object({
  skinType:    Joi.array().items(Joi.string().valid("dry", "oily", "combination", "sensitive", "normal")),
  concerns:    Joi.array().items(Joi.string().valid("acne", "aging", "hydration", "pigmentation", "pores")),
  ingredients: Joi.array().items(Joi.string()),
  routineStep: Joi.array().items(Joi.string().valid("cleanser", "toner", "serum", "moisturizer", "sunscreen")),
  timeOfUse:   Joi.array().items(Joi.string().valid("day", "night", "both")),
});

const cosmeticsProfileSchema = Joi.object({
  productType: Joi.array().items(Joi.string().valid("foundation", "lipstick", "mascara", "eyeliner", "blush")),
  finish:      Joi.array().items(Joi.string().valid("matte", "glow", "satin", "dewy")),
  coverage:    Joi.array().items(Joi.string().valid("light", "medium", "full")),
  colorFamily: Joi.array().items(Joi.string().valid("nude", "red", "pink", "brown", "coral")),
});

// ─── Create schema ────────────────────────────────────────────────────────────

exports.createProductSchema = Joi.object({
  // Existing fields — behaviour unchanged
  name:        Joi.string().min(2).required(),
  brand:       Joi.string().required(),
  price:       Joi.number().min(0).required(),
  description: Joi.string().allow("", null),
  imageUrl:    Joi.string().uri().optional(),
  stock:       Joi.number().integer().min(0).optional(),
  categories:  Joi.array().items(Joi.string()).optional(),
  popularity:  Joi.number().min(0).optional(),
  newArrival:  Joi.boolean().optional(),
  rating:      Joi.number().min(0).max(5).optional(),

  // New fields — all optional; validated but never required
  type:     Joi.string().valid("perfume", "skincare", "cosmetics").optional(),
  category: Joi.string().valid("men", "women", "unisex", "skincare", "makeup").optional(),

  scentProfile:     scentProfileSchema.optional(),
  skincareProfile:  skincareProfileSchema.optional(),
  cosmeticsProfile: cosmeticsProfileSchema.optional(),
});

// ─── Update schema ────────────────────────────────────────────────────────────

exports.updateProductSchema = Joi.object({
  // Existing fields — behaviour unchanged
  name:        Joi.string().min(2).optional(),
  brand:       Joi.string().optional(),
  price:       Joi.number().min(0).optional(),
  description: Joi.string().allow("", null).optional(),
  imageUrl:    Joi.string().uri().optional(),
  stock:       Joi.number().integer().min(0).optional(),
  categories:  Joi.array().items(Joi.string()).optional(),
  popularity:  Joi.number().min(0).optional(),
  newArrival:  Joi.boolean().optional(),
  rating:      Joi.number().min(0).max(5).optional(),

  // New fields — all optional
  type:     Joi.string().valid("perfume", "skincare", "cosmetics").optional(),
  category: Joi.string().valid("men", "women", "unisex", "skincare", "makeup").optional(),

  scentProfile:     scentProfileSchema.optional(),
  skincareProfile:  skincareProfileSchema.optional(),
  cosmeticsProfile: cosmeticsProfileSchema.optional(),
}).min(1);

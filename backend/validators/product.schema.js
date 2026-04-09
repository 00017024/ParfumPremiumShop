"use strict";

const Joi = require("joi");

// ─── Domain constants ─────────────────────────────────────────────────────────

const PRODUCT_TYPES = ["perfume", "skincare", "cosmetics"];

const ACCORD_KEYS = [
  "woody", "citrus", "floral", "oriental",
  "fresh", "spicy",  "sweet",  "powdery",
];

const SKIN_TYPES = ["dry", "oily", "combination", "normal", "sensitive"];

const INGREDIENTS = [
  "aloe vera",      "snail mucin",    "collagen",       "hyaluronic acid",
  "salicylic acid", "niacinamide",    "vitamin C",      "retinol",
];

// ─── Profile sub-schemas ──────────────────────────────────────────────────────

/**
 * Accord fields are flat (not nested under an 'accords' key) so MongoDB
 * dot-notation queries work at one depth level: { "perfumeProfile.woody": { $gte: 5 } }
 *
 * Custom validator enforces the rule: at least one accord must be > 0.
 */
const perfumeProfileSchema = Joi.object(
  Object.fromEntries(
    ACCORD_KEYS.map((key) => [key, Joi.number().min(0).max(10).default(0)])
  )
).custom((value, helpers) => {
  const hasAccord = ACCORD_KEYS.some((k) => (value[k] ?? 0) > 0);
  if (!hasAccord) {
    return helpers.message(
      "Perfume must have at least one accord value greater than 0"
    );
  }
  return value;
});

const skincareProfileSchema = Joi.object({
  skinTypes: Joi.array()
    .items(
      Joi.string()
        .valid(...SKIN_TYPES)
        .messages({ "any.only": '"{{#value}}" is not a valid skin type' })
    )
    .optional(),

  ingredients: Joi.array()
    .items(
      Joi.string()
        .valid(...INGREDIENTS)
        .messages({
          "any.only": '"{{#value}}" is not a recognised ingredient',
        })
    )
    .min(1)
    .required()
    .messages({
      "array.min":    "Skincare product must list at least one ingredient",
      "any.required": "Skincare product must include an ingredients list",
    }),
});

const cosmeticsProfileSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string().valid("nude", "red", "pink", "brown", "coral"))
    .optional(),
});

// ─── Profile routing map ──────────────────────────────────────────────────────

// Single source of truth — mirrors the Mongoose model's PROFILE_FOR_TYPE map.
const PROFILE_FOR_TYPE = {
  perfume:   "perfumeProfile",
  skincare:  "skincareProfile",
  cosmetics: "cosmeticsProfile",
};

const ALL_PROFILES = Object.values(PROFILE_FOR_TYPE);

// ─── Base field definitions ───────────────────────────────────────────────────

// Fields shared by create and update; update schema marks them all optional.
const BASE_FIELDS = {
  name:        Joi.string().trim().min(2),
  brand:       Joi.string().trim(),
  price:       Joi.number().min(0),
  description: Joi.string().allow("", null),
  imageUrl:    Joi.string().uri(),
  stock:       Joi.number().integer().min(0),
  newArrival:  Joi.boolean(),
  // `category` = audience segmentation (gender/demographic)
  category:    Joi.string().valid("men", "women", "unisex"),
};

// ─── Create schema ────────────────────────────────────────────────────────────
//
// `type` is required on create → Joi can always evaluate the conditional
// profile rules at validation time. Profiles are mandatory or forbidden
// based on which type was declared.

exports.createProductSchema = Joi.object({
  // Required base fields
  name:  BASE_FIELDS.name.required(),
  brand: BASE_FIELDS.brand.required(),
  price: BASE_FIELDS.price.required(),

  // Optional base fields
  description: BASE_FIELDS.description.optional(),
  imageUrl:    BASE_FIELDS.imageUrl.optional(),
  stock:       BASE_FIELDS.stock.optional(),
  newArrival:  BASE_FIELDS.newArrival.optional(),
  category:    BASE_FIELDS.category.optional(),

  // Primary type discriminator
  type: Joi.string()
    .valid(...PRODUCT_TYPES)
    .required()
    .messages({
      "any.required": '"type" is required — must be one of: perfume, skincare, cosmetics',
      "any.only":     '"type" must be one of: perfume, skincare, cosmetics',
    }),

  // ── Conditional profiles ───────────────────────────────────────────────────
  // Only the profile matching `type` is accepted; all others are forbidden.

  perfumeProfile: Joi.when("type", {
    is:        "perfume",
    then:      perfumeProfileSchema.required().messages({
      "any.required": "Perfume products must include a perfumeProfile",
    }),
    otherwise: Joi.forbidden(),
  }),

  skincareProfile: Joi.when("type", {
    is:        "skincare",
    then:      skincareProfileSchema.required().messages({
      "any.required": "Skincare products must include a skincareProfile",
    }),
    otherwise: Joi.forbidden(),
  }),

  cosmeticsProfile: Joi.when("type", {
    is:        "cosmetics",
    then:      cosmeticsProfileSchema.optional(),
    otherwise: Joi.forbidden(),
  }),
});

// ─── Update schema ────────────────────────────────────────────────────────────
//
// All base fields optional; at least one field must be present (.min(1)).
//
// `type` optional on update.
//   – Present  → the matching profile is allowed; all others are forbidden.
//   – Absent   → any single profile is accepted (Mongoose pre-update hook
//                verifies DB-level consistency with the stored type).
//
// Cross-field rule: two or more profiles in one update → rejected.
// Profile rule:     if a profile is provided it must still pass all its own
//                   validation rules (e.g. at-least-one-accord, min-ingredients).

exports.updateProductSchema = Joi.object({
  // All base fields optional
  name:        BASE_FIELDS.name.optional(),
  brand:       BASE_FIELDS.brand.optional(),
  price:       BASE_FIELDS.price.optional(),
  description: BASE_FIELDS.description.optional(),
  imageUrl:    BASE_FIELDS.imageUrl.optional(),
  stock:       BASE_FIELDS.stock.optional(),
  newArrival:  BASE_FIELDS.newArrival.optional(),
  category:    BASE_FIELDS.category.optional(),

  type: Joi.string().valid(...PRODUCT_TYPES).optional(),

  // ── Conditional profile rules ──────────────────────────────────────────────
  //
  // switch evaluates in order; first match wins.
  //   case 1 — type matches this profile's owner  → profile allowed (optional)
  //   case 2 — type exists but owns another profile → profile forbidden
  //   otherwise (type absent)                      → profile allowed (optional)
  //             Mongoose hook enforces DB-level type consistency.

  perfumeProfile: Joi.when("type", {
    switch: [
      {
        is:   "perfume",
        then: perfumeProfileSchema.optional(),
      },
      {
        is:   Joi.exist(),   // type set, but not "perfume"
        then: Joi.forbidden(),
      },
    ],
    otherwise: perfumeProfileSchema.optional(),
  }),

  skincareProfile: Joi.when("type", {
    switch: [
      {
        is:   "skincare",
        then: skincareProfileSchema.optional(),
      },
      {
        is:   Joi.exist(),
        then: Joi.forbidden(),
      },
    ],
    otherwise: skincareProfileSchema.optional(),
  }),

  cosmeticsProfile: Joi.when("type", {
    switch: [
      {
        is:   "cosmetics",
        then: cosmeticsProfileSchema.optional(),
      },
      {
        is:   Joi.exist(),
        then: Joi.forbidden(),
      },
    ],
    otherwise: cosmeticsProfileSchema.optional(),
  }),
})
  .min(1)
  // Cross-field rule: never allow two profiles in one update payload.
  .custom((value, helpers) => {
    const present = ALL_PROFILES.filter((p) => value[p] != null);
    if (present.length > 1) {
      return helpers.message(
        `Cannot set multiple profiles in one update: ${present.join(", ")}`
      );
    }
    return value;
  });

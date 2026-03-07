const Joi = require("joi");

// validators/cart.schema.js
exports.addToCartSchema = Joi.object({
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  quantity: Joi.number().integer().min(1).max(999).default(1)
});
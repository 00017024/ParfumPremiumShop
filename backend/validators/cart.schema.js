const Joi = require("joi");

exports.addToCartSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).optional()
});

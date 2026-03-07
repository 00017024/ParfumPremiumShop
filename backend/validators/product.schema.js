const Joi = require("joi");

exports.createProductSchema = Joi.object({
  name: Joi.string().min(2).required(),
  brand: Joi.string().required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().allow("", null),
  imageUrl: Joi.string().uri().optional(),
  stock: Joi.number().integer().min(0).optional(),
  categories: Joi.array().items(Joi.string()).optional()
});

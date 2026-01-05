const Joi = require("joi");

exports.createProductSchema = Joi.object({
  name: Joi.string().min(2).required(),
  price: Joi.number().min(0).required(),
  brand: Joi.string().required(),
  description: Joi.string().allow(""),
  imageUrl: Joi.string().uri().optional()
});

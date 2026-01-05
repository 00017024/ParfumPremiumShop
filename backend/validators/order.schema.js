const Joi = require("joi");

exports.updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("PENDING", "PAID", "CONFIRMED", "COMPLETED", "CANCELLED")
    .required()
});

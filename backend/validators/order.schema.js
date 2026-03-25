const Joi = require("joi");
const { UZ_PHONE_REGEX, UZ_PHONE_MESSAGE } = require('../validators/phone');

exports.createOrderSchema = Joi.object({
  customerName: Joi.string().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(UZ_PHONE_REGEX)
    .message(UZ_PHONE_MESSAGE)
    .required(),
  city: Joi.string().valid("Tashkent", "Samarkand").required(),
  address: Joi.string().min(5).max(300).required(),
  notes: Joi.string().max(500).allow("", null).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});

exports.updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("PENDING", "PAID", "CONFIRMED", "COMPLETED", "CANCELLED")
    .required(),
});
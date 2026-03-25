const Joi = require("joi");
const { UZ_PHONE_REGEX, UZ_PHONE_MESSAGE } = require('../validators/phone');

exports.registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string()
    .pattern(UZ_PHONE_REGEX)
    .message(UZ_PHONE_MESSAGE)
    .required(),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});
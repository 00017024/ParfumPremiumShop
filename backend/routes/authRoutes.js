const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} = require("../validators/auth.schema");

router.post("/register",    validate(registerSchema),   authController.register);
router.post("/login",       validate(loginSchema),      authController.login);
router.post("/verify-otp",  validate(verifyOtpSchema),  authController.verifyOtp);
router.post("/resend-otp",  validate(resendOtpSchema),  authController.resendOtp);

/*
Logout does not require body validation — the token comes from the authorization header.
*/
router.post("/logout", authController.logout);

module.exports = router;

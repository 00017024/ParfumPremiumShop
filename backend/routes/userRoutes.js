const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { changePasswordSchema } = require("../validators/auth.schema");

router.get(
  "/profile",
  authMiddleware,
  userController.getProfile
);

router.put(
  "/profile",
  authMiddleware,
  userController.updateProfile
);

router.put(
  "/password",
  authMiddleware,
  validate(changePasswordSchema),
  userController.changePassword
);

module.exports = router;
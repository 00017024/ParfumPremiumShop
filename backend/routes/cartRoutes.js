const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  addToCartSchema
} = require("../validators/cart.schema");

router.get(
  "/",
  authMiddleware,
  cartController.getCart
);

router.post(
  "/add",
  authMiddleware,
  validate(addToCartSchema),
  cartController.addToCart
);

router.delete(
  "/remove/:productId",
  authMiddleware,
  cartController.removeFromCart
);

router.delete(
  "/clear",
  authMiddleware,
  cartController.clearCart
);

module.exports = router;

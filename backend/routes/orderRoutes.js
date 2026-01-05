const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
const {
  updateOrderStatusSchema
} = require("../validators/order.schema");

router.post(
  "/",
  authMiddleware,
  orderController.createOrder
);

router.get(
  "/my",
  authMiddleware,
  orderController.getMyOrders
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  orderController.getAllOrders
);

router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

module.exports = router;

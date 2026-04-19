const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
const validateObjectId = require("../middleware/validateObjectId");
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require("../validators/order.schema");

router.post(
  "/",
  authMiddleware,
  validate(createOrderSchema),
  orderController.createOrder
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  orderController.getAllOrders
);

router.get(
  "/my",
  authMiddleware,
  orderController.getMyOrders
);

router.get(
  "/:id",
  validateObjectId("id"),
  authMiddleware,
  orderController.getOrderById
);

router.put(
  "/:id/status",
  validateObjectId("id"),
  authMiddleware,
  adminMiddleware,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);


module.exports = router;
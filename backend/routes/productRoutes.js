const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
const {
  createProductSchema
} = require("../validators/product.schema");

router.get(
  "/",
  productController.getProducts
);

router.get(
  "/:id",
  productController.getProductById
);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validate(createProductSchema),
  productController.addProduct
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.deleteProduct
);

module.exports = router;

const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
const {
  createProductSchema,
  updateProductSchema
} = require("../validators/product.schema");

router.get(
  "/",
  productController.getProducts
);

// Filter routes must come before /:id to prevent Express matching "filter" as an ID param.
router.get("/filter/perfume",   productController.filterPerfumes);
router.get("/filter/skincare",  productController.filterSkincare);
router.get("/filter/cosmetics", productController.filterCosmetics);

// Two-segment route — no conflict with /:id, but kept above it for clarity.
router.get("/:id/recommendations", productController.getRecommendations);

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
  validate(updateProductSchema),
  productController.updateProduct
);

// PATCH supports the same partial-update rules as PUT.
// Both route to the same controller action; the schema handles the distinction.
router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.deleteProduct
);

module.exports = router;

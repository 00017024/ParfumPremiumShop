const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  adminController.getAllUsers
);

router.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  adminController.getUserById
);

router.put(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  adminController.updateUser
);

router.post(
  "/users/:id/block",
  authMiddleware,
  adminMiddleware,
  adminController.blockUser
);

router.post(
  "/users/:id/unblock",
  authMiddleware,
  adminMiddleware,
  adminController.unblockUser
);

module.exports = router;

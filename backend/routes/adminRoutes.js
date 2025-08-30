const express = require('express');
const { getAllUsers, getUserById, updateUser, blockUser, unblockUser } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);

// block/unblock
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);

module.exports = router;

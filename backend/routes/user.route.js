const express = require("express");
const { adminOnly, protect } = require("../middlewares/auth.middleware");
const router = express.Router();
const {
  getUsers,
  getUserById,
  deleteUser,
} = require("../controllers/user.controller");

// @desc    User management routes
// @access  adminOnly
router.get("/", protect, adminOnly, getUsers);
router.get("/:id", protect, getUserById);

module.exports = router;
